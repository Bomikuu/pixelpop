import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import RetroButton from "./Button";
import Badge from "./Badge";

const cx = (...c) => c.filter(Boolean).join(" ");

// Small in-memory event bus (simple + works well for MVP)
const listeners = new Set();
function emitToast(toast) {
  listeners.forEach((fn) => fn(toast));
}

export function useToastController() {
  const push = useCallback((toast) => emitToast(toast), []);
  const success = useCallback((msg, opts = {}) => emitToast({ type: "success", message: msg, ...opts }), []);
  const error = useCallback((msg, opts = {}) => emitToast({ type: "error", message: msg, ...opts }), []);
  const warn = useCallback((msg, opts = {}) => emitToast({ type: "warning", message: msg, ...opts }), []);
  const info = useCallback((msg, opts = {}) => emitToast({ type: "info", message: msg, ...opts }), []);
  return { push, success, error, warn, info };
}

/**
 * ToastHost
 * Place once at app root.
 */
export default function ToastHost({
  position = "top-right", // top-right | top-left | bottom-right | bottom-left
  max = 4,
  defaultDurationMs = 2800,
  className,
  containerClassName,

  // Tokens
  borderColor = "var(--pp-border)",
  shadow = "var(--pp-shadow)",
  bg = "rgba(255,255,255,0.9)",
}) {
  const [items, setItems] = useState([]);
  const idRef = useRef(1);

  useEffect(() => {
    const handler = (toast) => {
      const id = toast.id ?? `t_${idRef.current++}`;
      const durationMs = toast.durationMs ?? defaultDurationMs;

      setItems((prev) => {
        const next = [{ ...toast, id, durationMs }, ...prev];
        return next.slice(0, max);
      });

      if (durationMs > 0) {
        setTimeout(() => {
          setItems((prev) => prev.filter((t) => t.id !== id));
        }, durationMs);
      }
    };

    listeners.add(handler);
    return () => listeners.delete(handler);
  }, [defaultDurationMs, max]);

  const posClass = useMemo(() => {
    switch (position) {
      case "top-left":
        return "top-4 left-4 items-start";
      case "bottom-left":
        return "bottom-4 left-4 items-start";
      case "bottom-right":
        return "bottom-4 right-4 items-end";
      default:
        return "top-4 right-4 items-end";
    }
  }, [position]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={cx("fixed z-[9999] flex flex-col gap-2", posClass, containerClassName)}>
      {items.map((t) => (
        <ToastItem
          key={t.id}
          toast={t}
          onClose={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
          className={className}
          borderColor={borderColor}
          shadow={shadow}
          bg={bg}
        />
      ))}
    </div>,
    document.body
  );
}

function ToastItem({ toast, onClose, className, borderColor, shadow, bg }) {
  const { type = "info", title, message } = toast;

  const badgeVariant =
    type === "success" ? "success" :
    type === "error" ? "danger" :
    type === "warning" ? "warning" :
    "info";

  return (
    <div
      className={cx(
        "w-[320px] max-w-[calc(100vw-2rem)]",
        "border-[3px] rounded-xl overflow-hidden",
        "font-pp",
        "animate-[ppToastIn_160ms_ease-out]",
        className
      )}
      style={{ borderColor, boxShadow: shadow, background: bg }}
    >
      <div className="px-3 py-2 border-b-[3px] flex items-center justify-between gap-2" style={{ borderColor }}>
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant={badgeVariant}>{type.toUpperCase()}</Badge>
          <div className="font-extrabold text-xs truncate">
            {title || "PIXELPOPUP.EXE"}
          </div>
        </div>

        <RetroButton variant="ghost" size="sm" onClick={onClose} className="!px-2 !py-1">
          ✕
        </RetroButton>
      </div>

      <div className="px-3 py-3">
        <div className="text-sm font-extrabold">{message}</div>
      </div>

      <style>{`
        @keyframes ppToastIn {
          from { transform: translateY(-6px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
