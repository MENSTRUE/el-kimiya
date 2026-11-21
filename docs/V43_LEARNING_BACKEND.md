# El-Kīmiyā V4.3 — Learning Data & Backend

**Version:** 4.3.0 · **Scope:** Learning backend data/API only (no React visual changes) · **Prepared:** 2026-11-21

## What is real now

- **13 topics** with independently authored ID/EN introductions, key concepts, reference links.
- **65 original multiple-choice questions** with four translated choices, server-side answer keys, explanations, topics and difficulty levels.
- **52 original flashcards** with bilingual front/back texts.
- **12+ concept reference URLs** to OpenStax Chemistry 2e and IUPAC Gold Book.
- **Real local progress** in `private/learning/progress.sqlite`: quiz attempts, accuracy, question-bank coverage, and review history.
- **Leitner-inspired flashcard scheduling:** `again` (10 minutes), `hard` (+1 day), `good` (next level interval), `easy` (+2 levels). Intervals by level: 1, 3, 7, 14, 30, 60 days. Schedule is in UTC. This is *not* an SM-2 implementation.
- **Content drafted with AI assistance, not LLM-generated at runtime;** answer grading is deterministic and no fake user metrics are used. It does not mean expert accreditation: all content is marked `original_draft_needs_subject_expert_review` pending a qualified chemistry educator's sign-off.

### Source and copyright policy

This is an **AI-assisted original-draft question bank**, not a subject-expert-approved resource. Linked OpenStax and IUPAC pages are **concept references**, not identical answer proofs. No exercise text or explanation has been copied from private chemistry PDFs, and none of those PDFs is distributed. Publisher licensing can change: links and attribution alone do not grant permission to reproduce textbook content. Check licensing before importing any third-party question banks. Some concepts include pedagogical simplifications and should be reviewed by a subject-matter expert.

## API route map

Everything is appended to the **existing V4.2 FastAPI app** at `http://127.0.0.1:8000`:

| Method | Endpoint | What it returns |
|---|---|---|
| GET | `/api/v1/learning/health` | Bank revision, counts, SHA-256, editorial status |
| GET | `/api/v1/learning/catalog?lang=id` | Topic listing and actual bank counts |
| GET | `/api/v1/learning/topics/atoms?lang=en` | Localized lesson and reference links |
| GET | `/api/v1/learning/questions?topic_id=atoms&lang=id` | Quiz prompts + choices **without answer key** |
| POST | `/api/v1/learning/questions/atoms-q01/answer` | Check submitted choice, return explanation + write actual attempt |
| GET | `/api/v1/learning/flashcards?lang=id&due_only=true` | Due / unreviewed flashcards |
| POST | `/api/v1/learning/flashcards/atoms-f01/review` | Persist learning rating + next due date |
| GET | `/api/v1/learning/progress` | Actual per-machine quiz/review metrics, never demo values |
| GET | `/api/v1/learning/daily?lang=en` | Deterministic question of day (UTC) |
| GET | `/api/v1/learning/search?q=ion&lang=id` | Lesson/flashcard full-text substring search within curated bank |
| GET | `/api/v1/learning/sources` | Reference titles, original URLs, accessed-on dates |

**Example answer body:** `{"choice_id":"A","lang":"id"}`. Valid IDs are returned by GET `/questions` and are different from a fixed index due to deterministic seed shuffling.

**Example flashcard rating body:** `{"rating":"good"}` (other values: `again`, `hard`, `easy`).

## Run on Windows

After installer PASS, start API (separate terminal):

```powershell
cd "D:\el kimiya"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\start-backend-learning-v43.ps1
```

Visit `http://127.0.0.1:8000/docs` and call:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/learning/health
Invoke-RestMethod 'http://127.0.0.1:8000/api/v1/learning/catalog?lang=id'
Invoke-RestMethod http://127.0.0.1:8000/api/v1/learning/progress
```

**Try answering a question:**

```powershell
$quiz=Invoke-RestMethod 'http://127.0.0.1:8000/api/v1/learning/questions?topic_id=atoms&lang=id'
$question=$quiz.questions[0]
$choice=$question.choices[0].id
$body=@{choice_id=$choice;lang='id'} | ConvertTo-Json
Invoke-RestMethod -Method Post -ContentType 'application/json' -Body $body -Uri "http://127.0.0.1:8000/api/v1/learning/questions/$($question.id)/answer"
Invoke-RestMethod http://127.0.0.1:8000/api/v1/learning/progress
```

### Existing V4.2 and frontend

- **No new server:** V4.3 mounts a router on `backend.app.main` and preserves the molecular agent endpoints and read-only ChEMBL 37 database.
- `src/lib/learningBackend.ts` is a typed **bridge for the NEXT frontend step**, not mounted yet. Existing dashboard/flashcards/quiz still show their old demo content **until frontend V4.4 binds them to these endpoints**. The user should not mistake the new backend for a completed frontend integration.
- It is deliberately **single local profile with no authentication**. Do **NOT** deploy the backend publicly in this state. CORS is not a security boundary; add authentication, rate limits, secure persistence, and proper cloud storage before any public deployment.
- Quiz keys live on the server, but this is educational practice, **not tamper-proof examinations**. Anyone with source access can read the original authored bank.

## Private data and deployment

- ChEMBL remains at `private/compound_data/chembl_37.sqlite`, read-only, and is **not modified**.
- Study progress is created separately at `private/learning/progress.sqlite` only when progress / answer / review APIs are used.
- No data files, secrets, PDF pages, or Firebase App Check debug credentials are included in the ZIP.
- V4.3 does not deploy or modify `firebase.json`, `vite.config.ts`, `src/App.tsx`, `backend/.env`, or existing React CSS.

## Tests and quality gates

`backend/tests/test_learning_api_v43.py` covers bilingual completeness, source metadata, unique IDs, exact answer checking, non-leaking GET questions, stored progress, due-card scheduling, malformed inputs, CORS, daily challenge, and V4.2 compatibility. Installer runs **all backend tests**; no installer success is claimed until they PASS.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\verify-learning-v43.ps1
```

Before claiming science-review approval or competition readiness, have a chemistry instructor audit all questions and translations, conduct browser e2e tests, and build the frontend integration in a separate tested patch.

### Manual science + translation review (before public production)

Export an editable review sheet containing each original question, answer,
explanation, provenance URL, and blank reviewer fields:

```powershell
cd "D:\el kimiya"
.\backend\.venv\Scripts\python.exe scripts\export-learning-review-v43.py
```

This file is generated under `private/learning/editor_review/v43_question_review.csv`,
which stays Git-ignored. A chemistry subject-matter reviewer should check facts,
calculations, ambiguity, distractors, and translations before an external release.
