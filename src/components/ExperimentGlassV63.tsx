import { Droplets, FlaskConical, Gauge } from 'lucide-react';
import '../experience-v63.css';

type Status = 'before' | 'near' | 'after';
/** Decorative, responsive lab glassware for the synthetic V6.2 arithmetic experiment. */
export function ExperimentGlassV63({ drops, volumeMl, meter, status, en }: {
  drops: number; volumeMl: number; meter: number; status: Status; en: boolean;
}) {
  const liquid = status === 'after' ? '#dc7b77' : status === 'near' ? '#50bb94' : '#4da8c4';
  const level = Math.max(0, Math.min(60, meter * .56));
  const fillY = 324 - level;
  return <div className="v63-glass" aria-label={en?'Stylized animated laboratory glassware':'Ilustrasi animasi gelas laboratorium'}>
    <div className="v63-glass-top"><span><FlaskConical size={15}/>{en?'VIRTUAL GLASSWARE':'PERALATAN VIRTUAL'}</span><span className="v63-glass-live"><i/>{en?'Synthetic model':'Model sintetis'}</span></div>
    <svg viewBox="0 0 600 410" role="img" aria-label={en?`Virtual flask with ${drops} drops`:`Labu virtual dengan ${drops} tetes`}>
      <defs>
        <linearGradient id="v63-glass-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity=".75"/><stop offset=".3" stopColor="#b8eff0" stopOpacity=".25"/><stop offset="1" stopColor="#75a5b4" stopOpacity=".30"/></linearGradient>
        <linearGradient id="v63-liquid" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={liquid} stopOpacity=".67"/><stop offset="1" stopColor={liquid} stopOpacity=".95"/></linearGradient>
        <linearGradient id="v63-burette" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#c1ecf3" stopOpacity=".9"/><stop offset=".42" stopColor="#ffffff" stopOpacity=".6"/><stop offset="1" stopColor="#7199ab" stopOpacity=".55"/></linearGradient>
        <clipPath id="v63-liquid-clip"><path d="M234 225 L234 258 C234 267 194 307 184 326 C176 341 184 357 203 362 Q300 379 397 362 C416 357 424 341 416 326 C406 307 366 267 366 258 L366 225 Z"/></clipPath>
        <filter id="v63-glass-shadow" x="-50%" y="-50%" width="200%" height="210%"><feGaussianBlur stdDeviation="11"/></filter>
      </defs>
      <ellipse cx="302" cy="383" rx="138" ry="12" fill="#214e54" opacity=".13" filter="url(#v63-glass-shadow)"/>
      {/* lab stand */}
      <path d="M87 366 H180 M134 366 V45" stroke="#617984" strokeWidth="8" strokeLinecap="round"/>
      <path d="M133 71 H282" stroke="#617984" strokeWidth="7" strokeLinecap="round"/>
      <rect x="130" y="65" width="22" height="12" rx="4" fill="#3d5963"/>
      <rect x="275" y="63" width="13" height="16" rx="5" fill="#d9ad61"/>
      {/* burette with graduation marks */}
      <path d="M281 20 Q281 15 287 15 H309 Q315 15 315 20 V163 L304 177 H291 L281 163 Z" fill="url(#v63-burette)" stroke="#7098a2" strokeWidth="3"/>
      <path d="M288 33 H307 V137 H288 Z" fill="#77c7d0" opacity=".34"/>
      {Array.from({length:11},(_,i)=><path key={i} d={`M283 ${38+i*9} H${i%5===0?300:293}`} stroke="#43798b" strokeWidth="1.25" opacity=".7"/>)}
      <path d="M281 160 H315" stroke="#54717b" strokeWidth="4"/>
      <rect x="276" y="170" width="46" height="9" rx="4.5" fill="#a87849" stroke="#765638" strokeWidth="1.5"/>
      <circle cx="299" cy="174.5" r="5" fill="#e4bf72"/>
      <path d="M300 179 V197" stroke="#7c9da5" strokeWidth="4" strokeLinecap="round"/>
      {drops>0&&<g className="v63-dripping"><path d="M300 198 C291 210 292 217 300 220 C308 217 309 210 300 198Z" fill={liquid}/></g>}
      {/* flask silhouette: drawn with a real neck and tapered shoulders */}
      <path d="M270 196 V258 C270 267 205 320 190 339 C176 355 189 375 207 375 Q300 390 393 375 C411 375 424 355 410 339 C395 320 330 267 330 258 V196" fill="url(#v63-glass-body)" stroke="#6d9aa6" strokeWidth="5" strokeLinejoin="round"/>
      <path d="M269 197 H331" stroke="#719aa2" strokeWidth="5" strokeLinecap="round"/>
      <path d={`M168 ${fillY} Q300 ${fillY-8} 432 ${fillY} V390 H168 Z`} clipPath="url(#v63-liquid-clip)" fill="url(#v63-liquid)"/>
      <path d={`M185 ${fillY+6} Q300 ${fillY-3} 415 ${fillY+6}`} clipPath="url(#v63-liquid-clip)" stroke="#f5fffb" strokeOpacity=".72" strokeWidth="4" fill="none"/>
      <path d="M273 210 V259 C262 280 224 314 211 338" stroke="#ffffff" strokeWidth="7" opacity=".65" fill="none" strokeLinecap="round"/>
      <path d="M330 211 V258 Q345 291 381 331" stroke="#91c2c8" strokeWidth="4" opacity=".45" fill="none" strokeLinecap="round"/>
      <path d="M205 366 Q301 381 395 366" stroke="#ffffff" opacity=".5" strokeWidth="3" fill="none"/>
      {drops>0&&Array.from({length:5},(_,i)=><circle key={i} cx={249+i*22} cy={346-(i%3)*11} r={i%2?3.5:2.5} fill="#ffffff" opacity=".43" className="v63-bubble"/>)}
      {/* on-diagram labels */}
      <g fill="#516b72" fontFamily="system-ui, sans-serif" fontSize="15"><text x="362" y="83">{en?'Burette':'Buret'}</text><path d="M355 90 L320 101" stroke="#7b9295" fill="none"/><text x="418" y="269">{en?'Flask':'Labu'}</text><path d="M408 269 L355 298" stroke="#7b9295" fill="none"/></g>
    </svg>
    <div className="v63-glass-readout"><span><Droplets size={18}/><b>{drops.toLocaleString('id-ID')}</b><small>{en?'drops':'tetes'}</small></span><span><Gauge size={18}/><b>{Number(volumeMl.toFixed(3)).toLocaleString(en?'en-US':'id-ID')}</b><small>mL</small></span></div>
    <div className="v63-glass-meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(100,meter))} aria-label={en?'Virtual target progress':'Progres target virtual'}><span style={{width:`${Math.min(100,meter)}%`,backgroundColor:liquid}}/></div>
    <p className="v63-glass-caption">{en?'Illustrative glassware only — no physical chemical procedure or experimental measurement.':'Ilustrasi alat saja — bukan prosedur kimia fisik atau pengukuran eksperimen.'}</p>
  </div>;
}
