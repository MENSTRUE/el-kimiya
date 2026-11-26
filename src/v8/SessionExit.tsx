import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useLanguage } from '../lib/language';
import { usePlatform, v8Auth } from './platform';
import { writeGuest } from './routes81';
export function SessionExit({go}:{go:()=>void}) {
 const {user}=usePlatform();const {language}=useLanguage();const en=language==='en';const [busy,B]=useState(false),[error,E]=useState('');
 return <><button type="button" className="v81-exit" disabled={busy} title={user?(en?'Sign out':'Keluar akun'):(en?'Leave guest mode':'Keluar mode tamu')} onClick={async()=>{B(true);E('');try{if(user)await signOut(v8Auth());writeGuest(false);go();}catch(e){E(e instanceof Error?e.message:String(e));}finally{B(false);}}}><LogOut size={17}/><span>{user?(en?'Sign out':'Keluar akun'):(en?'Leave guest':'Keluar mode tamu')}</span></button>{error&&<p role="alert">{error}</p>}</>;
}
