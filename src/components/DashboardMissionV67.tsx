import { useEffect, useState } from 'react';
import { ArrowRight, ClipboardList, Microscope, ShieldCheck, Trophy } from 'lucide-react';
import { useLanguage } from '../lib/language';
import { MISSION_EVENT, MISSION_KEY, progressPercent, restoreMission } from '../lib/researchMissionV67';
import '../research-journey-v67.css';
function status() {
  try { const s=restoreMission(localStorage.getItem(MISSION_KEY));return {progress:progressPercent(s),finished:s.finished,trials:s.trials.length}; }
  catch {return {progress:0,finished:false,trials:0};}
}
export function DashboardMissionV67({onOpen}:{onOpen:()=>void}) {
  const {language}=useLanguage();const en=language==='en';
  const tx=(id:string,english:string)=>en?english:id;
  const [s,setS]=useState(status);
  useEffect(()=>{const update=()=>setS(status());window.addEventListener(MISSION_EVENT,update);window.addEventListener('storage',update);return ()=>{window.removeEventListener(MISSION_EVENT,update);window.removeEventListener('storage',update)}},[]);
  return <section className="mission67-dashboard"><div className="mission67-dashboard-left"><div className="mission67-db-kicker"><Microscope size={16}/>{tx('PENGALAMAN UNGGULAN','FEATURED EXPERIENCE')}</div><h3>{tx('Research Mission: dari hipotesis ke laporan.','Research Mission: hypothesis to report.')}</h3><p>{tx('Gunakan laboratorium virtual, jawab pertanyaan, dan buat catatan penelitian berbasis data sintetis. Semua progres berasal dari pekerjaanmu sendiri.','Use a virtual lab, answer a research question, and export an educational report based on synthetic observations. Progress reflects your work.')}</p><div className="mission67-db-meta"><span><ClipboardList size={16}/>{s.trials} {tx('percobaan dicatat','trials recorded')}</span><span><ShieldCheck size={16}/>{tx('Data sintetis','Synthetic data')}</span>{s.finished&&<span><Trophy size={16}/>{tx('Selesai','Completed')}</span>}</div></div><div className="mission67-dashboard-right"><small>{tx('PROGRES MISI PENELITIAN','RESEARCH MISSION PROGRESS')}</small><strong>{s.progress}%</strong><div><i style={{width:`${s.progress}%`}}/></div><button type="button" onClick={onOpen}>{s.finished?tx('Lihat laporan','View report'):s.progress?tx('Lanjutkan misi','Resume mission'):tx('Mulai misi penelitian','Start research mission')}<ArrowRight size={17}/></button></div></section>;
}
