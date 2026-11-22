# El-Kīmiyā V4.6 — #BuildHybridAI 2026 submission notes (English)

> Working concept, not a claim of prize eligibility or functioning runtime until verified on compatible hardware and in Firebase Console.

## Positioning

**El-Kīmiyā: Learn chemistry. Explain it. Get feedback from the right AI for your device.**

Students studying chemistry in bandwidth-limited environments need a clear progression and the ability to reflect on what they understand. El-Kīmiyā combines an ordered bilingual course, interactive 118-element periodic table, visual molecule exploration, and a **Teach-Back** activity where learners explain concepts in their own words. The same Firebase AI Logic hybrid SDK routes feedback to an on-device model when available or a cloud model according to explicit user choice and device support. The app displays actual inference origin from `inferenceSource` and treats unsupported modes as failures, not simulated success.

## Technical implementation

- **Web:** React, TypeScript, Vite, Firebase AI Logic JavaScript SDK (`firebase/ai`), Firebase App Check via reCAPTCHA.
- **Hybrid entrypoint:** `src/lib/hybrid.ts` uses `getAI`, `getGenerativeModel`, `InferenceMode`, and `generateContent`. The returned `response.inferenceSource` identifies `ON_DEVICE` or `IN_CLOUD`.
- **Native Android MVP:** existing `android/` Kotlin/Compose project; must be compiled and live-tested separately before claiming full multi-platform support.
- **Science exploration:** locally bundled 118-element periodic table, six compounds, thirteen ordered lessons, lesson-level quick checks. Web flashcards load from local FastAPI when available.
- **Grounding boundary:** AI sees only concise, authored lesson notes and the student's explanation; this is prompt-context grounding, **not** source-verified retrieval, expert assessment, or factual guarantee.
- **No fake results:** hybrid comparative experiments make real SDK requests; local-only mode never silently calls the cloud.

## Demo story (<=3 minutes; use actual recorded footage)

| Time | Record on screen | What to say |
|---|---|---|
| 0:00–0:20 | Home and learning path | “Chemistry should build understanding, not just memorization.” |
| 0:20–0:45 | Locked chapters / local content | “Students follow thirteen sequenced lessons with checks and review.” |
| 0:45–1:05 | Built-in periodic table and compound cards | “Explore 118 elements without leaving the app.” |
| 1:05–1:35 | Teach-Back with ON_DEVICE receipt, **only if real test succeeds** | “They explain a concept and get AI feedback. The SDK reports the actual local inference source.” |
| 1:35–2:05 | CLOUD_ONLY receipt and explicit consent, **only if real test succeeds** | “When needed, cloud inference is available with informed consent.” |
| 2:05–2:30 | Prefer on-device and comparison receipts | “The hybrid SDK controls routing; we report provider and measured request times without pretending to benchmark hardware.” |
| 2:30–3:00 | Android real demo if tested, else Web + limitations + repository | “The public repository includes setup, source code, and reproducible verification steps.” |

Replace any unsuccessful live step with an accurate limitation, rather than a scripted fake receipt.

## Required submission assets

- Public GitHub/GitLab source under an open-source license; README must document setup, usage and SDK runtime call.
- Hosted working Web app URL (recommended). Verify from a clean browser with production App Check.
- Public YouTube video no longer than 3 minutes; English spoken or English subtitles.
- English text description, value proposition, core features, hybrid inference implementation and existing-app update description.
- For Android category claims: a functioning installable app and actual on-device/cloud receipts from compatible Android hardware.
- No third-party full books/PDFs, credentials, App Check debug tokens, large private databases in public repository.

## Proof table — fill only after live demonstration

| Platform | Test | Actual SDK source | Request outcome | Evidence |
|---|---|---|---|---|
| Chrome Desktop | ONLY_ON_DEVICE | **TO TEST** | **TO TEST** | Screenshot / SDK receipt |
| Chrome Desktop | ONLY_IN_CLOUD | **TO TEST** | **TO TEST** | Screenshot / SDK receipt |
| Chrome Desktop | PREFER_ON_DEVICE | **TO TEST** | **TO TEST** | Screenshot / SDK receipt |
| Android | ONLY_ON_DEVICE | **TO TEST** | **TO TEST** | Screen recording / Logcat |
| Android | ONLY_IN_CLOUD | **TO TEST** | **TO TEST** | Screen recording / Logcat |

**Critical limitation:** local FastAPI and ChEMBL need a separately running backend and are NOT available automatically in Firebase Hosting. Explain the public-demo feature boundary clearly to judges.

**Deadline:** Devpost's stated submission deadline is Nov 30, 2026 at 2:00 PM PST (Dec 1, 2026 at 05:00 WIB). Aim to submit earlier and verify the Devpost page again close to deadline.
