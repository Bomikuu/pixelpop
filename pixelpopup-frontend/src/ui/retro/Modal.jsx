import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import Window from "./Window";
import RetroButton from "./Button";

const cx = (...c) => c.filter(Boolean).join(" ");

export default function RetroModal({
  open,
  onClose,

  title = "DIALOG",
  subtitle,
  children,

  // Footer
  footer,
  showDefaultActions = false,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  confirmVariant = "primary",
  cancelVariant = "secondary",
  disableConfirm = false,
  disableCancel = false,

  // Behavior
  closeOnBackdrop = true,
  closeOnEsc = true,

  // Layout / style
  overlayClassName,
  modalClassName,
  windowProps,
  maxWidthClass = "max-w-lg",

  // Tokens
  backdropClassName = "bg-black/50",
  contentPaddingClass = "p-4",
}) {
  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEsc, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={cx(
        "fixed inset-0 z-[9999] flex items-center justify-center",
        overlayClassName
      )}
      role="dialog"
      aria-modal="true"
    >
      <div className={cx("absolute inset-0", backdropClassName)} />

      <div
        className={cx("relative w-full px-4", modalClassName)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="mx-auto"
          style={{ maxWidth: "42rem" }}
        >
          <Window
            title={title}
            subtitle={subtitle}
            maxWidthClass={maxWidthClass}
            widthClass="w-full"
            closable
            onClose={onClose}
            {...windowProps}
          >
            <div className={contentPaddingClass}>{children}</div>

            {(footer || showDefaultActions) ? (
              <div
                className="border-t-[3px] px-4 py-3 flex items-center justify-end gap-2"
                style={{ borderColor: "var(--pp-border)" }}
              >
                {footer ? (
                  footer
                ) : (
                  <>
                    <RetroButton
                      variant={cancelVariant}
                      onClick={onClose}
                      disabled={disableCancel}
                    >
                      {cancelText}
                    </RetroButton>

                    <RetroButton
                      variant={confirmVariant}
                      onClick={onConfirm}
                      disabled={disableConfirm}
                    >
                      {confirmText}
                    </RetroButton>
                  </>
                )}
              </div>
            ) : null}
          </Window>
        </div>
      </div>

      {/* Backdrop click handling */}
      <div
        className="absolute inset-0"
        onMouseDown={() => {
          if (closeOnBackdrop) onClose?.();
        }}
      />
    </div>,
    document.body
  );
}
