"""V4.3 regression suite: data quality, locale, privacy, progress, and old API."""
from __future__ import annotations

import copy
import hashlib
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.app.learning_core import Catalog, ProgressStore
from backend.app.main import create_app

ROOT = Path(__file__).resolve().parents[2]
BANK = ROOT / 'backend/data/chemistry_learning_bank_v1.json'


@pytest.fixture
def learning_client(tmp_path):
    from sqlite3 import connect
    db = tmp_path / 'chembl_37.sqlite'
    with connect(db) as con:
        con.execute('CREATE TABLE molecules (chembl_id TEXT PRIMARY KEY, canonical_smiles TEXT NOT NULL, standard_inchi TEXT, standard_inchi_key TEXT) WITHOUT ROWID')
        con.execute('INSERT INTO molecules VALUES (?,?,?,?)',('CHEMBL25','CCO','',''))
    with TestClient(create_app(db, tmp_path/'fps.sqlite',
                               learning_bank_path=BANK,learning_progress_path=tmp_path/'progress.sqlite')) as client:
        yield client


def test_catalog_sizes(learning_client):
    health = learning_client.get('/api/v1/learning/health')
    assert health.status_code==200
    info=health.json()
    assert (info['topics'],info['questions'],info['flashcards'])==(13,65,52)
    assert info['editorial_status']=='original_draft_needs_subject_expert_review'
    assert 'AI-assisted' in info['content_authorship']
    assert info['runtime_llm_grading'] is False
    assert len(info['bank_sha256'])==64


def test_all_items_localized_and_source_mapped():
    catalog=Catalog(BANK)
    assert len(catalog.topics)==13 and len(catalog.questions)==65 and len(catalog.flashcards)==52
    for q in catalog.questions.values():
        assert q['correct_choice_id'] in {c['id'] for c in q['choices']}
        assert q['source_ids'] and q['topic_id'] in catalog.topics
        for lang in ('id','en'):
            assert catalog.question(q,lang)['prompt']
            assert len(catalog.question(q,lang)['choices'])==4
        # Topic-specific questions have unique ID and no duplicate distractor text.
        assert len({c['text']['id'] for c in q['choices']})==4
        assert len({c['text']['en'] for c in q['choices']})==4


def test_private_answers_do_not_leak(learning_client):
    res=learning_client.get('/api/v1/learning/questions',params={'topic_id':'stoich','lang':'en'})
    assert res.status_code==200 and res.json()['total']==5
    assert len(res.json()['questions'])==5
    for q in res.json()['questions']:
        assert 'correct_choice_id' not in q
        assert 'explanation' not in q
        assert 'correct' not in q
    assert learning_client.get('/api/v1/learning/questions',params={'lang':'fr'}).status_code==422
    assert learning_client.get('/api/v1/learning/questions',params={'topic_id':'nonexistent'}).status_code==404
    assert learning_client.get('/api/v1/learning/questions',params={'limit':1000}).status_code==422


def test_correct_and_incorrect_answers_persist(learning_client):
    catalog=Catalog(BANK)
    q=catalog.questions['atoms-q01']
    correct=q['correct_choice_id']
    wrong=next(x['id'] for x in q['choices'] if x['id']!=correct)
    first=learning_client.post('/api/v1/learning/questions/atoms-q01/answer',json={'choice_id':wrong,'lang':'id'})
    second=learning_client.post('/api/v1/learning/questions/atoms-q01/answer',json={'choice_id':correct,'lang':'en'})
    assert first.status_code==200 and second.status_code==200
    assert first.json()['is_correct'] is False
    assert second.json()['is_correct'] is True
    assert first.json()['correct_choice_id']==correct
    assert first.json()['explanation']!=second.json()['explanation']
    stats=learning_client.get('/api/v1/learning/progress').json()
    assert stats['quiz_attempts']==2 and stats['quiz_correct']==1
    assert stats['quiz_accuracy_percent']==50.0 and stats['unique_questions_attempted']==1
    assert stats['question_bank_coverage_percent']==round(100/65,1)


def test_answer_validation(learning_client):
    assert learning_client.post('/api/v1/learning/questions/missing/answer',json={'choice_id':'A'}).status_code==404
    assert learning_client.post('/api/v1/learning/questions/atoms-q01/answer',json={'choice_id':'X'}).status_code==422
    assert learning_client.post('/api/v1/learning/questions/atoms-q01/answer',json={'choice_id':'A','is_correct':True}).status_code==422
    assert learning_client.post('/api/v1/learning/questions/atoms-q01/answer',json={'choice_id':'A','lang':'xx'}).status_code==422


