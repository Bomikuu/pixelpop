import { useEffect, useState } from "react";

// Clockwise from right. Each pose comes from the supplied seated atlas.
const DIRECTIONS = [5, 3, 2, 7, 1, 0, 6, 4];

export default function useStationaryGaze(anchorRef) {
  const [pose, setPose] = useState(8);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let previousTime = 0;
    let gaze = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };
    let candidate = 8;
    let candidateSince = 0;

    const animate = (time) => {
      frame = 0;
      const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16;
      previousTime = time;
      const ease = 1 - Math.exp(-elapsed / 110);
      gaze.x += (target.x - gaze.x) * ease;
      gaze.y += (target.y - gaze.y) * ease;
      const direction = Math.round(Math.atan2(gaze.y, gaze.x) / (Math.PI / 4));
      const next = Math.hypot(gaze.x, gaze.y) < 0.15 ? 8 : DIRECTIONS[(direction + 8) % 8];
      if (candidate !== next) { candidate = next; candidateSince = time; }
      // A short dwell prevents chatter at the boundary between two poses.
      if (time - candidateSince >= 80) setPose(next);
      if (Math.hypot(target.x - gaze.x, target.y - gaze.y) > 0.002 || time - candidateSince < 80) {
        frame = requestAnimationFrame(animate);
      } else previousTime = 0;
    };
    const wake = () => {
      if (!frame && !document.hidden && !reduced.matches && finePointer.matches) frame = requestAnimationFrame(animate);
    };
    const track = (event) => {
      if (event.pointerType === "touch" || reduced.matches || !finePointer.matches || !anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height * 0.4);
      const distance = Math.hypot(x, y);
      target = distance < 48 ? { x: 0, y: 0 } : { x: x / distance, y: y / distance };
      wake();
    };
    const rest = () => { target = { x: 0, y: 0 }; wake(); };
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      target = gaze = { x: 0, y: 0 };
      candidate = 8;
      candidateSince = 0;
      setPose(8);
    };
    window.addEventListener("pointermove", track, { passive: true });
    window.addEventListener("blur", reset);
    document.documentElement.addEventListener("pointerleave", rest);
    document.addEventListener("visibilitychange", reset);
    reduced.addEventListener("change", reset);
    finePointer.addEventListener("change", reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", track);
      window.removeEventListener("blur", reset);
      document.documentElement.removeEventListener("pointerleave", rest);
      document.removeEventListener("visibilitychange", reset);
      reduced.removeEventListener("change", reset);
      finePointer.removeEventListener("change", reset);
    };
  }, [anchorRef]);

  return pose;
}
