"""FastAPI router for authentic local learning state and bilingual original content."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from .learning_core import Catalog, ProgressStore, utc_now

Language = Literal['id','en']

class Strict(BaseModel):
    model_config = ConfigDict(extra='forbid')

class AnswerRequest(Strict):
    choice_id: str = Field(min_length=1, max_length=4)
    lang: Language = 'id'

class ReviewRequest(Strict):
    rating: Literal['again','hard','good','easy']


def make_learning_router(bank_path: Path, progress_path: Path) -> APIRouter:
    catalog = Catalog(bank_path)
    store = ProgressStore(progress_path)
    router = APIRouter()

    def check_topic(topic_id: str | None) -> None:
        if topic_id is not None and topic_id not in catalog.topics:
            raise HTTPException(404,'Unknown learning topic')

    @router.get('/health')
    def learning_health():
        return {'status':'ok', 'curriculum_revision':catalog.data['revision'],
                'topics':len(catalog.topics),'questions':len(catalog.questions),
                'flashcards':len(catalog.flashcards), 'bank_sha256':catalog.checksum,
                'editorial_status':catalog.data['editorial_status'],
                'progress_storage':'local_private_sqlite',
                'content_authorship':catalog.data['authorship'],
                'runtime_llm_grading':False}

    @router.get('/catalog')
    def get_catalog(lang: Language='id'):
        topics=[]
        for topic in sorted(catalog.topics.values(),key=lambda t:t['order']):
            questions=sum(q['topic_id']==topic['id'] for q in catalog.questions.values())
            cards=sum(c['topic_id']==topic['id'] for c in catalog.flashcards.values())
            topics.append({'id':topic['id'], 'title':topic['title'][lang],
                           'intro':topic['intro'][lang], 'estimated_minutes':topic['estimated_minutes'],
                           'question_count':questions,'flashcard_count':cards})
        return {'language':lang,'topics':topics, 'total_questions':len(catalog.questions),
                'total_flashcards':len(catalog.flashcards),
                'editorial_status':catalog.data['editorial_status']}

    @router.get('/topics/{topic_id}')
    def get_lesson(topic_id: str,lang:Language='id'):
        check_topic(topic_id)
        return {'language':lang,'lesson':catalog.lesson(catalog.topics[topic_id],lang)}

    @router.get('/questions')
    def questions(topic_id:str|None=None,lang:Language='id',difficulty:int|None=Query(default=None,ge=1,le=3),
                  limit:int=Query(default=20,ge=1,le=100), offset:int=Query(default=0,ge=0,le=10000)):
        check_topic(topic_id)
        matched=[q for q in catalog.questions.values() if
                 (topic_id is None or q['topic_id']==topic_id) and (difficulty is None or q['difficulty']==difficulty)]
        return {'language':lang,'total':len(matched),'offset':offset,'limit':limit,
                'questions':[catalog.question(q,lang) for q in matched[offset:offset+limit]]}

    @router.post('/questions/{question_id}/answer')
    def answer(question_id:str, req:AnswerRequest):
        q=catalog.questions.get(question_id)
        if q is None:
            raise HTTPException(404,'Unknown question')
        valid={c['id'] for c in q['choices']}
        answer_id=req.choice_id.upper()
        if answer_id not in valid:
            raise HTTPException(422,'Not a valid choice for this question')
        correct=answer_id==q['correct_choice_id']
        result=store.record_answer(question_id,answer_id,correct)
        return {'question_id':question_id,'chosen_choice_id':answer_id,'is_correct':correct,
                'correct_choice_id':q['correct_choice_id'],
                'explanation':q['explanation'][req.lang],
                'sources':catalog.source_cards(q['source_ids']),**result}

    @router.get('/flashcards')
    def flashcards(topic_id:str|None=None,lang:Language='id',due_only:bool=False,
                   limit:int=Query(default=100,ge=1,le=200)):
        check_topic(topic_id)
        states=store.get_flashcard_states()
        now=utc_now()
        items=[]
        for c in catalog.flashcards.values():
            if topic_id is not None and c['topic_id']!=topic_id:
                continue
            state=states.get(c['id'])
            due=state is None or datetime.fromisoformat(state['due_at'])<=now
            if due_only and not due:
                continue
            items.append({**catalog.card(c,lang),'reviewed':state is not None,
                          'level':state['level'] if state else 0,
                          'due':due,'due_at':state['due_at'] if state else None})
        items.sort(key=lambda card:(not card['due'],card['id']))
        return {'language':lang,'total':len(items),'cards':items[:limit],
                'scheduler':'leitner_inspired', 'schedule_timezone':'UTC'}

    @router.post('/flashcards/{card_id}/review')
    def review(card_id:str, req:ReviewRequest):
        if card_id not in catalog.flashcards:
            raise HTTPException(404,'Unknown flashcard')
        return {'scheduler':'leitner_inspired',**store.record_review(card_id,req.rating)}

    @router.get('/progress')
    def progress():
        return store.progress(len(catalog.questions),list(catalog.flashcards))

    @router.get('/daily')
    def daily(lang:Language='id'):
        day=datetime.now(timezone.utc).date()
        all_q=list(catalog.questions.values())
        q=all_q[day.toordinal()%len(all_q)]
        return {'date_utc':day.isoformat(),'question':catalog.question(q,lang),
                'note':'Same original daily question for all local sessions; no generated answer.'}

    @router.get('/search')
    def search(q:str=Query(min_length=2,max_length=120),lang:Language='id',limit:int=Query(default=10,ge=1,le=30)):
        term=q.casefold().strip()
        results=[]
        for topic in catalog.topics.values():
            text=' '.join([topic['title'][lang],topic['intro'][lang]]+[p[lang] for p in topic['key_points']]).casefold()
            if term in text:
                results.append({'type':'lesson','id':topic['id'],'title':topic['title'][lang]})
        for card in catalog.flashcards.values():
            if term in (card['front'][lang]+' '+card['back'][lang]).casefold():
                results.append({'type':'flashcard','id':card['id'],'title':card['front'][lang]})
        return {'query':q,'language':lang,'total':len(results),'results':results[:limit]}

    @router.get('/sources')
    def sources():
        return {'sources':catalog.data['sources'],
                'editorial_status':catalog.data['editorial_status'],
                'copyright_note':catalog.data['copyright_note']}

    return router
