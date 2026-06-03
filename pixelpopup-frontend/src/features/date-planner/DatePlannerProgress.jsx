import React from "react";
import { motion } from "framer-motion";

/**
 * DatePlannerProgress — Horizontal step progress bar.
 * Steps are fully driven by the config `steps` array.
 *
 * @param {{ steps: Array<{id:string, label:string}>, currentStep: number }} props
 */
export default function DatePlannerProgress({ steps = [], currentStep = 0 }) {
  return (
    <div className="dp-progress">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;

        return (
          <React.Fragment key={step.id}>
            {idx > 0 && (
              <div
                className={`dp-progress-line ${idx <= currentStep ? "dp-progress-line--completed" : ""}`}
              />
            )}
            <div className="dp-progress-step">
              <motion.div
                className={`dp-progress-circle ${isActive ? "dp-progress-circle--active" : ""
                  } ${isCompleted ? "dp-progress-circle--completed" : ""}`}
                initial={false}
                animate={
                  isActive
                    ? {
                      scale: [1, 1.08, 1],
                      transition: {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }
                    : { scale: 1 }
                }
              >
                {isCompleted ? "✓" : idx + 1}
              </motion.div>
              <div
                className={`dp-progress-label ${isActive ? "dp-progress-label--active" : ""
                  } ${isCompleted ? "dp-progress-label--completed" : ""}`}
              >
                {step.label}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
