import { useLayoutEffect, useRef } from "react";
import useWorkspaceMobile from "./useWorkspaceMobile";

export default function WorkspaceMobilePage({ viewKey, motionDisabled = false, children }) {
  const page = useRef(null);
  const previousView = useRef(viewKey);
  const mobile = useWorkspaceMobile();

  useLayoutEffect(() => {
    const changed = previousView.current !== viewKey;
    previousView.current = viewKey;
    if (!changed || !mobile || motionDisabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !page.current?.animate) return;
    // Confirm navigation without remounting the destination or delaying its controls.
    const animation = page.current.animate(
      [{ opacity: 0.65, transform: "translateX(8px)" }, { opacity: 1, transform: "none" }],
      { duration: 180, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
    return () => animation.cancel();
  }, [mobile, motionDisabled, viewKey]);

  return <div ref={page} className="workspace-mobile-page">{children}</div>;
}
