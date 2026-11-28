import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../lib/language';

/** Browser history is optional. Android handles the real Back button via the
 * close marker, so opening a local workspace must not touch native navigation. */
export function useMoleculeFullscreen86(kind: 'builder' | 'viewer') {
  const [expanded, setExpanded] = useState(false);
  const opened = useRef(false);
  const ownsHistory = useRef(false);
  const open = useCallback(() => {
    if (opened.current) return;
    opened.current = true;
    setExpanded(true);
    if (!/ElKimiyaAndroid\//.test(navigator.userAgent)) {
      try {
        window.history.pushState({ ...window.history.state, elkMolecule86: kind }, '');
        ownsHistory.current = true;
      } catch { /* History failure must never prevent the local editor opening. */ }
    }
  }, [kind]);
  const close = useCallback(() => {
    if (!opened.current) return;
    opened.current = false;
    setExpanded(false);
    const pop = ownsHistory.current && window.history.state?.elkMolecule86 === kind;
    ownsHistory.current = false;
    if (pop) { try { window.history.back(); } catch { /* UI is already closed. */ } }
  }, [kind]);
  useEffect(() => {
    if (!expanded) return;
    const onBack = () => { ownsHistory.current = false; opened.current = false; setExpanded(false); };
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
  const host = anchor?.closest<HTMLElement>('.app') ?? document.querySelector<HTMLElement>('.app');
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !host || panel.parentElement !== host) return;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scrollX = window.scrollX, scrollY = window.scrollY;
    // Dedicated in-flow screen: no fixed compositor layer, document scroll
    // lock, or global inert mutation. The old layout is hidden only after the
    // new panel is actually in the DOM. Existing React/graph state stays alive.
    host.dataset.elkMoleculeScreen = kind;
    // Some Android WebViews resolve CSS viewport-unit height to zero while
    // innerHeight still describes the real, nonzero viewport. Size this
    // dedicated screen from that actual measurement, before its first paint.
    const sizeToViewport = () => {
      const height = window.innerHeight;
      if (!Number.isFinite(height) || height <= 0) return;
      const px = Math.round(height) + 'px';
      panel.style.height = px;
      panel.style.minHeight = px;
      panel.style.maxHeight = px;
      panel.dataset.elkMoleculeViewport = 'measured';
    };
    sizeToViewport();
    const viewportFrame = window.requestAnimationFrame(sizeToViewport);
    window.addEventListener('resize', sizeToViewport);
    window.visualViewport?.addEventListener('resize', sizeToViewport);
    window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onCloseRef.current(); }
      if (event.key !== 'Tab') return;
      const controls = Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled),[href],input:not(:disabled),[tabindex]:not([tabindex="-1"])')).filter(node => node.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first && last) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last && first) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.cancelAnimationFrame(viewportFrame);
      window.removeEventListener('resize', sizeToViewport);
      window.visualViewport?.removeEventListener('resize', sizeToViewport);
      if (host.dataset.elkMoleculeScreen === kind) delete host.dataset.elkMoleculeScreen;
      window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
      requestAnimationFrame(() => {
        if (host.dataset.elkMoleculeScreen) return;
        const launcher = anchor?.querySelector<HTMLElement>(`[data-elk-molecule-open="${kind}"]`);
        (returnFocus?.isConnected && returnFocus !== document.body ? returnFocus : launcher)?.focus({ preventScroll: true });
        window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
      });
    };
  }, [host, anchor, kind]);
  const panel = <div ref={panelRef} className={`molecule86-fullscreen molecule86-${kind}-fullscreen`}
    role="dialog" aria-modal="true" aria-labelledby={`molecule86-${kind}-title`} data-elk-molecule-fullscreen={kind} data-elk-drawer-open="true">
    <header className="molecule86-full-header">
      <button ref={closeRef} type="button" className="molecule86-back" onClick={onClose} data-elk-drawer-close
        aria-label={language === 'id' ? 'Kembali ke laboratorium molekul' : 'Back to molecular lab'}>
        <ArrowLeft size={21}/><span>{language === 'id' ? 'Kembali' : 'Back'}</span>
      </button>
      <h2 id={`molecule86-${kind}-title`}>{title}</h2>
    </header>
    {children}
  </div>;
  return host ? createPortal(panel, host) : panel;
}
