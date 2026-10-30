import { useEffect, useState } from "react";

export default function useWorkspaceObstructions(enabled = true) {
  const [state, setState] = useState({ keyboardOpen: false, dialogOpen: false, mobile: false, viewportHeight: 0, viewportOffset: 0 });
  useEffect(() => {
    if (!enabled) return;
    const viewport = window.visualViewport;
    const mobile = window.matchMedia("(max-width: 1023px)");
    let frame;
    const read = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const editing = document.activeElement?.matches("input, textarea, [contenteditable='true']");
        const next = {
          mobile: mobile.matches,
          keyboardOpen: Boolean(editing && viewport && viewport.scale === 1 && window.innerHeight - viewport.height > 150),
          dialogOpen: Boolean(document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], dialog[open]')),
          viewportHeight: viewport?.scale === 1 ? Math.round(viewport.height) : window.innerHeight,
          viewportOffset: viewport?.scale === 1 ? Math.round(viewport.offsetTop) : 0,
        };
        setState((old) => Object.keys(next).every((key) => old[key] === next[key]) ? old : next);
      });
    };
    const observer = new MutationObserver(read);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state", "open"] });
    viewport?.addEventListener("resize", read);
    viewport?.addEventListener("scroll", read);
    window.addEventListener("resize", read);
    document.addEventListener("focusin", read);
    document.addEventListener("focusout", read);
    read();
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", read);
      viewport?.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      document.removeEventListener("focusin", read);
      document.removeEventListener("focusout", read);
    };
  }, [enabled]);
  return state;
}
