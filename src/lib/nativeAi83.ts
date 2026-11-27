// ELKIMIYA_V83_NATIVE_AI — no credentials or tokens cross the bridge.
import type { InferencePreference, InferenceResult } from './hybrid';
type Packet = { id: string; kind: string; text?: string; provider?: string; model?: string; status?: string; code?: string; fraction?: number };
type Bridge = { postMessage: (value: string) => void; onmessage: ((ev: {data: string}) => void) | null };
type Pending = { resolve: (packet: Packet) => void; reject: (error: Error) => void; progress?: (fraction: number) => void; timer: ReturnType<typeof setTimeout> };
const pending = new Map<string, Pending>();
let attached: Bridge | undefined;
let serial = 0;
const getBridge = () => (window as Window & {ElKimiyaAI83?: Bridge}).ElKimiyaAI83;
export const isAndroid83 = () => typeof window !== 'undefined' && (/ElKimiyaAndroid\/8\.[34]\b/.test(navigator.userAgent) || !!getBridge());
const indonesian = () => document.documentElement.lang !== 'en';
export function nativeError83(code: string): Error {
  const messages: Record<string, [string,string]> = {
    APP_CHECK: ['Verifikasi App Check Android gagal. Daftarkan token debug khusus aplikasi Android di Firebase Console (APK debug), atau periksa Play Integrity pada versi rilis.','Android App Check verification failed. Register the Android app’s own debug token in Firebase Console (debug APK), or check Play Integrity for a release build.'],
    API_KEY: ['API key Android tidak valid atau akses API dibatasi. Periksa konfigurasi Android Firebase.','The Android API key is invalid or restricted. Check the Android Firebase configuration.'],
    CONFIG: ['Konfigurasi Firebase AI Logic atau Gemini API belum aktif. Periksa proyek Firebase.','Firebase AI Logic or the Gemini API is not enabled. Check Firebase configuration.'],
    QUOTA: ['AI cloud melaporkan batas kuota atau laju permintaan. Periksa penggunaan Firebase.','Cloud AI reported a quota or rate limit. Check Firebase usage.'],
    HTTP_403: ['Akses AI cloud ditolak (403). Periksa izin proyek, pembatasan API key, dan kebijakan Firebase.','Cloud AI permission denied (403). Check project permissions, API key restrictions, and Firebase policies.'],
    HTTP_404: ['Model atau endpoint cloud tidak ditemukan (404). Periksa nama model dan konfigurasi Firebase.','Cloud model or endpoint not found (404). Check the model name and Firebase configuration.'],
    HTTP_401: ['Autentikasi layanan AI ditolak (401). Periksa konfigurasi Android Firebase.','AI service authentication rejected (401). Check the Android Firebase configuration.'],
    SERVICE: ['Layanan AI cloud sementara tidak tersedia. Coba kembali nanti.','Cloud AI service is temporarily unavailable. Retry later.'],
    BLOCKED: ['Permintaan atau respons diblokir oleh kebijakan model. Ubah pertanyaan yang aman dan terkait kimia.','The request or response was blocked by the model policy. Rephrase as a safe chemistry question.'],
    NO_TEXT: ['Model tidak mengembalikan teks. Coba pertanyaan kimia yang lebih singkat.','The model returned no text. Try a shorter chemistry question.'],
    SOURCE_MISMATCH: ['Sumber inferensi tidak terverifikasi atau tidak sesuai mode. Respons ditolak.','Inference source was unverified or did not match the selected mode. Response rejected.'],
    LOCAL_INPUT: ['Model lokal tidak mendukung permintaan ini. Coba teks singkat dalam bahasa Inggris, atau pilih mode cloud.','The local model cannot handle this request. Try short English text, or select a cloud mode.'],
    LOCAL_BUSY: ['Model lokal sedang sibuk. Tunggu sebentar sebelum mencoba kembali.','The local model is busy. Wait before retrying.'],
    LOCAL_QUOTA: ['Perangkat melaporkan batas kuota AI lokal. Coba lagi nanti atau pilih mode cloud.','The device reported a local AI quota limit. Retry later or select a cloud mode.'],
    LOCAL_RUNTIME: ['Inferensi lokal gagal meski model dapat tersedia. Buka aplikasi di latar depan, coba pertanyaan singkat, atau pilih mode cloud.','Local inference failed even though the model may be available. Keep the app in the foreground, try a short question, or select a cloud mode.'],
    LOCAL: ['Model lokal belum siap atau tidak didukung. Periksa status model atau gunakan Cloud only.','Local model is not ready or supported. Check model status or select Cloud only.'],
    NETWORK: ['Koneksi atau layanan AI tidak tersedia. Coba lagi saat terhubung.','Network or AI service unavailable. Retry when connected.'],
    BUSY: ['AI sedang memproses permintaan lain. Tunggu sebentar.','AI is processing another request. Please wait.'],
    ACCESS: ['Sesi atau halaman berubah. Masuk kembali bila perlu, lalu ulangi.','Your session or page changed. Sign in again if necessary and retry.'],
    TIMEOUT: ['AI belum merespons dalam batas waktu. Coba lagi.','AI did not respond in time. Retry.'],
    BRIDGE: ['Jalur AI Android tidak tersedia. Pasang APK V8.4 dan perbarui Android System WebView.','Android AI bridge unavailable. Install the V8.4 APK and update Android System WebView.'],
    LIMIT: ['Pertanyaan terlalu panjang. Kurangi teks atau jumlah kutipan.','The request is too long. Reduce text or excerpts.'],
    FAILED: ['AI tidak menghasilkan respons terverifikasi. Periksa konfigurasi Firebase dan coba lagi.','AI returned no verified response. Check Firebase configuration and retry.'],
  };
  return new Error((messages[code] || messages.FAILED)[indonesian()?0:1]);
}
function request(kind: string, extra: Record<string,string> = {}, progress?: (fraction:number)=>void): Promise<Packet> {
  const bridge = getBridge();
  if (!bridge || typeof bridge.postMessage !== 'function') return Promise.reject(nativeError83('BRIDGE'));
  if (attached !== bridge) {
    attached = bridge;
    bridge.onmessage = ev => {
      let p: Packet;
      try { p = JSON.parse(ev.data); } catch { return; }
      if (!p || typeof p.id !== 'string') return;
      const task = pending.get(p.id);
      if (!task) return;
      if (p.kind === 'progress') {
        if (typeof p.fraction === 'number' && Number.isFinite(p.fraction)) task.progress?.(Math.max(0,Math.min(1,p.fraction)));
        return;
      }
      if (p.kind !== 'error' && p.kind !== 'result') return;
      pending.delete(p.id); clearTimeout(task.timer);
      if (p.kind === 'error') task.reject(nativeError83(p.code || 'FAILED'));
      else task.resolve(p);
    };
  }
  const id = 'r'+Date.now().toString(36)+'-'+(++serial);
  return new Promise((resolve,reject)=>{
    const timer = setTimeout(()=>{pending.delete(id);reject(nativeError83('TIMEOUT'));},kind==='download'?660000:150000);
    pending.set(id,{resolve,reject,progress,timer});
    try { bridge.postMessage(JSON.stringify({id,kind,...extra})); }
    catch { clearTimeout(timer);pending.delete(id);reject(nativeError83('BRIDGE')); }
  });
}
export async function runNativeAi83(prompt: string, preference: InferencePreference, progress?: (fraction:number)=>void): Promise<InferenceResult> {
  const p = await request('generate',{prompt,preference},progress);
  if ((p.provider !== 'ON_DEVICE' && p.provider !== 'IN_CLOUD') || typeof p.text !== 'string' || !p.text.trim() || typeof p.model !== 'string' || !p.model.trim() ||
      (preference==='On-device only' && p.provider!=='ON_DEVICE') || (preference==='Cloud only' && p.provider!=='IN_CLOUD')) throw nativeError83('FAILED');
  return {text:p.text, provider:p.provider, model:p.model};
}
export async function nativeModel83(download: boolean, progress?: (fraction:number)=>void): Promise<string> {
  const p = await request(download?'download':'status',{},progress);
  if (!p.status || !['AVAILABLE','DOWNLOADABLE','DOWNLOADING','UNAVAILABLE','UNKNOWN'].includes(p.status)) throw nativeError83('FAILED');
  return p.status;
}
