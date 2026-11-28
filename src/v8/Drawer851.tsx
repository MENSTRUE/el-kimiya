import { useLayoutEffect, useRef, type ReactNode } from 'react';

type Props={id:string; open:boolean; label:string; close:()=>void; className?:string; children:ReactNode};

// A real fixed DOM overlay instead of HTMLDialogElement.showModal().
// Keep closed navigation in the DOM for the existing native learner role gate.
export function Drawer851({id,open,label,close,className='',children}:Props){
 const overlay=useRef<HTMLDivElement>(null);
 const panel=useRef<HTMLDivElement>(null);
 const closeRef=useRef(close);
 closeRef.current=close;
 useLayoutEffect(()=>{
  const layer=overlay.current, surface=panel.current;
  if(!open||!layer||!surface)return;
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const html=document.documentElement, body=document.body;
  const htmlOverflow=html.style.overflow, bodyOverflow=body.style.overflow;
  html.style.overflow='hidden'; body.style.overflow='hidden';
  // Make only the workspace behind the drawer inert; never alter Auth/role state.
  const changed:HTMLElement[]=[];
  for(let node:HTMLElement|null=layer;node?.parentElement;node=node.parentElement){
   for(const sibling of Array.from(node.parentElement.children)){
    if(sibling!==node&&sibling instanceof HTMLElement&&!sibling.inert){
     sibling.inert=true;changed.push(sibling);
    }
   }
   if(node.parentElement.classList.contains('app'))break;
  }
  const focusables=()=>Array.from(surface.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')).filter(el=>el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden'&&!el.closest('[inert]'));
  const focusFirst=()=>{(surface.querySelector<HTMLElement>('[data-elk-drawer-close]')||focusables()[0]||surface).focus({preventScroll:true});};
  focusFirst();
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeRef.current();return;}
   if(event.key!=='Tab')return;
   const items=focusables(),first=items[0],last=items.at(-1);
   if(!first||!last){event.preventDefault();surface.focus();return;}
   if(!surface.contains(document.activeElement)||(event.shiftKey&&document.activeElement===first)||(!event.shiftKey&&document.activeElement===last)){
    event.preventDefault();(event.shiftKey?last:first).focus();
   }
  };
  const contain=(event:FocusEvent)=>{if(event.target instanceof Node&&!surface.contains(event.target))focusFirst();};
  document.addEventListener('keydown',key,true);document.addEventListener('focusin',contain,true);
  return()=>{
   document.removeEventListener('keydown',key,true);document.removeEventListener('focusin',contain,true);
   for(const element of changed)element.inert=false;
   html.style.overflow=htmlOverflow;body.style.overflow=bodyOverflow;
   if(previous?.isConnected&&previous.getClientRects().length>0&&!previous.closest('[inert]'))previous.focus({preventScroll:true});
  };
 },[open]);
 return <div ref={overlay} className="v851-drawer-overlay" data-elk-drawer-overlay="" data-state={open?'open':'closed'} hidden={!open} onClick={event=>{if(event.target===event.currentTarget)closeRef.current();}}>
  <div ref={panel} id={id} role="dialog" aria-modal={open?true:undefined} aria-hidden={!open} aria-label={label} tabIndex={-1} className={`v85-drawer v851-drawer-panel ${className}`} data-elk-drawer="" data-elk-drawer-release="8.5.1" data-elk-drawer-open={open?'true':'false'}>{children}</div>
 </div>;
}
