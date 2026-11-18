# #BuildHybridAI 2026 — submission readiness

Deadline: **1 December 2026 at 05:00 WIB**. Aim to submit on **30 November 2026**.

## Hard gates (must be *observed*, not simulated)

- [ ] Public GitHub repository with code, clear README, visible open-source LICENSE.
- [ ] Firebase AI Logic used **at runtime** (`firebase/ai` Web; `Firebase.ai` Kotlin Android).
- [ ] Firebase App Check configured (web reCAPTCHA; Android debug for local development and Play Integrity for production).
- [ ] Live cloud request returns valid text + `IN_CLOUD` inference source.
- [ ] Live on-device request returns valid text + `ON_DEVICE` inference source on supported Chrome Desktop and/or Android hardware.
- [ ] Fallback behavior demonstrated and honestly labeled; unsupported offline paths show clear errors.
- [ ] Working hosted Web app URL for judges. Verify permissions from a private/incognito browser.
- [ ] Android build (APK/AAB) provided with clear steps or link if claiming Android platform category.
- [ ] Public YouTube demo **3 minutes maximum**, English narration or English subtitles.
- [ ] Devpost text description: product value, user, hybrid implementation, supported platforms, difference from existing apps, project repo and demo.
- [ ] No copyrighted full PDFs, raw datasets, API credentials, or App Check debug tokens in repository.

## 3-minute narrative

0:00–0:20 Problem — chemistry learning in low-connectivity educational settings.

0:20–0:50 Product — browse 8 verified bibliographic sources and offline review tools.

0:50–1:25 Web — run **real** Firebase Hybrid AI with provider receipt, show fallback choice; note local Web supported only on Chrome Desktop.

1:25–2:00 Android — run **real** Kotlin Firebase hybrid SDK, display actual provider `ON_DEVICE` or `IN_CLOUD`.

2:00–2:30 Learning experience — balancing equations, flashcard review, notes, source citations from personally imported local PDFs.

2:30–3:00 Impact and design — explain privacy and limitations; close with GitHub and hosted demo.

## Clear distinctions

- Web notebook, quizzes, flashcards: implemented from V2.
- Local PDFs and index: optional user-supplied, not bundled or universally searchable in the hosted app.
- Source-grounded prompt: only from user-imported private text index, not automatically verified religious or scientific commentary.
- Firebase requires user-owned project/App Check and must be tested on compatible devices before claiming success.
- Android folder is a native Compose MVP, not feature parity with Web. Full QA pending.
