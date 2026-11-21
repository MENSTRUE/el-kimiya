#!/usr/bin/env python3
"""Private bilingual curriculum review sheets; never exported to public/dist."""
from pathlib import Path
from csv import DictWriter
import sys
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))
from backend.app.learning_core import Catalog

out=root/'private'/'learning'/'editor_review'
if root/'public' in out.parents or root/'dist' in out.parents:
    raise RuntimeError('Review exports must never go to public/dist')
out.mkdir(parents=True,exist_ok=True)
bank=Catalog(root/'backend/data/chemistry_learning_bank_v1.json')

rows=[]
for q in bank.questions.values():
    answers={c['id']:c['text'] for c in q['choices']}
    rows.append({
        'question_id':q['id'],'topic_id':q['topic_id'],'difficulty':q['difficulty'],
        'question_id_text':q['prompt']['id'],'question_en_text':q['prompt']['en'],
        'correct_answer_id':q['correct_choice_id'],
        'answer_text_id':answers[q['correct_choice_id']]['id'],
        'answer_text_en':answers[q['correct_choice_id']]['en'],
        'explanation_id':q['explanation']['id'], 'explanation_en':q['explanation']['en'],
        'reference_urls':' | '.join(bank.sources[s]['url'] for s in q['source_ids']),
        'scientific_review_status':'PENDING', 'translation_review_status':'PENDING',
        'reviewer_name':'', 'review_notes':'',
    })
file=out/'v43_question_review.csv'
with file.open('w',newline='',encoding='utf-8-sig') as f:
    w=DictWriter(f,fieldnames=list(rows[0]))
    w.writeheader();w.writerows(rows)
print(f'[PASS] Exported {len(rows)} original question review rows to private folder: {file}')
print('[PRIVATE] Do not publish answer keys or reviewer info before review.')
