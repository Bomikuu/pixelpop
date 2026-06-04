import React, { useCallback } from "react";
import { motion } from "framer-motion";
import DatePlannerCard from "./DatePlannerCard";

/**
 * ActivitySelectionStep — "What do you want to do?"
 *
 * Multi-select activity cards. Must select ≥1 to proceed.
 *
 * @param {{ config: object, answers: object, onUpdate: (updates: object) => void, onNext: () => void }} props
 */
export default function ActivitySelectionStep({ config, answers, onUpdate, onNext, onBack }) {
  const { activityStep = {}, activities = [] } = config;
  const selected = answers.activities || [];

  const canProceed = selected.length > 0;

  const handleToggle = useCallback(
    (actId) => {
      const next = selected.includes(actId)
        ? selected.filter((id) => id !== actId)
        : [...selected, actId];
      onUpdate({ activities: next });
    },
    [selected, onUpdate]
  );

  const handleNext = useCallback(() => {
    if (canProceed) onNext();
  }, [canProceed, onNext]);

  const stagger = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="dp-section-title">
        {activityStep.question || "What do you want to do?"}
      </h2>
      <p className="dp-section-subtitle">
        {activityStep.subtitle || "Pick any that sound fun! (You can choose more than one) 🌟"}
      </p>

      <motion.div
        className="dp-activity-grid"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {activities.map((act) => (
          <motion.div key={act.id} variants={itemAnim}>
            <DatePlannerCard
              selected={selected.includes(act.id)}
              onClick={() => handleToggle(act.id)}
              image={act.image}
              label={act.label}
              description={act.description}
            />
          </motion.div>
        ))}
      </motion.div>

      <div className="dp-step-nav">
        <button
          className="dp-btn dp-btn--secondary dp-btn--sm"
          onClick={onBack}
          type="button"
          id="dp-btn-activity-back"
        >
          ← Back
        </button>
        <button
          className="dp-btn dp-btn--primary dp-btn--lg"
          disabled={!canProceed}
          onClick={handleNext}
          type="button"
          id="dp-btn-activity-next"
        >
          {activityStep.nextButtonText || "Next"}{" "}
          {activityStep.nextButtonIcon || "→"}
        </button>
      </div>
    </motion.div>
  );
}