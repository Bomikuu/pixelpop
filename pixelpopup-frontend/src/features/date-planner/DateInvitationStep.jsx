import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * DateInvitationStep — "Go out with me this Saturday?"
 *
 * Shows avatars, question, Yes/No buttons.
 * - "No" triggers a cute popup modal.
 * - "Yes" triggers confetti + advances.
 * - Heart between avatars is optional via config.
 *
 * @param {{ config: object, onAccept: () => void, triggerEffect: (type: string, payload?: object) => void, onOpenProfile?: (user: object) => void }} props
 */
export default function DateInvitationStep({
  config,
  onAccept,
  triggerEffect,
  onOpenProfile,
}) {
  const [showNoPopup, setShowNoPopup] = useState(false);

  const { invitation = {}, users = [] } = config;
  const user1 = users[0] || {};
  const user2 = users[1] || {};
  const showHeart = invitation.showHeartBetweenAvatars !== false;
  const noPopup = invitation.noPopup || {};

  const handleYes = useCallback(() => {
    triggerEffect?.("confetti", {
      particleCount: 150,
      spread: 80,
      origin: { x: 0.5, y: 0.6 },
    });

    triggerEffect?.("sfx", {
      name: "success",
      volume: 0.04,
    });

    setTimeout(() => {
      onAccept?.();
    }, 600);
  }, [onAccept, triggerEffect]);

  const handleNo = useCallback(() => {
    triggerEffect?.("shake", {
      ms: 300,
      intensity: 3,
    });

    setShowNoPopup(true);
  }, [triggerEffect]);

  const questionLines = (
    invitation.question || "Go out with me\nthis Saturday?"
  ).split("\n");

  const avatarClassName =
    "h-40 w-40 cursor-pointer rounded-full border-[5px] border-[var(--dp-primary-light)] bg-[var(--dp-primary-pale)] object-cover object-center shadow-[0_8px_28px_rgba(0,0,0,0.12)] transition-all duration-200 hover:scale-105 hover:shadow-[0_0_0_4px_var(--dp-primary),0_10px_28px_rgba(255,92,138,0.28)] max-md:h-32 max-md:w-32 max-sm:h-24 max-sm:w-24";

  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      {/* Avatars */}
      <div className="mb-8 flex items-center justify-center gap-6 max-sm:gap-4">
        <div className="relative flex items-center justify-center">
          <motion.img
            className={avatarClassName}
            src={user1.avatar}
            alt={user1.name}
            draggable={false}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              if (user1.disabled) return;
              onOpenProfile?.(user1);
            }}
            title={`View ${user1.name}'s profile`}
          />

          <span
            className="absolute -right-2 -top-3 animate-[dp-float_2s_ease-in-out_infinite] text-xl"
            style={{ animationDelay: "0.3s" }}
          >
            ✨
          </span>
        </div>

        {showHeart && (
          <div className="flex flex-col items-center gap-1">
            <motion.span
              className="animate-[dp-heartbeat_1.2s_ease-in-out_infinite] text-3xl text-[var(--dp-primary)]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.5,
                type: "spring",
                stiffness: 300,
              }}
            >
              ✨
            </motion.span>

            <div className="flex gap-1">
              <span className="h-1 w-1 rounded-full bg-[var(--dp-primary-light)]" />
              <span className="h-1 w-1 rounded-full bg-[var(--dp-primary-light)]" />
              <span className="h-1 w-1 rounded-full bg-[var(--dp-primary-light)]" />
            </div>
          </div>
        )}

        <div className="relative flex items-center justify-center">
          <motion.img
            className={avatarClassName}
            src={user2.avatar}
            alt={user2.name}
            draggable={false}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              if (user2.disabled) return;
              onOpenProfile?.(user2);
            }}
            title={`View ${user2.name}'s profile`}
          />

          <span
            className="absolute -bottom-1 -left-2 animate-[dp-float_2s_ease-in-out_infinite] text-xl"
            style={{ animationDelay: "0.6s" }}
          >
            ✨
          </span>
        </div>
      </div>

      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {/* Greeting */}
        {user2.name && (
          <motion.p
            className="mb-2 text-[1.35rem] font-bold text-[var(--dp-text-light)] max-md:text-lg"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            Hi,{" "}
            <span className="text-[var(--dp-primary)]">{user2.name}</span>
          </motion.p>
        )}

        <h1 className="mb-3 text-[2.6rem] font-black leading-[1.25] text-[var(--dp-text)] max-md:text-[2rem]">
          <span className="text-base text-[var(--dp-primary-light)]">♡ </span>

          {questionLines.map((line, i) => (
            <React.Fragment key={i}>
              {i === questionLines.length - 1 ? (
                <span className="text-[var(--dp-primary)]">{line}</span>
              ) : (
                <>
                  {line}
                  <br />
                </>
              )}
            </React.Fragment>
          ))}

          <span className="text-base text-[var(--dp-primary-light)]"> ♡</span>
        </h1>

        <p className="mb-8 text-[1.1rem] font-medium text-[var(--dp-text-light)] max-md:text-sm">
          {invitation.subtitle}
        </p>
      </motion.div>

      {/* Buttons */}
      <motion.div
        className="flex items-center justify-center gap-4 max-md:flex-col max-md:gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <div
          className="inline-flex items-center justify-center gap-2 border-[2.5px] border-[var(--dp-border)] bg-white px-12 py-4 text-[1.1rem] font-bold leading-tight text-[var(--dp-text)] shadow-[var(--dp-shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--dp-primary-light)] hover:shadow-[var(--dp-shadow)] active:scale-95 max-md:w-full max-md:max-w-[280px] cursor-pointer"
          onClick={handleNo}
          id="dp-btn-no"
        >
          <span className="text-[1.1em]">✕</span>
          {invitation.noText || "No"}
        </div>

        <div
          className="inline-flex items-center justify-center gap-2 border-[2.5px] border-[var(--dp-primary)] bg-[var(--dp-primary)] px-12 py-4 text-[1.1rem] font-bold leading-tight text-white shadow-[var(--dp-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[var(--dp-shadow-lg)] active:scale-95 max-md:w-full max-md:max-w-[280px] cursor-pointer"
          onClick={handleYes}
          id="dp-btn-yes"
        >
          <span className="text-[1.1em]">💗</span>
          {invitation.yesText || "Yes"}
        </div>
      </motion.div>

      {/* "No" Popup */}
      <AnimatePresence>
        {showNoPopup && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/35 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNoPopup(false)}
          >
            <motion.div
              className="w-[90%] max-w-[380px] bg-white px-8 py-8 text-center shadow-[var(--dp-shadow-lg)]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 text-5xl">{noPopup.emoji || "🥺"}</div>

              <div className="mb-2 text-lg font-extrabold text-[var(--dp-text)]">
                {noPopup.title || "Are you sure?"}
              </div>

              <div
                className="mb-5 text-sm font-medium leading-relaxed text-[var(--dp-text-light)]"
                style={{ whiteSpace: "pre-line" }}
              >
                {noPopup.message || "Maybe think about it one more time?"}
              </div>

              <div
                className="inline-flex items-center gap-1.5 bg-[var(--dp-primary)] px-8 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[var(--dp-shadow-lg)]"
                onClick={() => setShowNoPopup(false)}
                type="button"
                id="dp-popup-dismiss"
              >
                {noPopup.buttonText || "Okay, let me reconsider 💗"}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}