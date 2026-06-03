import React, { useEffect, useMemo, useRef, useState } from "react";
import { subscribeOverlay } from "./overlayBus";
import { RetroModal, ToastHost, RetroLoading, useToastController  } from "../retro";
import EffectsHost, { dispatchEffect } from "./EffectsHost";

const cx = (...c) => c.filter(Boolean).join(" ");

function makeId(prefix = "ov") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export default function OverlayHost({
  className,

  // Toast config
  toastPosition = "top-right",
  toastMax = 4,
  toastDurationMs = 2800,

  // Modal defaults
  modalMaxWidthClass = "max-w-lg",

  // Loading defaults
  loadingOverlay = true,

  // Optional: allow you to override the actual components later
  components,
}) {
  const C = useMemo(() => {
    return {
      ToastHost: ToastHost,
      RetroModal: RetroModal,
      RetroLoading: RetroLoading,
      ...(components || {}),
    };
  }, [components]);

  const [modals, setModals] = useState([]);
  const [loading, setLoading] = useState(null);

  // We use the ToastHost's built-in bus, so OverlayHost only needs to render it.
  // But we also support overlay.toast(...) by calling the ToastHost bus indirectly:
  // We'll do it by importing useToastController INSIDE a small bridge component.
  // To keep OverlayHost simple, we’ll just dispatch a CustomEvent that ToastBridge listens to.
  const toastEventName = "pp_toast_event";
  const toastEventNameRef = useRef(toastEventName);

  useEffect(() => {
    const unsub = subscribeOverlay((evt) => {
      if (!evt) return;

      if (evt.type === "modal:show") {
        const payload = evt.payload || {};
        const id = payload.id || makeId("m");
        setModals((prev) => [...prev, { ...payload, id }]);
        return;
      }

      if (evt.type === "modal:hide") {
        setModals((prev) => prev.filter((m) => m.id !== evt.id));
        return;
      }

      if (evt.type === "loading:show") {
        const payload = evt.payload || {};
        setLoading({ ...payload, id: payload.id || makeId("l") });
        return;
      }

      if (evt.type === "loading:hide") {
        setLoading(null);
        return;
      }

      if (evt.type === "toast") {
        window.dispatchEvent(
          new CustomEvent(toastEventNameRef.current, { detail: evt.payload || {} })
        );
        return;
      }

      if (evt.type === "effect") {
        dispatchEffect(evt.payload || {});
        return;
    }
    });

    return () => unsub();
  }, []);

  return (
    <div className={cx(className)}>
      {/* Toasts */}
      <EffectsHost />
      <C.ToastHost
        position={toastPosition}
        max={toastMax}
        defaultDurationMs={toastDurationMs}
      />
      <ToastBridge eventName={toastEventNameRef.current} />

      {/* Loading overlay */}
      {loading ? (
        <C.RetroLoading
          overlay={loadingOverlay}
          {...loading}
        />
      ) : null}

      {/* Modal stack (last modal wins) */}
      {modals.map((m) => (
        <C.RetroModal
          key={m.id}
          open={true}
          onClose={() => {
            m.onClose?.();
            setModals((prev) => prev.filter((x) => x.id !== m.id));
          }}
          title={m.title}
          subtitle={m.subtitle}
          footer={m.footer}
          showDefaultActions={m.showDefaultActions}
          confirmText={m.confirmText}
          cancelText={m.cancelText}
          onConfirm={() => {
            m.onConfirm?.();
            if (m.closeOnConfirm !== false) {
              setModals((prev) => prev.filter((x) => x.id !== m.id));
            }
          }}
          confirmVariant={m.confirmVariant}
          cancelVariant={m.cancelVariant}
          disableConfirm={m.disableConfirm}
          disableCancel={m.disableCancel}
          closeOnBackdrop={m.closeOnBackdrop}
          closeOnEsc={m.closeOnEsc}
          maxWidthClass={m.maxWidthClass || modalMaxWidthClass}
          windowProps={m.windowProps}
        >
          {m.content}
        </C.RetroModal>
      ))}
    </div>
  );
}

/**
 * ToastBridge
 * Listens to CustomEvents and pushes to ToastHost bus using useToastController.
 * This keeps OverlayHost usable without adding global state dependencies.
 */
function ToastBridge({ eventName }) {
  const toast = useToastController();

  useEffect(() => {
    const onEvt = (e) => {
      const payload = e?.detail || {};
      if (!payload) return;

      const type = payload.type || "info";
      const message = payload.message || payload.msg || "…";
      const title = payload.title;

      toast.push({ ...payload, type, message, title });
    };

    window.addEventListener(eventName, onEvt);
    return () => window.removeEventListener(eventName, onEvt);
  }, [eventName, toast]);

  return null;
}