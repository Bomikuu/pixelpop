import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";

/**
 * ProfileRetroModal — Tinder-style profile card modal.
 *
 * Shows avatar, name, short description, and a "disabled" toggle field.
 * Styled in a soft date planner style using Tailwind.
 *
 * @param {{ user: object, config: object, onClose: () => void }} props
 */
export default function ProfileRetroModal({ user, config, onClose }) {
  const [disabled, setDisabled] = useState(user.disabled || false);

  const handleToggleDisabled = useCallback((e) => {
    e.stopPropagation();
    setDisabled((v) => !v);
  }, []);

  const fullUser = (config.users || []).find((u) => u.id === user.id) || user;

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/35 backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-[94%] max-w-[520px] overflow-hidden border-[3px] border-[var(--dp-primary)] bg-white shadow-[0_16px_64px_rgba(0,0,0,0.25)] outline outline-2 outline-offset-[3px] outline-[var(--dp-primary-light)]"
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute right-2.5 top-2.5 z-20 flex h-8 w-8 items-center justify-center bg-black/45 text-base font-bold text-white transition-all duration-200 hover:scale-110 hover:bg-black/70 cursor-pointer"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--dp-primary-pale)] sm:aspect-[16/10]">
          <img
            className="block h-full w-full object-cover object-top"
            src={fullUser.avatar}
            alt={fullUser.name}
            draggable={false}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-black/60" />

          <div className="absolute bottom-4 left-4 flex items-baseline gap-2">
            <span className="font-['Nunito','Segoe_UI',system-ui,sans-serif] text-[1.8rem] font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
              {fullUser.name}
            </span>

            {fullUser.age && (
              <span className="font-['Nunito','Segoe_UI',system-ui,sans-serif] text-lg font-bold text-white/90">
                {fullUser.age}
              </span>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-5">
          {fullUser.tags && fullUser.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {fullUser.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center border-[1.5px] border-[var(--dp-primary-light)] bg-[var(--dp-primary-pale)] px-2.5 py-1 font-['Nunito','Segoe_UI',system-ui,sans-serif] text-xs font-bold text-[var(--dp-primary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="mb-3 font-['Nunito','Segoe_UI',system-ui,sans-serif] text-sm font-medium leading-relaxed text-[var(--dp-text-light)]">
            {fullUser.bio || fullUser.description || "No description available."}
          </p>

          <div className="my-3 h-px bg-[var(--dp-border)]" />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {fullUser.location && (
              <div className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-center text-sm">📍</span>
                <span className="font-['Nunito','Segoe_UI',system-ui,sans-serif] text-sm font-semibold text-[var(--dp-text)]">
                  {fullUser.location}
                </span>
              </div>
            )}

            {fullUser.occupation && (
              <div className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-center text-sm">💼</span>
                <span className="font-['Nunito','Segoe_UI',system-ui,sans-serif] text-sm font-semibold text-[var(--dp-text)]">
                  {fullUser.occupation}
                </span>
              </div>
            )}

            {fullUser.vibe && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <span className="w-5 shrink-0 text-center text-sm">✨</span>
                <span className="font-['Nunito','Segoe_UI',system-ui,sans-serif] text-sm font-semibold text-[var(--dp-text)]">
                  {fullUser.vibe}
                </span>
              </div>
            )}
          </div>

          <div className="my-4 h-px bg-[var(--dp-border)]" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-px text-xl">{disabled ? "🚫" : "✅"}</span>

              <div>
                <div className="font-['Nunito','Segoe_UI',system-ui,sans-serif] text-sm font-bold text-[var(--dp-text)]">
                  {disabled ? "Profile Disabled" : "Profile Active"}
                </div>

                <div className="font-['Nunito','Segoe_UI',system-ui,sans-serif] text-xs font-medium text-[var(--dp-text-muted)]">
                  {disabled
                    ? "This person won't appear in the date planner."
                    : "This person is part of the date plan."}
                </div>
              </div>
            </div>

            <div
              className={`relative h-7 w-12 min-w-12 shrink-0 cursor-pointer rounded-full border-0 p-0 transition-colors duration-300 ${disabled ? "bg-[var(--dp-border)]" : "bg-[var(--dp-primary)]"
                }`}
              onClick={handleToggleDisabled}
              type="button"
              aria-label={disabled ? "Enable profile" : "Disable profile"}
            >
              <span
                className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18)] transition-all duration-300 ${disabled ? "left-[3px]" : "left-[23px]"
                  }`}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}