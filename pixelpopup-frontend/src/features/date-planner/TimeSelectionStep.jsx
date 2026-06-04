import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import OptionCarousel from "./OptionCarousel";

/**
 * TimeSelectionStep — "What time are you available?"
 *
 * Shows time pills or carousel (5+ options), custom time input, optional note, and save button.
 * Includes a back button.
 *
 * @param {{ config: object, answers: object, onUpdate: (updates: object) => void, onNext: () => void, onBack: () => void }} props
 */
export default function TimeSelectionStep({ config, answers, onUpdate, onNext, onBack }) {
  const { timeStep = {} } = config;
  const [showCustom, setShowCustom] = useState(answers.time === "__custom__");

  const selectedTime = answers.time || "";
  const customTime = answers.customTime || "";
  const note = answers.note || "";

  const canProceed = selectedTime === "__custom__" ? !!customTime : !!selectedTime;

  const timeOptions = timeStep.options || [];

  const handleSelectTime = useCallback(
    (timeId) => {
      if (timeId === "__custom__") {
        setShowCustom(true);
        onUpdate({ time: "__custom__" });
      } else {
        setShowCustom(false);
        onUpdate({ time: timeId, customTime: "" });
      }
    },
    [onUpdate]
  );

  const handleCustomTimeChange = useCallback(
    (e) => {
      onUpdate({ customTime: e.target.value });
    },
    [onUpdate]
  );

  const handleNoteChange = useCallback(
    (e) => {
      onUpdate({ note: e.target.value });
    },
    [onUpdate]
  );

  const handleSave = useCallback(() => {
    if (canProceed) onNext();
  }, [canProceed, onNext]);

  // For carousel mode — wrap time options as toggleable
  const handleTimeToggleForCarousel = useCallback(
    (id) => handleSelectTime(id),
    [handleSelectTime]
  );

  return (
    <motion.div
      className="dp-time-modal"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="dp-time-icon">🕐</div>
      <h2 className="dp-time-title">{timeStep.question || "What time are you available?"}</h2>
      <p className="dp-time-subtitle">{timeStep.subtitle || "Choose a time that works for you."}</p>

      {/* Time pills or carousel if 5+ */}
      {timeOptions.length === 0 ? (
        <div className="dp-empty-options">
          <span className="dp-empty-options-icon">🕐</span>
          <p>No choices to be chosen from</p>
        </div>
      ) : timeOptions.length >= 5 ? (
        <OptionCarousel
          items={timeOptions}
          selected={selectedTime}
          onToggle={handleTimeToggleForCarousel}
          type="detail"
        />
      ) : (
        <div className="dp-time-options">
          {timeOptions.map((opt) => (
            <motion.button
              key={opt.id}
              type="button"
              className={`dp-time-pill ${selectedTime === opt.id ? "dp-time-pill--selected" : ""}`}
              onClick={() => handleSelectTime(opt.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </motion.button>
          ))}

          {timeStep.allowCustom && (
            <motion.button
              type="button"
              className={`dp-time-pill dp-time-pill--custom ${
                selectedTime === "__custom__" ? "dp-time-pill--selected" : ""
              }`}
              onClick={() => handleSelectTime("__custom__")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{timeStep.customIcon || "⏰"}</span>
              <span>{timeStep.customLabel || "Custom time"}</span>
            </motion.button>
          )}
        </div>
      )}

      {/* Custom time input */}
      {showCustom && (
        <motion.div
          className="dp-time-custom-input"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <input
            type="time"
            value={customTime}
            onChange={handleCustomTimeChange}
            id="dp-custom-time-input"
          />
        </motion.div>
      )}

      {/* Note */}
      {timeStep.noteEnabled && (
        <div className="dp-input-group">
          <label className="dp-input-label">{timeStep.noteLabel || "Add a note (optional)"}</label>
          <textarea
            className="dp-input"
            rows={3}
            placeholder={timeStep.notePlaceholder || "Anything you want to tell me?"}
            value={note}
            onChange={handleNoteChange}
            maxLength={200}
            id="dp-note-input"
          />
          <div className="dp-char-count">{note.length}/200</div>
        </div>
      )}

      {/* Navigation */}
      <div className="dp-step-nav">
        <button
          className="dp-btn dp-btn--secondary dp-btn--sm"
          onClick={onBack}
          type="button"
          id="dp-btn-time-back"
        >
          ← Back
        </button>
        <button
          className="dp-btn dp-btn--primary dp-btn--full"
          disabled={!canProceed}
          onClick={handleSave}
          type="button"
          id="dp-btn-save-time"
          style={{ flex: 1 }}
        >
          <span className="dp-btn-icon">{timeStep.saveButtonIcon || "💗"}</span>
          {timeStep.saveButtonText || "Save Time"}
        </button>
      </div>
    </motion.div>
  );
}