def test_flashcards_dues_and_reviews(learning_client):
    initial=learning_client.get('/api/v1/learning/progress').json()
    assert initial['flashcards_due']==52 and initial['flashcards_reviewed']==0
    due=learning_client.get('/api/v1/learning/flashcards',params={'topic_id':'matter','due_only':True}).json()
    assert due['total']==4 and all(card['due'] for card in due['cards'])
    card=due['cards'][0]['id']
    result=learning_client.post(f'/api/v1/learning/flashcards/{card}/review',json={'rating':'good'})
    assert result.status_code==200 and result.json()['level']==1
    after=learning_client.get('/api/v1/learning/progress').json()
    assert after['flashcards_reviewed']==1 and after['flashcards_due']==51
    assert learning_client.post('/api/v1/learning/flashcards/unknown/review',json={'rating':'good'}).status_code==404
    assert learning_client.post(f'/api/v1/learning/flashcards/{card}/review',json={'rating':'invalid'}).status_code==422


def test_leitner_schedule_math(tmp_path):
    store=ProgressStore(tmp_path/'private/progress.sqlite')
    t=datetime(2026,11,21,12,0,tzinfo=timezone.utc)
    a=store.record_review('card-a','good',now=t)
    assert datetime.fromisoformat(a['due_at'])==t+timedelta(days=1)
    b=store.record_review('card-a','easy',now=t)
    assert b['level']==3
    assert datetime.fromisoformat(b['due_at'])==t+timedelta(days=7)
    c=store.record_review('card-a','again',now=t)
    assert c['level']==0 and c['review_count']==3
    assert datetime.fromisoformat(c['due_at'])==t+timedelta(minutes=10)


def test_daily_question_does_not_reveal_answer(learning_client):
    r=learning_client.get('/api/v1/learning/daily',params={'lang':'id'})
    assert r.status_code==200
    assert 'correct_choice_id' not in r.json()['question']
    assert r.json()['date_utc']==datetime.now(timezone.utc).date().isoformat()


def test_lessons_and_search(learning_client):
    res=learning_client.get('/api/v1/learning/topics/bonding',params={'lang':'id'})
    assert res.status_code==200 and len(res.json()['lesson']['key_points'])==3
    assert res.json()['lesson']['sources'][0]['url'].startswith('https://openstax.org/')
    assert learning_client.get('/api/v1/learning/topics/bonding',params={'lang':'de'}).status_code==422
    r=learning_client.get('/api/v1/learning/search',params={'q':'ion','lang':'id'})
    assert r.status_code==200 and r.json()['total']>0
    assert learning_client.get('/api/v1/learning/search',params={'q':'x'}).status_code==422
    assert len(learning_client.get('/api/v1/learning/sources').json()['sources'])>=13


def test_cors_and_local_only_instructions(learning_client):
    opts=learning_client.options('/api/v1/learning/catalog',headers={'Origin':'http://localhost:5173','Access-Control-Request-Method':'GET'})
    assert opts.headers.get('access-control-allow-origin')=='http://localhost:5173'
    forbidden=learning_client.options('/api/v1/learning/catalog',headers={'Origin':'https://random.example','Access-Control-Request-Method':'GET'})
    assert forbidden.headers.get('access-control-allow-origin') is None


def test_curriculum_rejects_invalid_translation_and_source(tmp_path):
    data=json.loads(BANK.read_text(encoding='utf-8'))
    broken=copy.deepcopy(data)
    broken['questions'][0]['prompt']['en']=''
    p=tmp_path/'bad.json';p.write_text(json.dumps(broken),encoding='utf-8')
    with pytest.raises(ValueError,match='ID/EN'):Catalog(p)
    broken=copy.deepcopy(data)
    broken['sources'][0]['url']='http://example.com/invalid'
    p.write_text(json.dumps(broken),encoding='utf-8')
    with pytest.raises(ValueError,match='Unapproved'):Catalog(p)


def test_separate_chembl_db_is_unmodified(learning_client):
    # Read-only molecular API and learning API are separately scoped.
    assert learning_client.get('/api/v1/health').json()['database_ready'] is True
    assert learning_client.get('/api/v1/learning/catalog').json()['total_questions']==65
    assert learning_client.get('/api/v1/molecules/CHEMBL25').status_code==200


def test_no_lesson_completion_is_invented(learning_client):
    stats=learning_client.get('/api/v1/learning/progress').json()
    assert stats['quiz_attempts']==0
    assert stats['quiz_accuracy_percent'] is None
    assert stats['scope']=='single_local_profile'
