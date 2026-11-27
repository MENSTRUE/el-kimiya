import {useState} from 'react';
import {isAndroid83,nativeModel83} from '../lib/nativeAi83';
import {useLanguage} from '../lib/language';
export function NativeModel83(){
  const {language}=useLanguage();const en=language==='en';
  const [status,setStatus]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [progress,setProgress]=useState<number|null>(null);
  if(!isAndroid83())return null;
  const labels:Record<string,[string,string]>={AVAILABLE:['Model lokal siap','Local model ready'],DOWNLOADABLE:['Model dapat diunduh','Model downloadable'],DOWNLOADING:['Model sedang diunduh','Model downloading'],UNAVAILABLE:['Model lokal tidak tersedia; cloud masih bisa dicoba','Local model unavailable; cloud can still be tried'],UNKNOWN:['Status belum diketahui','Status unknown']};
  async function check(download:boolean){setBusy(true);setError('');setStatus('');setProgress(null);try{setStatus(await nativeModel83(download,setProgress));}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
  return <section className="v83-native-model"><h3>{en?'Android AI engine':'Mesin AI Android'}</h3><p>{en?'The Tutor and other AI features now use the Android Firebase SDK. Local support depends on your device.':'Tutor dan fitur AI lainnya kini memakai SDK Firebase Android. Dukungan model lokal bergantung pada perangkat.'}</p><div className="v83-native-actions"><button className="secondary-button" disabled={busy} onClick={()=>void check(false)}>{en?'Check local model':'Periksa model lokal'}</button><button className="primary-button" disabled={busy} onClick={()=>void check(true)}>{en?'Download model':'Unduh model'}</button></div>{busy&&<p role="status">{en?'Working…':'Memproses…'} {progress!==null?Math.round(progress*100)+'%':''}</p>}{status&&<p role="status">{labels[status]?.[en?1:0]}</p>}{error&&<p className="inline-alert" role="alert">{error}</p>}</section>;
}
