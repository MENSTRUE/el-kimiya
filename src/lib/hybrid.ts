/**
 * El-Kīmiyā V3.3 — Firebase AI Logic, real hybrid inference.
 *
 * Security: debug bypass runs in Vite DEVELOPMENT only. A debug token is never
 * shipped intentionally in production. scripts/release-preflight.mjs blocks
 * public builds whenever a local debug token or debug=true is still configured.
 * The inference source comes from Firebase SDK, not UI simulations.
 */
// ELKIMIYA_V83_NATIVE_AI
import { isAndroid83, runNativeAi83 } from './nativeAi83';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
  initializeAppCheck,
} from 'firebase/app-check';
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
} from 'firebase/ai';

export type InferencePreference =
  | 'Prefer on-device'
  | 'On-device only'
  | 'Prefer cloud'
  | 'Cloud only';

export type InferenceResult = {
  text: string;
  provider: 'ON_DEVICE' | 'IN_CLOUD';
  model: string;
};

const env = import.meta.env;
const appCheckSiteKey = env.VITE_FIREBASE_APPCHECK_SITE_KEY || env.VITE_FIREBASE_RECAPTCHA_SITE_KEY;
const appCheckProvider = (env.VITE_APPCHECK_PROVIDER || 'v3').toLowerCase();
const cloudModel = env.VITE_FIREBASE_CLOUD_MODEL || 'gemini-3.5-flash-lite';

export const firebaseConfigured = Boolean(
  env.VITE_FIREBASE_API_KEY &&
  env.VITE_FIREBASE_PROJECT_ID &&
  env.VITE_FIREBASE_APP_ID &&
  appCheckSiteKey
);

let appCheckReady = false;

function getFirebaseApp() {
  return getApps().length > 0
    ? getApp()
    : initializeApp({
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        appId: env.VITE_FIREBASE_APP_ID,
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      });
}

export function setupAppCheck() {
  const app = getFirebaseApp();
  if (appCheckReady) return app;
  if (appCheckProvider !== 'v3' && appCheckProvider !== 'enterprise') {
    throw new Error('App Check provider must be "enterprise" or "v3".');
  }

  // Local-only bypass. The token is exposed to the LOCAL development browser,
  // therefore DO NOT deploy with it in .env. Release preflight enforces this.
  if (import.meta.env.DEV && env.VITE_APPCHECK_DEBUG === 'true') {
    if (!globalThis.isSecureContext) {
      throw new Error('Firebase debug mode requires http://localhost (not a LAN HTTP address).');
    }
    const localToken = (env.VITE_APPCHECK_DEBUG_TOKEN || '').trim();
    (globalThis as typeof globalThis & {
      FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
    }).FIREBASE_APPCHECK_DEBUG_TOKEN = localToken || true;
  }

  const provider = appCheckProvider === 'enterprise'
    ? new ReCaptchaEnterpriseProvider(appCheckSiteKey)
    : new ReCaptchaV3Provider(appCheckSiteKey);

  initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true });
  appCheckReady = true;
  return app;
}

const modes: Record<InferencePreference, InferenceMode> = {
  'Prefer on-device': InferenceMode.PREFER_ON_DEVICE,
  'On-device only': InferenceMode.ONLY_ON_DEVICE,
  'Prefer cloud': InferenceMode.PREFER_IN_CLOUD,
  'Cloud only': InferenceMode.ONLY_IN_CLOUD,
};

function explainError(error: unknown, preference: InferencePreference): Error {
  const raw = error instanceof Error ? error.message : String(error);
  const en = document.documentElement.lang === 'en';
  if (/app.?check|401|403|recaptcha/i.test(raw)) {
    return new Error(en?'Web App Check verification failed. Check the registered domain and provider in Firebase Console.':'Verifikasi App Check web gagal. Periksa domain dan provider yang terdaftar di Firebase Console.');
  }
  if (preference === 'On-device only') {
    return new Error(en?'Local model unavailable. Check browser compatibility and the model download, or use Cloud only.':'Model lokal tidak tersedia. Periksa kompatibilitas browser dan unduhan model, atau gunakan Cloud only.');
  }
  return new Error(en?'AI request failed. Check connectivity and Firebase configuration, then retry.':'Permintaan AI gagal. Periksa koneksi dan konfigurasi Firebase, lalu coba lagi.');
}

export async function runHybridInference(
  prompt: string,
  preference: InferencePreference,
  onProgress?: (fraction: number) => void
): Promise<InferenceResult> {
  if (!firebaseConfigured) {
    throw new Error('Konfigurasi Firebase belum lengkap. Cek .env dan restart Vite.');
  }
  if (!prompt.trim()) throw new Error('Pertanyaan kimia tidak boleh kosong.');

  // Native Android attestation and inference. Never silently retry through the Web SDK.
  if (isAndroid83()) return runNativeAi83(prompt, preference, onProgress);

  try {
    const app = setupAppCheck();
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    const model = getGenerativeModel(ai, {
      mode: modes[preference],
      inCloudParams: { model: cloudModel },
    });

    if (preference === 'On-device only') {
      // Required before the on-device request; can download a large model.
      await model.initializeDeviceModel(fraction => onProgress?.(fraction));
    } else if (preference === 'Prefer on-device') {
      // For an optional local path, start preparation but don't block cloud
      // fallback while model download is in progress.
      void model.initializeDeviceModel(fraction => onProgress?.(fraction)).catch(() => {
        // Firebase will decide whether cloud fallback is possible.
      });
    }

    const response = (await model.generateContent(prompt)).response;
    const provider = response.inferenceSource;
    if (provider !== 'on_device' && provider !== 'in_cloud') {
      throw new Error('Firebase tidak menyertakan sumber inferensi yang terverifikasi.');
    }
    const text = response.text();
    if (!text.trim()) throw new Error('Model mengembalikan respons kosong.');

    const normalizedProvider: InferenceResult['provider'] =
      provider === 'on_device' ? 'ON_DEVICE' : 'IN_CLOUD';
    return {
      text,
      provider: normalizedProvider,
      model: normalizedProvider === 'ON_DEVICE' ? 'Chrome on-device model' : cloudModel,
    };
  } catch (error) {
    throw explainError(error, preference);
  }
}
