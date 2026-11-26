# El-Kīmiyā V8.2 — Login required
V8.1 must already be installed. Do not rerun the V8.1 installer after applying V8.2.
- Guests can browse the public homepage and a locked feature preview; all workspace hashes redirect to the standalone sign-in form.
- Email/password registration, sign-in, and password reset remain; no Google sign-in or guest bypass on auth pages.
- Verified Learner and Moduler sessions have independent workspaces. Homepage navigation does not sign out; sign-out returns to homepage and protects previous routes.
- Firestore dynamic content and tutor guidance require Firebase authentication; existing role write and private backup rules remain.
- Existing Firebase accounts, local UID namespaces and Android source remain unchanged.
- Static Vite assets are public; UI routing is not a server-side protection for bundled content or any pre-existing public backend endpoints. Firebase rules protect the listed Firestore collections.
## Verify
Run the installer using run-v82.ps1. It performs dry-run, backup, source checks, typecheck and build. Then run npm run preview -- --host 127.0.0.1 --port 4173 in a separate terminal. Run node scripts/qa-v82.mjs http://127.0.0.1:4173 from the project in another terminal. Browser QA uses installed Chrome. Authenticated tests are optional with private environment variables ELK_QA_LEARNER_EMAIL, ELK_QA_LEARNER_PASSWORD, ELK_QA_MODULER_EMAIL and ELK_QA_MODULER_PASSWORD (do not commit or publish them). Test both roles manually if environment variables are not provided.
Deploy rules via firebase deploy --only firestore:rules --project el-kimiya. The test-v80-rules.mjs integration test now expects anonymous reads to be denied; run only with the demo Firebase emulators (never production). Deploy the web source to Vercel via Git push after QA; repeat browser QA against https://el-kimiya.vercel.app. Vercel deployment should contain the data-web-version="8.2" marker on the landing/auth/guest/moduler surfaces.
