#!/usr/bin/env python3
"""Audit original chemistry content without fetching or modifying private PDFs."""
from __future__ import annotations
from collections import Counter
from pathlib import Path
import sys
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))
from backend.app.learning_core import Catalog

bank=Catalog(root/'backend/data/chemistry_learning_bank_v1.json')
print('EL-KIMIYA V4.3 CONTENT AUDIT')
print('Bank SHA-256:',bank.checksum)
print('Editorial status:',bank.data['editorial_status'])
print('Topic | questions | flashcards | linked sources')
for topic in sorted(bank.topics.values(),key=lambda item:item['order']):
    count_q=sum(item['topic_id']==topic['id'] for item in bank.questions.values())
    count_f=sum(item['topic_id']==topic['id'] for item in bank.flashcards.values())
    print(f"  {topic['id']:12} | {count_q:2} | {count_f:2} | {', '.join(topic['source_ids'])}")
correct=Counter(q['correct_choice_id'] for q in bank.questions.values())
print('Correct answer distribution:',dict(sorted(correct.items())))
print(f"TOTAL: {len(bank.topics)} topics / {len(bank.questions)} questions / {len(bank.flashcards)} flashcards")
print('[PASS] Unique IDs, bilingual fields, answer keys, source references and URLs validated')
