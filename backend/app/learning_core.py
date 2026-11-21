"""Original bilingual chemistry curriculum, validated independently of LLM output.

Never load copyrighted private PDF text or a public model's output as the
correct answer key. This catalog is editorial content with provenance links.
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
import hashlib
import sqlite3
from contextlib import closing
from threading import Lock
from urllib.parse import urlparse

VALID_LANGUAGES = {'id', 'en'}
VALID_RATINGS = {'again', 'hard', 'good', 'easy'}
# Leitner-inspired intervals; this is not a promise of SM-2 compliance.
INTERVAL_DAYS = {0: 0, 1: 1, 2: 3, 3: 7, 4: 14, 5: 30, 6: 60}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()


def select_locale(value: dict, lang: str) -> str:
    return value[lang]


class Catalog:
    def __init__(self, path: Path):
        self.path = Path(path).resolve()
        raw = json.loads(self.path.read_text(encoding='utf-8'))
        if raw.get('schema_version') != 1:
            raise ValueError('Unsupported curriculum schema_version')
        for group in ('topics', 'questions', 'flashcards', 'sources'):
            if not isinstance(raw.get(group), list) or not raw[group]:
                raise ValueError(f'Curriculum {group} must be a nonempty array')
            ids = [x.get('id') for x in raw[group]]
            if any(not isinstance(i, str) or not i for i in ids) or len(set(ids)) != len(ids):
                raise ValueError(f'Missing or duplicate identifiers in {group}')
        self.data = raw
        self.topics = {t['id']: t for t in raw['topics']}
        self.questions = {q['id']: q for q in raw['questions']}
        self.flashcards = {c['id']: c for c in raw['flashcards']}
        self.sources = {s['id']: s for s in raw['sources']}
        for source in raw['sources']:
            parsed = urlparse(source['url'])
            if parsed.scheme != 'https' or parsed.hostname not in {'openstax.org', 'goldbook.iupac.org'}:
                raise ValueError('Unapproved curriculum source URL')
        for topic in raw['topics']:
            self._validate_locale(topic, ('title', 'intro'))
            if not topic.get('key_points'):
                raise ValueError('Topic must have educational content')
            for point in topic['key_points']:
                self._validate_pair(point)
            self._validate_sources(topic)
        for q in raw['questions']:
            if q.get('topic_id') not in self.topics:
                raise ValueError('Question references unknown topic')
            self._validate_locale(q, ('prompt', 'explanation'))
            if len(q.get('choices', [])) != 4:
                raise ValueError('Questions require exactly four answer choices')
            choice_ids = [c['id'] for c in q['choices']]
            if len(set(choice_ids)) != 4 or q.get('correct_choice_id') not in choice_ids:
                raise ValueError('Invalid answer key')
            for choice in q['choices']:
                self._validate_locale(choice, ('text',))
            self._validate_sources(q)
        for card in raw['flashcards']:
            if card.get('topic_id') not in self.topics:
                raise ValueError('Flashcard references unknown topic')
            self._validate_locale(card, ('front', 'back'))
            self._validate_sources(card)
        self.checksum = hashlib.sha256(self.path.read_bytes()).hexdigest()

    @staticmethod
    def _validate_pair(pair: dict):
        if not isinstance(pair, dict) or any(not isinstance(pair.get(x), str) or not pair[x].strip() for x in VALID_LANGUAGES):
            raise ValueError('Missing nonempty ID/EN translation')

    def _validate_locale(self, item: dict, fields: tuple[str, ...]):
        for field in fields:
            self._validate_pair(item.get(field))

    def _validate_sources(self, item: dict):
        if not item.get('source_ids') or any(s not in self.sources for s in item['source_ids']):
            raise ValueError('Invalid learning source reference')

    def source_cards(self, ids: list[str]) -> list[dict]:
        return [{'id': sid, 'title': self.sources[sid]['title'], 'url': self.sources[sid]['url']} for sid in ids]

    def lesson(self, topic: dict, lang: str) -> dict:
        return {'id': topic['id'], 'title': select_locale(topic['title'], lang),
                'intro': select_locale(topic['intro'], lang),
                'key_points': [select_locale(p, lang) for p in topic['key_points']],
                'estimated_minutes': topic['estimated_minutes'],
                'sources': self.source_cards(topic['source_ids']),
                'editorial_status': self.data['editorial_status']}

    def question(self, q: dict, lang: str) -> dict:
        # Do not include answer key or explanation until POST /answer.
        return {'id': q['id'], 'topic_id': q['topic_id'], 'difficulty': q['difficulty'],
                'prompt': select_locale(q['prompt'], lang),
                'choices': [{'id': c['id'], 'text': select_locale(c['text'], lang)} for c in q['choices']],
                'sources': self.source_cards(q['source_ids'])}

    def card(self, card: dict, lang: str) -> dict:
        return {'id': card['id'], 'topic_id': card['topic_id'],
                'front': select_locale(card['front'], lang), 'back': select_locale(card['back'], lang),
                'sources': self.source_cards(card['source_ids'])}


class ProgressStore:
    """Single-user, localhost-only SQLite store. Not a public auth system.

    Molecule database stays read-only; educational progress lives in its own DB.
    Connections are explicitly closed for Windows compatibility.
    """
    def __init__(self, path: Path):
        self.path = Path(path).resolve()
        self._lock = Lock()
        self._initialized = False

    def _connect(self) -> sqlite3.Connection:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        con = sqlite3.connect(str(self.path), timeout=10)
        con.row_factory = sqlite3.Row
        return con

    def _init(self):
        if self._initialized:
            return
        with self._lock:
            if self._initialized:
                return
            with closing(self._connect()) as con, con:
                con.execute('PRAGMA journal_mode=WAL')
                con.execute('''CREATE TABLE IF NOT EXISTS quiz_attempts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    question_id TEXT NOT NULL,
                    answer_id TEXT NOT NULL,
                    correct INTEGER NOT NULL CHECK(correct IN (0,1)),
                    created_at TEXT NOT NULL
                )''')
                con.execute('CREATE INDEX IF NOT EXISTS idx_attempts_question ON quiz_attempts(question_id)')
                con.execute('''CREATE TABLE IF NOT EXISTS flashcard_reviews (
                    card_id TEXT PRIMARY KEY,
                    level INTEGER NOT NULL,
                    review_count INTEGER NOT NULL,
                    last_rating TEXT NOT NULL,
                    due_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )''')
            self._initialized = True

    def record_answer(self, question_id: str, answer_id: str, correct: bool, now: datetime | None = None) -> dict:
        self._init()
        current = now or utc_now()
        with closing(self._connect()) as con, con:
            cur = con.execute('INSERT INTO quiz_attempts(question_id,answer_id,correct,created_at) VALUES(?,?,?,?)',
                              (question_id,answer_id,int(correct),iso(current)))
            return {'attempt_id': cur.lastrowid, 'attempted_at': iso(current)}

    def get_flashcard_states(self) -> dict[str, dict]:
        self._init()
        with closing(self._connect()) as con:
            return {r['card_id']: dict(r) for r in con.execute('SELECT * FROM flashcard_reviews')}

    def record_review(self, card_id: str, rating: str, now: datetime | None = None) -> dict:
        if rating not in VALID_RATINGS:
            raise ValueError('Invalid review rating')
        self._init()
        current = now or utc_now()
        # Serialize read-modify-write, preventing duplicate level updates.
        with self._lock, closing(self._connect()) as con, con:
            con.execute('BEGIN IMMEDIATE')
            previous = con.execute('SELECT level,review_count FROM flashcard_reviews WHERE card_id=?', (card_id,)).fetchone()
            level = previous['level'] if previous else 0
            count = previous['review_count'] if previous else 0
            if rating == 'again':
                new_level, due = 0, current + timedelta(minutes=10)
            elif rating == 'hard':
                new_level, due = max(1, level), current + timedelta(days=1)
            elif rating == 'good':
                new_level = min(6, level + 1)
                due = current + timedelta(days=INTERVAL_DAYS[new_level])
            else:
                new_level = min(6, level + 2)
                due = current + timedelta(days=INTERVAL_DAYS[new_level])
            con.execute('''INSERT INTO flashcard_reviews(card_id,level,review_count,last_rating,due_at,updated_at)
                        VALUES(?,?,?,?,?,?)
                        ON CONFLICT(card_id) DO UPDATE SET level=excluded.level,
                        review_count=excluded.review_count,last_rating=excluded.last_rating,
                        due_at=excluded.due_at,updated_at=excluded.updated_at''',
                        (card_id, new_level, count+1, rating, iso(due), iso(current)))
            return {'card_id':card_id,'level':new_level,'review_count':count+1,
                    'last_rating':rating,'due_at':iso(due),'updated_at':iso(current)}

    def progress(self, total_questions: int, all_card_ids: list[str], now: datetime | None = None) -> dict:
        self._init()
        current = now or utc_now()
        with closing(self._connect()) as con:
            row = con.execute('''SELECT COUNT(*) attempts, COALESCE(SUM(correct),0) correct,
                      COUNT(DISTINCT question_id) attempted_questions FROM quiz_attempts''').fetchone()
        states = self.get_flashcard_states()
        due = 0
        for cid in all_card_ids:
            state = states.get(cid)
            if state is None or datetime.fromisoformat(state['due_at']) <= current:
                due += 1
        attempts, correct, unique = int(row['attempts']), int(row['correct']), int(row['attempted_questions'])
        return {'quiz_attempts': attempts, 'quiz_correct': correct,
                'quiz_accuracy_percent': round(100*correct/attempts,1) if attempts else None,
                'unique_questions_attempted': unique,
                'question_bank_size': total_questions,
                'question_bank_coverage_percent': round(100*unique/total_questions,1) if total_questions else 0,
                'flashcards_reviewed': len(states), 'flashcards_mastered_level_3_plus':
                sum(1 for state in states.values() if state['level'] >= 3),
                'flashcards_due': due, 'flashcards_total': len(all_card_ids),
                'scope': 'single_local_profile', 'storage': 'private_learning_sqlite'}
