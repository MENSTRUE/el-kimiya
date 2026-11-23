/** Corrected visual-only glassware, V6.6. No physical procedure or process prediction. */
import { useId } from 'react';
import { Droplets, FlaskConical, Gauge } from 'lucide-react';
import '../lab-polish-v66.css';

type Status='before'|'near'|'after';
export function ExperimentGlassV66({drops,volumeMl,meter,status,en}:{drops:number;volumeMl:number;meter:number;status:Status;en:boolean}) {
  const uid=useId().replace(/:/g,'');
  const clip=`v66-interior-${uid}`;
  const color=status==='after'?'#D97A65':status==='near'?'#38A98F':'#45A8C0';
  const fraction=Math.max(0,Math.min(1,Number.isFinite(meter)?meter/100:0));
  // Liquid is absent at zero drops; otherwise surface rises inside glass to a capped height.
  const levelY=368-100*fraction;
  const filled=drops>0&&volumeMl>0;
  return <div className="v66-glass" aria-label={en?'Illustrated virtual titration flask':'Labu titrasi virtual ilustratif'}>
    <div className="v66-glass-label"><span><FlaskConical size={17}/>{en?'VIRTUAL LABWARE':'PERALATAN VIRTUAL'}</span><small>{en?'Synthetic calculation':'Perhitungan sintetis'}</small></div>
    <svg viewBox="0 0 600 420" width="100%" role="img" aria-label={en?`Flask with ${drops} virtual drops`:`Labu dengan ${drops} tetes virtual`}>
      <defs>
        <linearGradient id={`v66-body-${uid}`} x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#E6F7F2" stopOpacity=".8"/><stop offset="60%" stopColor="#B5D8D1" stopOpacity=".36"/><stop offset="100%" stopColor="#7BA9AC" stopOpacity=".25"/></linearGradient>
        <clipPath id={clip}><path d="M277 202 L323 202 L323 257 C323 277 375 322 402 342 Q412 353 396 366 Q300 381 204 366 Q188 353 198 342 C225 322 277 277 277 257 Z"/></clipPath>
      </defs>
      {/* Vertical stand and horizontal clamp */}
      <path d="M91 373 H188 M140 373 V55" stroke="#566F75" strokeWidth="8" strokeLinecap="round" fill="none"/>
      <path d="M140 81 H291" stroke="#566F75" strokeWidth="7" strokeLinecap="round"/><rect x="135" y="74" width="20" height="14" rx="4" fill="#38575C"/>
      {/* Burette and real graduation markers */}
      <rect x="285" y="26" width="30" height="158" rx="5" fill="#D7EBEC" fillOpacity=".9" stroke="#64929E" strokeWidth="3"/>
      <path d="M291 41 V162 H309 V41" fill="#91D8E0" fillOpacity=".32" stroke="none"/>
      {Array.from({length:12},(_,i)=><path key={i} d={`M287 ${45+i*10} h${i%5===0?17:10}`} stroke="#54878E" strokeWidth="1.5"/>)}
      <path d="M300 184 V210" stroke="#607A81" strokeWidth="4" strokeLinecap="round"/>
      <rect x="283" y="182" width="34" height="10" rx="5" fill="#D4A15D" stroke="#9D713C" strokeWidth="2"/>
      {filled&&<path d="M300 218 C291 230 293 237 300 239 C307 237 309 230 300 218Z" fill={color} className="v66-droplet"/>}
      {/* Outer glass body and precise matching inset clipping boundary */}
      <path d="M272 198 L272 256 C272 274 213 324 190 340 Q175 357 198 371 Q300 392 402 371 Q425 357 410 340 C387 324 328 274 328 256 L328 198" fill={`url(#v66-body-${uid})`} stroke="#709DA4" strokeWidth="5" strokeLinejoin="round"/>
      <path d="M271 198 H329" stroke="#709DA4" strokeWidth="5" strokeLinecap="round"/>
      {filled&&<g clipPath={`url(#${clip})`}>
        <path d={`M170 ${levelY} Q300 ${levelY-7} 430 ${levelY} V395 H170Z`} fill={color} fillOpacity=".76"/>
        <path d={`M170 ${levelY} Q300 ${levelY-7} 430 ${levelY}`} stroke="#EAFEF9" strokeWidth="3" fill="none" strokeOpacity=".84"/>
        {Array.from({length:5},(_,i)=><circle key={i} cx={245+i*27} cy={354-(i%3)*9} r={2.5+i%2} fill="white" opacity=".24"/>)}
      </g>}
      {/* Glass reflections remain within exterior */}
      <path d="M281 214 V256 Q260 290 222 331" stroke="#FFF" strokeWidth="7" strokeLinecap="round" fill="none" opacity=".7"/>
      <path d="M322 212 V257 Q343 292 382 332" stroke="#FFF" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".32"/>
      <path d="M208 368 Q300 385 393 368" stroke="#FFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".45"/>
      <g fill="#48686A" fontSize="15" fontFamily="system-ui, sans-serif"><text x="359" y="110">{en?'Burette':'Buret'}</text><path d="M350 115 L322 127" stroke="#80969A" fill="none"/><text x="432" y="289">{en?'Flask':'Labu'}</text><path d="M423 291 L368 317" stroke="#80969A" fill="none"/></g>
    </svg>
    <div className="v66-glass-readout"><span><Droplets size={17}/><strong>{drops.toLocaleString(en?'en-US':'id-ID')}</strong><small>{en?'drops':'tetes'}</small></span><span><Gauge size={17}/><strong>{volumeMl.toLocaleString(en?'en-US':'id-ID',{maximumFractionDigits:3})}</strong><small>mL</small></span></div>
    <div className="v66-glass-progress" role="progressbar" aria-label={en?'Synthetic target progress':'Progres target sintetis'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fraction*100)}><i style={{width:`${fraction*100}%`,background:color}}/></div>
    <p>{en?'Illustration, not a physical experiment or a validated quality test.':'Hanya ilustrasi, bukan percobaan fisik atau uji kualitas tervalidasi.'}</p>
  </div>;
}
