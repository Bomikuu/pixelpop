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
 * @param {{ config: object, onAccept: () => void, triggerEffect: (type: string, payload?: object) => void }} props
 */
export default function DateInvitationStep({ config, onAccept, triggerEffect }) {
  const [showNoPopup, setShowNoPopup] = useState(false);

  const { invitation = {}, users = [] } = config;
  const user1 = users[0] || {};
  const user2 = users[1] || {};
  const showHeart = invitation.showHeartBetweenAvatars !== false;
  const noPopup = invitation.noPopup || {};

  const handleYes = useCallback(() => {
    // Trigger confetti and success sound
    triggerEffect?.("confetti", { particleCount: 150, spread: 80, origin: { x: 0.5, y: 0.6 } });
    triggerEffect?.("sfx", { name: "success", volume: 0.04 });

    setTimeout(() => {
      onAccept?.();
    }, 600);
  }, [onAccept, triggerEffect]);

  const handleNo = useCallback(() => {
    // Show cute popup
    triggerEffect?.("shake", { ms: 300, intensity: 3 });
    setShowNoPopup(true);
  }, [triggerEffect]);

  const questionLines = (invitation.question || "Go out with me\nthis Saturday?").split("\n");

  return (
    <motion.div
      className="dp-invitation"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      {/* Avatars */}
      <div className="dp-avatars">
        <div className="dp-avatar-wrapper">
          <motion.img
            className="dp-avatar"
            src={user1.avatar}
            alt={user1.name}
            draggable={false}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          />
          <span className="dp-avatar-heart dp-avatar-heart--top" style={{ animationDelay: "0.3s" }}>💗</span>
        </div>

        {showHeart && (
          <div className="dp-avatar-connector">
            <motion.span
              className="dp-avatar-connector-heart"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            >
              💕
            </motion.span>
            <div className="dp-avatar-connector-dots">
              <span className="dp-avatar-connector-dot" />
              <span className="dp-avatar-connector-dot" />
              <span className="dp-avatar-connector-dot" />
            </div>
          </div>
        )}

        <div className="dp-avatar-wrapper">
          <motion.img
            className="dp-avatar"
            src={user2.avatar}
            alt={user2.name}
            draggable={false}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />
          <span className="dp-avatar-heart dp-avatar-heart--bottom" style={{ animationDelay: "0.6s" }}>💗</span>
        </div>
      </div>

      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <h1 className="dp-invitation-title">
          <span className="dp-invitation-hearts">♡ </span>
          {questionLines.map((line, i) => (
            <React.Fragment key={i}>
              {i === questionLines.length - 1 ? (
                <span>{line}</span>
              ) : (
                <>
                  {line}
                  <br />
                </>
              )}
            </React.Fragment>
          ))}
          <span className="dp-invitation-hearts"> ♡</span>
        </h1>

        <p className="dp-invitation-subtitle">{invitation.subtitle}</p>
      </motion.div>

      {/* Buttons */}
      <motion.div
        className="dp-invitation-buttons"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <button
          className="dp-btn dp-btn--secondary dp-btn--lg"
          onClick={handleNo}
          type="button"
          id="dp-btn-no"
        >
          <span className="dp-btn-icon">✕</span>
          {invitation.noText || "No"}
        </button>

        <button
          className="dp-btn dp-btn--primary dp-btn--lg"
          onClick={handleYes}
          type="button"
          id="dp-btn-yes"
        >
          <span className="dp-btn-icon">💗</span>
          {invitation.yesText || "Yes"}
        </button>
      </motion.div>

      {/* "No" Popup */}
      <AnimatePresence>
        {showNoPopup && (
          <motion.div
            className="dp-popup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNoPopup(false)}
          >
            <motion.div
              className="dp-popup"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dp-popup-emoji">{noPopup.emoji || "🥺"}</div>
              <div className="dp-popup-title">{noPopup.title || "Are you sure?"}</div>
              <div className="dp-popup-message" style={{ whiteSpace: "pre-line" }}>
                {noPopup.message || "Maybe think about it one more time?"}
              </div>
              <button
                className="dp-popup-btn"
                onClick={() => setShowNoPopup(false)}
                type="button"
                id="dp-popup-dismiss"
              >
                {noPopup.buttonText || "Okay, let me reconsider 💗"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
