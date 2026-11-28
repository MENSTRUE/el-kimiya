import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../lib/language';

/** Full-viewport workspace (not a native dialog, which may fail to paint in WebView).
 * A same-URL history entry lets browser Back leave the tool without leaving the lab.
 */
export function useMoleculeFullscreen86(kind: 'builder' | 'viewer') {
  const [expanded, setExpanded] = useState(false);
  const open = useCallback(() => {
    if (expanded) return;
    window.history.pushState({ ...window.history.state, elkMolecule86: kind }, '');
    setExpanded(true);
  }, [kind, expanded]);
  const close = useCallback(() => {
    setExpanded(false);
    if (window.history.state?.elkMolecule86 === kind) window.history.back();
  }, [kind]);
  useEffect(() => {
    if (!expanded) return;
    const onBack = () => setExpanded(false);
    window.addEventListener('popstate', onBack);
    window.addEventListener('hashchange', onBack);
    return () => {
      window.removeEventListener('popstate', onBack);
      window.removeEventListener('hashchange', onBack);
    };
  }, [expanded]);
  return { expanded, open, close };
}

export function MoleculeFullscreen86({ kind, title, anchor, onClose, children }: {
  kind: 'builder' | 'viewer'; title: string; anchor: HTMLElement | null;
  onClose: () => void; children: ReactNode;
}) {
  const { language } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const host = anchor?.closest('.app') ?? document.body;
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const siblings = Array.from(host.children).filter((node): node is HTMLElement => node instanceof HTMLElement && node !== panel);
    const oldInert = siblings.map(node => node.inert);
    siblings.forEach(node => { node.inert = true; });
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key !== 'Tab') return;
      const controls = Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled),[href],input:not(:disabled),[tabindex]:not([tabindex="-1"])')).filter(node => node.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first && last) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last && first) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      siblings.forEach((node, i) => { node.inert = oldInert[i]; });
      document.documentElement.style.overflow = overflow;
      // The inline viewer is remounted after closing; its previous button may
      // no longer exist. Restore focus to the new launcher after React commits.
      if (returnFocus?.isConnected && returnFocus !== document.body) returnFocus.focus({ preventScroll: true });
      else requestAnimationFrame(() => anchor?.querySelector<HTMLElement>(`[data-elk-molecule-open="${kind}"]`)?.focus({ preventScroll: true }));
    };
  }, [host, onClose, anchor, kind]);
  return createPortal(<div ref={panelRef} className={`molecule86-fullscreen molecule86-${kind}-fullscreen`}
    role="dialog" aria-modal="true" aria-labelledby={`molecule86-${kind}-title`} data-elk-molecule-fullscreen={kind} data-elk-drawer-open="true">
    <header className="molecule86-full-header">
      <button ref={closeRef} type="button" className="molecule86-back" onClick={onClose} data-elk-drawer-close
        aria-label={language === 'id' ? 'Kembali ke laboratorium molekul' : 'Back to molecular lab'}>
        <ArrowLeft size={21}/><span>{language === 'id' ? 'Kembali' : 'Back'}</span>
      </button>
      <h2 id={`molecule86-${kind}-title`}>{title}</h2>
    </header>
    {children}
  </div>, host);
}
