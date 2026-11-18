/** Live Firebase AI Logic path. Demo is NEVER misrepresented as a live request. */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { ReCaptchaV3Provider, initializeAppCheck } from 'firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from 'firebase/ai';

export type InferencePreference = 'Prefer on-device' | 'On-device only' | 'Prefer cloud' | 'Cloud only';
export type InferenceResult = { text: string; provider: 'ON_DEVICE' | 'IN_CLOUD'; model: string };
const env = import.meta.env;
export const firebaseConfigured = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_APP_ID && env.VITE_FIREBASE_RECAPTCHA_SITE_KEY);
let appCheckReady = false;
function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  });
}
function setupAppCheck() {
  const app = getFirebaseApp();
  if (!appCheckReady) {
    // Debug mode is opt-in and NEVER bundled in a production build.
    if (import.meta.env.DEV && env.VITE_APPCHECK_DEBUG === 'true') {
      (globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    initializeAppCheck(app, { provider: new ReCaptchaV3Provider(env.VITE_FIREBASE_RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled: true });
    appCheckReady = true;
  }
  return app;
}
const modes = {
  'Prefer on-device': InferenceMode.PREFER_ON_DEVICE,
  'On-device only': InferenceMode.ONLY_ON_DEVICE,
  'Prefer cloud': InferenceMode.PREFER_IN_CLOUD,
  'Cloud only': InferenceMode.ONLY_IN_CLOUD,
};
export async function runHybridInference(prompt:string, mode:InferencePreference, onProgress?: (fraction:number)=>void):Promise<InferenceResult> {
  if (!firebaseConfigured) throw new Error('Firebase is not configured. Add all required VITE_FIREBASE_* settings and App Check site key.');
  const app = setupAppCheck();
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const modelName = env.VITE_FIREBASE_CLOUD_MODEL || 'gemini-3.5-flash-lite';
  const model = getGenerativeModel(ai, { mode: modes[mode], inCloudParams: { model: modelName } });
  // Triggered inside a user click/submit handler. Browser model may require initial download.
  if (mode !== 'Cloud only') {
    void model.initializeDeviceModel(fraction => onProgress?.(fraction)).catch(() => {
      // Prefer-* modes may still fall back to cloud; strict local mode errors on generation.
    });
  }
  const response = (await model.generateContent(prompt)).response;
  const text = response.text();
  const provider = response.inferenceSource;
  if (provider !== 'on_device' && provider !== 'in_cloud') throw new Error('Model responded without a verified inference source.');
  const normalizedProvider: InferenceResult['provider'] =
    provider === 'on_device' ? 'ON_DEVICE' : 'IN_CLOUD';
  return { text, provider: normalizedProvider, model: normalizedProvider === 'IN_CLOUD' ? modelName : 'Chrome on-device model' };
}
