/** Real Firebase AI Logic hybrid inference. Demo content is never presented as a live model result. */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { ReCaptchaEnterpriseProvider, ReCaptchaV3Provider, initializeAppCheck } from 'firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from 'firebase/ai';

export type InferencePreference = 'Prefer on-device' | 'On-device only' | 'Prefer cloud' | 'Cloud only';
export type InferenceResult = { text: string; provider: 'ON_DEVICE' | 'IN_CLOUD'; model: string };

const env = import.meta.env;
const appCheckSiteKey = env.VITE_FIREBASE_APPCHECK_SITE_KEY || env.VITE_FIREBASE_RECAPTCHA_SITE_KEY;
const appCheckProvider = (env.VITE_APPCHECK_PROVIDER || 'v3').toLowerCase();
export const firebaseConfigured = Boolean(
  env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_APP_ID && appCheckSiteKey
);

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
    if (appCheckProvider !== 'v3' && appCheckProvider !== 'enterprise') {
      throw new Error('VITE_APPCHECK_PROVIDER must be v3 or enterprise.');
    }
    // Local development ONLY. Never hardcode or commit the printed debug token.
    if (import.meta.env.DEV && env.VITE_APPCHECK_DEBUG === 'true') {
      (globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    const provider = appCheckProvider === 'enterprise'
      ? new ReCaptchaEnterpriseProvider(appCheckSiteKey)
      : new ReCaptchaV3Provider(appCheckSiteKey);
    initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true });
    appCheckReady = true;
  }
  return app;
}

const modes: Record<InferencePreference, InferenceMode> = {
  'Prefer on-device': InferenceMode.PREFER_ON_DEVICE,
  'On-device only': InferenceMode.ONLY_ON_DEVICE,
  'Prefer cloud': InferenceMode.PREFER_IN_CLOUD,
  'Cloud only': InferenceMode.ONLY_IN_CLOUD,
};

export async function runHybridInference(
  prompt: string,
  preference: InferencePreference,
  onProgress?: (fraction: number) => void
): Promise<InferenceResult> {
  if (!firebaseConfigured) {
    throw new Error('Firebase setup incomplete. Check .env and App Check site key, then restart Vite.');
  }
  if (!prompt.trim()) throw new Error('A chemistry question is required.');
  const app = setupAppCheck();
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const cloudModel = env.VITE_FIREBASE_CLOUD_MODEL || 'gemini-3.5-flash-lite';
  const model = getGenerativeModel(ai, {
    mode: modes[preference],
    inCloudParams: { model: cloudModel },
  });

  // Prepare the local model when explicitly requested. This can download a model.
  // Strict local-only mode errors if the device cannot prepare the local model.
  // Prefer-on-device mode can still fall back using the SDK's own routing.
  if (preference === 'On-device only') {
    await model.initializeDeviceModel(fraction => onProgress?.(fraction));
  } else if (preference === 'Prefer on-device') {
    try { await model.initializeDeviceModel(fraction => onProgress?.(fraction)); }
    catch { /* Let Firebase choose a cloud fallback, if available. */ }
  }

  const response = (await model.generateContent(prompt)).response;
  const text = response.text();
  const provider = response.inferenceSource;
  // These lowercase SDK values were verified with this project's installed Firebase v13 API.
  if (provider !== 'on_device' && provider !== 'in_cloud') {
    throw new Error('Firebase did not confirm the inference provider. No verified answer will be displayed.');
  }
  const normalizedProvider: InferenceResult['provider'] = provider === 'on_device' ? 'ON_DEVICE' : 'IN_CLOUD';
  return { text, provider: normalizedProvider, model: normalizedProvider === 'IN_CLOUD' ? cloudModel : 'Chrome on-device model' };
}
