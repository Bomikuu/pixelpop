import React, { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import DatePlannerCard from "./DatePlannerCard";

/**
 * DetailsStep — Dynamic details based on selected activities.
 *
 * Renders cuisine/movie/matcha detail sections dynamically,
 * plus meeting location + other details inputs,
 * plus a live mini summary card.
 *
 * @param {{ config: object, answers: object, onUpdate: (updates: object) => void, onNext: () => void }} props
 */
export default function DetailsStep({ config, answers, onUpdate, onNext }) {
  const { activities = [], detailOptions = {}, detailsStep = {}, timeStep = {} } = config;

  // Figure out which detail sections to show
  const selectedActivities = answers.activities || [];
  const detailSections = useMemo(() => {
    return selectedActivities
      .map((actId) => activities.find((a) => a.id === actId))
      .filter((a) => a && a.requiresDetails && a.detailType)
      .map((a) => ({
        activityId: a.id,
        detailType: a.detailType,
        config: detailOptions[a.detailType] || {},
      }));
  }, [selectedActivities, activities, detailOptions]);

  const handleDetailSelect = useCallback(
    (detailType, optionId) => {
      onUpdate({ [detailType]: optionId });
    },
    [onUpdate]
  );

  const handleInputChange = useCallback(
    (field) => (e) => {
      onUpdate({ [field]: e.target.value });
    },
    [onUpdate]
  );

  // Resolve display label for time
  const timeLabel = useMemo(() => {
    if (answers.time === "__custom__") {
      return answers.customTime || "Custom";
    }
    const opt = (timeStep.options || []).find((o) => o.id === answers.time);
    return opt ? opt.label : answers.time || "—";
  }, [answers.time, answers.customTime, timeStep.options]);

  // Resolve activity labels
  const activityLabels = useMemo(() => {
    return selectedActivities
      .map((id) => {
        const a = activities.find((x) => x.id === id);
        return a ? a.label.replace(/\n/g, " ") : id;
      })
      .join(", ");
  }, [selectedActivities, activities]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="dp-details-layout">
        {/* Main: dynamic detail sections */}
        <div className="dp-details-main">
          {detailSections.map(({ detailType, config: sectionCfg }) => (
            <motion.div
              key={detailType}
              className="dp-detail-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="dp-detail-section-title">
                {sectionCfg.question || `Choose ${detailType}`}
              </div>
              <div className="dp-detail-grid">
                {(sectionCfg.options || []).map((opt) => (
                  <DatePlannerCard
                    key={opt.id}
                    small
                    selected={answers[detailType] === opt.id}
                    onClick={() => handleDetailSelect(detailType, opt.id)}
                    image={opt.image}
                    label={opt.label}
                    genre={opt.genre}
                  />
                ))}
                <DatePlannerCard small showMore onClick={() => {}} />
              </div>
            </motion.div>
          ))}

          {/* Always show meet location + other details on the main side (mobile) */}
          <div className="dp-detail-section dp-details-inputs-mobile">
            <div className="dp-input-group">
              <label className="dp-input-label">
                {detailsStep.meetLocationIcon || "📍"}{" "}
                {detailsStep.meetLocationLabel || "Where do you want to meet?"}
              </label>
              <div className="dp-input-wrapper">
                <input
                  className="dp-input"
                  type="text"
                  placeholder={detailsStep.meetLocationPlaceholder || "e.g., Central Park"}
                  value={answers.meetLocation || ""}
                  onChange={handleInputChange("meetLocation")}
                  id="dp-meet-location"
                />
              </div>
            </div>

            <div className="dp-input-group">
              <label className="dp-input-label">
                {detailsStep.otherDetailsLabel || "Any other details?"}
              </label>
              <textarea
                className="dp-input"
                rows={3}
                placeholder={detailsStep.otherDetailsPlaceholder || "Add notes..."}
                value={answers.otherDetails || ""}
                onChange={handleInputChange("otherDetails")}
                maxLength={detailsStep.otherDetailsMaxLength || 200}
                id="dp-other-details"
              />
              <div className="dp-char-count">
                {(answers.otherDetails || "").length}/{detailsStep.otherDetailsMaxLength || 200}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: inputs + mini summary */}
        <div className="dp-details-sidebar">
          <div className="dp-detail-section" style={{ marginBottom: 16 }}>
            <div className="dp-input-group">
              <label className="dp-input-label">
                {detailsStep.meetLocationIcon || "📍"}{" "}
                {detailsStep.meetLocationLabel || "Where do you want to meet?"}
              </label>
              <div className="dp-input-wrapper">
                <input
                  className="dp-input"
                  type="text"
                  placeholder={detailsStep.meetLocationPlaceholder || "e.g., Central Park"}
                  value={answers.meetLocation || ""}
                  onChange={handleInputChange("meetLocation")}
                  id="dp-sidebar-meet-location"
                />
              </div>
            </div>

            <div className="dp-input-group" style={{ marginBottom: 0 }}>
              <label className="dp-input-label">
                {detailsStep.otherDetailsLabel || "Any other details?"}
              </label>
              <textarea
                className="dp-input"
                rows={3}
                placeholder={detailsStep.otherDetailsPlaceholder || "Add notes..."}
                value={answers.otherDetails || ""}
                onChange={handleInputChange("otherDetails")}
                maxLength={detailsStep.otherDetailsMaxLength || 200}
                id="dp-sidebar-other-details"
              />
              <div className="dp-char-count">
                {(answers.otherDetails || "").length}/{detailsStep.otherDetailsMaxLength || 200}
              </div>
            </div>
          </div>

          {/* Mini summary */}
          <div className="dp-mini-summary">
            <div className="dp-mini-summary-title">
              {detailsStep.summaryLabel || "Date Plan Summary"}
            </div>

            <div className="dp-mini-summary-row">
              <span className="dp-mini-summary-icon">📅</span>
              <span className="dp-mini-summary-value">
                {config.invitation?.dateLabel || "Saturday"}
              </span>
            </div>

            <div className="dp-mini-summary-row">
              <span className="dp-mini-summary-icon">🕐</span>
              <span className="dp-mini-summary-value">{timeLabel}</span>
            </div>

            <div className="dp-mini-summary-row">
              <span className="dp-mini-summary-icon">💗</span>
              <span className="dp-mini-summary-value">{activityLabels || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Send button */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
        <button
          className="dp-btn dp-btn--primary dp-btn--lg"
          onClick={onNext}
          type="button"
          id="dp-btn-send-plan"
        >
          <span className="dp-btn-icon">{detailsStep.sendButtonIcon || "💗"}</span>
          {detailsStep.sendButtonText || "Send Date Plan"}
        </button>
      </div>
    </motion.div>
  );
}
