// ELKIMIYA_V83_NATIVE_AI — no credentials or tokens cross the bridge.
import type { InferencePreference, InferenceResult } from './hybrid';
type Packet = { id: string; kind: string; text?: string; provider?: string; model?: string; status?: string; code?: string; fraction?: number };
type Bridge = { postMessage: (value: string) => void; onmessage: ((ev: {data: string}) => void) | null };
type Pending = { resolve: (packet: Packet) => void; reject: (error: Error) => void; progress?: (fraction: number) => void; timer: ReturnType<typeof setTimeout> };
const pending = new Map<string, Pending>();
let attached: Bridge | undefined;
let serial = 0;
const getBridge = () => (window as Window & {ElKimiyaAI83?: Bridge}).ElKimiyaAI83;
export const isAndroid83 = () => typeof window !== 'undefined' && (/ElKimiyaAndroid\/8\.3\b/.test(navigator.userAgent) || !!getBridge());
const indonesian = () => document.documentElement.lang !== 'en';
export function nativeError83(code: string): Error {
  const messages: Record<string, [string,string]> = {
    APP_CHECK: ['Verifikasi App Check Android gagal. Periksa pendaftaran aplikasi dan token debug di Firebase Console.','Android App Check verification failed. Check app registration and debug token in Firebase Console.'],
    LOCAL: ['Model lokal belum siap atau tidak didukung. Periksa status model atau gunakan Cloud only.','Local model is not ready or supported. Check model status or select Cloud only.'],
    NETWORK: ['Koneksi atau layanan AI tidak tersedia. Coba lagi saat terhubung.','Network or AI service unavailable. Retry when connected.'],
    BUSY: ['AI sedang memproses permintaan lain. Tunggu sebentar.','AI is processing another request. Please wait.'],
    ACCESS: ['Sesi atau halaman berubah. Masuk kembali bila perlu, lalu ulangi.','Your session or page changed. Sign in again if necessary and retry.'],
    TIMEOUT: ['AI belum merespons dalam batas waktu. Coba lagi.','AI did not respond in time. Retry.'],
    BRIDGE: ['Jalur AI Android tidak tersedia. Pasang APK V8.3 dan perbarui Android System WebView.','Android AI bridge unavailable. Install the V8.3 APK and update Android System WebView.'],
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
