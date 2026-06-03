import React, { useState, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { overlay } from "../../ui/overlay/overlayBus";

import DatePlannerProgress from "./DatePlannerProgress";
import DateInvitationStep from "./DateInvitationStep";
import TimeSelectionStep from "./TimeSelectionStep";
import ActivitySelectionStep from "./ActivitySelectionStep";
import DetailsStep from "./DetailsStep";
import SummaryStep from "./SummaryStep";

import "./datePlanner.css";

/**
 * DatePlanner — Main orchestrator component.
 *
 * Renders the full date planning flow driven by a JSON config.
 * Steps are configured in `config.steps` and can be reordered or extended.
 *
 * @param {{ config: object }} props
 */
const colorSchemes = [
  { id: "pink", label: "🌸 Pink", primary: "#ff5c8a" },
  { id: "lavender", label: "🍇 Lavender", primary: "#8b6fe8" },
  { id: "mint", label: "🌿 Mint", primary: "#0d9488" },
  { id: "sunset", label: "🍊 Sunset", primary: "#f97316" },
  { id: "ocean", label: "🐳 Ocean", primary: "#0284c7" },
];

const themeEmojis = {
  pink: ["💖", "✨", "🌸", "💕", "🍬"],
  lavender: ["💜", "✨", "🍇", "🔮", "🦄"],
  mint: ["💚", "✨", "🌿", "🍵", "🍃"],
  sunset: ["🧡", "✨", "🍊", "🍑", "🌅"],
  ocean: ["💙", "✨", "🐳", "💦", "🌊"],
};

export default function DatePlanner({ config }) {
  const steps = config.steps || [];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [colorScheme, setColorScheme] = useState(config.theme?.colorScheme || "pink");

  // All answers stored in a single object
  const [answers, setAnswers] = useState({
    accepted: false,
    time: "",
    customTime: "",
    note: "",
    activities: [],
    cuisine: "",
    movie: "",
    matchaPlace: "",
    meetLocation: "",
    otherDetails: "",
  });

  // Theme change handler
  const handleThemeChange = useCallback((themeId) => {
    setColorScheme(themeId);
    try {
      overlay.effect({
        type: "sfx",
        name: "beep",
        volume: 0.05,
        baseFreq: 700,
        durationMs: 60,
      });
    } catch {
      // ignore
    }
  }, []);

  // Background interactive click handler
  const handleBackgroundClick = useCallback((e) => {
    // Prevent triggering on interactive child elements
    const isInteractive = e.target.closest("button, a, input, textarea, .dp-card, select, [role='button']");
    if (isInteractive) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const emojis = themeEmojis[colorScheme] || ["💖", "✨", "🌸", "💕"];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    // Play soft pop sound
    try {
      const baseFreq = 500 + Math.random() * 300;
      overlay.effect({
        type: "sfx",
        name: "beep",
        volume: 0.04,
        baseFreq,
        durationMs: 40,
      });
    } catch {
      // ignore
    }

    // Spawn flying sticker
    try {
      overlay.spawnSticker({
        emoji,
        x,
        y,
        size: 28,
        entry: "zoomSpin",
        exit: "fade",
        durationMs: 900,
      });
    } catch {
      // ignore
    }
  }, [colorScheme]);

  // Update answers
  const handleUpdate = useCallback((updates) => {
    setAnswers((prev) => ({ ...prev, ...updates }));
  }, []);

  // Go to next step
  const handleNext = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  // Trigger overlay effects (reuse existing overlay bus)
  const triggerEffect = useCallback((type, payload = {}) => {
    try {
      overlay.effect({ type, ...payload });
    } catch {
      // Overlay bus not available, silently ignore
    }
  }, []);

  // Accept handler for invitation step
  const handleAccept = useCallback(() => {
    handleUpdate({ accepted: true });
    handleNext();
  }, [handleUpdate, handleNext]);

  // Current step id
  const currentStep = steps[currentStepIndex] || {};
  const stepId = currentStep.id;

  // Step component map
  const stepComponent = useMemo(() => {
    switch (stepId) {
      case "invitation":
        return (
          <DateInvitationStep
            key="invitation"
            config={config}
            onAccept={handleAccept}
            triggerEffect={triggerEffect}
          />
        );
      case "time":
        return (
          <TimeSelectionStep
            key="time"
            config={config}
            answers={answers}
            onUpdate={handleUpdate}
            onNext={handleNext}
          />
        );
      case "activity":
        return (
          <ActivitySelectionStep
            key="activity"
            config={config}
            answers={answers}
            onUpdate={handleUpdate}
            onNext={handleNext}
          />
        );
      case "details":
        return (
          <DetailsStep
            key="details"
            config={config}
            answers={answers}
            onUpdate={handleUpdate}
            onNext={handleNext}
          />
        );
      case "summary":
        return (
          <SummaryStep
            key="summary"
            config={config}
            answers={answers}
            triggerEffect={triggerEffect}
          />
        );
      default:
        return (
          <div key="unknown" style={{ textAlign: "center", padding: 40 }}>
            <p>Unknown step: <strong>{stepId}</strong></p>
            <button className="dp-btn dp-btn--primary" onClick={handleNext}>
              Skip →
            </button>
          </div>
        );
    }
  }, [stepId, config, answers, handleAccept, handleUpdate, handleNext, triggerEffect]);

  const theme = config.theme || {};

  return (
    <div className={`dp-root theme-${colorScheme}`} onClick={handleBackgroundClick}>
      {/* Header */}
      <header className="dp-header">
        <div className="dp-header-left">
          <div className="dp-window-dots">
            <span className="dp-window-dot dp-window-dot--red" />
            <span className="dp-window-dot dp-window-dot--yellow" />
            <span className="dp-window-dot dp-window-dot--green" />
          </div>
          <span className="dp-logo">{theme.title || "date♡"}</span>
        </div>
        <div className="dp-header-right">
          <div className="dp-theme-picker">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.id}
                className={`dp-theme-chip ${colorScheme === scheme.id ? "dp-theme-chip--active" : ""}`}
                style={{ "--theme-color": scheme.primary }}
                title={`${scheme.label} Theme`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleThemeChange(scheme.id);
                }}
                type="button"
              />
            ))}
          </div>
          <span>✨</span>
          <span>💗</span>
        </div>
      </header>

      {/* Progress bar — hide on invitation step for cleaner look */}
      {stepId !== "invitation" && (
        <div style={{ padding: "20px 20px 0" }}>
          <DatePlannerProgress steps={steps} currentStep={currentStepIndex} />
        </div>
      )}

      {/* Step content */}
      <main className="dp-main">
        <AnimatePresence mode="wait">
          {stepComponent}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="dp-footer">
        {config.footer?.icon || "💗"} Made with love for memorable moments. {config.footer?.sparkle || "✨"}
      </footer>

      {/* Floating decorations */}
      <div className="dp-floating-heart" style={{ top: "15%", left: "5%", fontSize: "1.5rem", animationDelay: "0s" }}>♡</div>
      <div className="dp-floating-heart" style={{ top: "25%", right: "8%", fontSize: "1rem", animationDelay: "1s" }}>♡</div>
      <div className="dp-floating-heart" style={{ top: "60%", left: "3%", fontSize: "0.8rem", animationDelay: "2s" }}>♡</div>
      <div className="dp-floating-heart" style={{ top: "45%", right: "4%", fontSize: "1.2rem", animationDelay: "0.5s" }}>💗</div>
      <div className="dp-floating-heart" style={{ bottom: "20%", left: "10%", fontSize: "1rem", animationDelay: "1.5s" }}>✨</div>
    </div>
  );
}
