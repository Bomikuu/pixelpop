import React, { useState, useCallback, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { overlay } from "../../ui/overlay/overlayBus";

import DatePlannerProgress from "./DatePlannerProgress";
import DateInvitationStep from "./DateInvitationStep";
import TimeSelectionStep from "./TimeSelectionStep";
import ActivitySelectionStep from "./ActivitySelectionStep";
import DetailsStep from "./DetailsStep";
import SummaryStep from "./SummaryStep";
import ProfileRetroModal from "./ProfileRetroModal";

/**
 * Keep this temporarily while other Date Planner child files
 * still use dp-* classes and CSS variables.
 *
 * Once all Date Planner files are migrated to Tailwind,
 * this import can be removed.
 */
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

const themeStyles = {
  pink: {
    rootBg: "bg-gradient-to-b from-[#fff0f5] via-white to-[#f3f0ff]",
    headerBg: "bg-gradient-to-br from-[#fff0f5] to-white",
    logoText: "text-[#ff5c8a]",
    activeChipRing: "ring-[#ff5c8a]",
    popupBorder: "border-[#ffb6d0]",
    popupEmojiBg: "bg-[#fff0f5]",
    primaryButton:
      "bg-[#ff5c8a] border-[#ff5c8a] text-white shadow-[0_4px_20px_rgba(255,92,138,0.12)] hover:shadow-[0_8px_32px_rgba(255,92,138,0.18)]",
  },
  lavender: {
    rootBg: "bg-gradient-to-b from-[#f3f0ff] via-white to-[#fff0f5]",
    headerBg: "bg-gradient-to-br from-[#f3f0ff] to-white",
    logoText: "text-[#8b6fe8]",
    activeChipRing: "ring-[#8b6fe8]",
    popupBorder: "border-[#c4b5fd]",
    popupEmojiBg: "bg-[#f3f0ff]",
    primaryButton:
      "bg-[#8b6fe8] border-[#8b6fe8] text-white shadow-[0_4px_20px_rgba(139,111,232,0.12)] hover:shadow-[0_8px_32px_rgba(139,111,232,0.18)]",
  },
  mint: {
    rootBg: "bg-gradient-to-b from-[#f0fdfa] via-white to-[#f0f9ff]",
    headerBg: "bg-gradient-to-br from-[#f0fdfa] to-white",
    logoText: "text-[#0d9488]",
    activeChipRing: "ring-[#0d9488]",
    popupBorder: "border-[#99f6e4]",
    popupEmojiBg: "bg-[#f0fdfa]",
    primaryButton:
      "bg-[#0d9488] border-[#0d9488] text-white shadow-[0_4px_20px_rgba(13,148,136,0.12)] hover:shadow-[0_8px_32px_rgba(13,148,136,0.18)]",
  },
  sunset: {
    rootBg: "bg-gradient-to-b from-[#fff7ed] via-white to-[#fdf2f8]",
    headerBg: "bg-gradient-to-br from-[#fff7ed] to-white",
    logoText: "text-[#f97316]",
    activeChipRing: "ring-[#f97316]",
    popupBorder: "border-[#ffedd5]",
    popupEmojiBg: "bg-[#fff7ed]",
    primaryButton:
      "bg-[#f97316] border-[#f97316] text-white shadow-[0_4px_20px_rgba(249,115,22,0.12)] hover:shadow-[0_8px_32px_rgba(249,115,22,0.18)]",
  },
  ocean: {
    rootBg: "bg-gradient-to-b from-[#f0f9ff] via-white to-[#f0fdfa]",
    headerBg: "bg-gradient-to-br from-[#f0f9ff] to-white",
    logoText: "text-[#0284c7]",
    activeChipRing: "ring-[#0284c7]",
    popupBorder: "border-[#bae6fd]",
    popupEmojiBg: "bg-[#f0f9ff]",
    primaryButton:
      "bg-[#0284c7] border-[#0284c7] text-white shadow-[0_4px_20px_rgba(2,132,199,0.12)] hover:shadow-[0_8px_32px_rgba(2,132,199,0.18)]",
  },
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function DatePlanner({ config }) {
  const steps = config.steps || [];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [colorScheme, setColorScheme] = useState(config.theme?.colorScheme || "pink");
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [profileModal, setProfileModal] = useState(null);

  const [answers, setAnswers] = useState({
    accepted: false,
    time: "",
    customTime: "",
    note: "",
    activities: [],
    cuisine: "",
    restaurant: "",
    movie: "",
    matchaPlace: "",
    picnicPlace: "",
    pickleballCourt: "",
    meetLocation: "",
    otherDetails: "",
  });

  const isFinished = steps[currentStepIndex]?.id === "summary";
  const isStarted = currentStepIndex > 0;

  const activeTheme = themeStyles[colorScheme] || themeStyles.pink;

  useEffect(() => {
    const originalTitle = document.title;
    const user1Name = config.users?.[0]?.name || "Someone";
    document.title = `${user1Name} wants to invite you on a date`;
    return () => {
      document.title = originalTitle;
    };
  }, [config.users]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isStarted && !isFinished) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isStarted, isFinished]);

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
      // Ignore if overlay is unavailable.
    }
  }, []);

  const handleBackgroundClick = useCallback(
    (e) => {
      const isInteractive = e.target.closest(
        "button, a, input, textarea, .dp-card, select, [role='button']"
      );

      if (isInteractive) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const emojis = themeEmojis[colorScheme] || ["💖", "✨", "🌸", "💕"];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];

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
        // Ignore if overlay is unavailable.
      }

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
        // Ignore if sticker effect is unavailable.
      }
    },
    [colorScheme]
  );

  const handleUpdate = useCallback((updates) => {
    setAnswers((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const handleBack = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const triggerEffect = useCallback((type, payload = {}) => {
    try {
      overlay.effect({ type, ...payload });
    } catch {
      // Overlay bus not available, silently ignore.
    }
  }, []);

  const handleAccept = useCallback(() => {
    handleUpdate({ accepted: true });
    handleNext();
  }, [handleUpdate, handleNext]);

  const handleOpenProfile = useCallback((user) => {
    setProfileModal(user);
  }, []);

  const currentStep = steps[currentStepIndex] || {};
  const stepId = currentStep.id;
  const theme = config.theme || {};

  const stepComponent = useMemo(() => {
    switch (stepId) {
      case "invitation":
        return (
          <DateInvitationStep
            key="invitation"
            config={config}
            onAccept={handleAccept}
            triggerEffect={triggerEffect}
            onOpenProfile={handleOpenProfile}
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
            onBack={handleBack}
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
            onBack={handleBack}
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
            onBack={handleBack}
          />
        );

      case "summary":
        return (
          <SummaryStep
            key="summary"
            config={config}
            answers={answers}
            triggerEffect={triggerEffect}
            onBack={handleBack}
          />
        );

      default:
        return (
          <div key="unknown" className="px-6 py-10 text-center">
            <p className="font-['Nunito','Segoe_UI',system-ui,sans-serif] text-sm font-semibold text-[#3d2c4e]">
              Unknown step: <strong>{stepId}</strong>
            </p>

            <button
              className={cx(
                "mt-5 inline-flex items-center justify-center gap-2 border-[2.5px] px-10 py-3.5",
                "font-['Nunito','Segoe_UI',system-ui,sans-serif] text-base font-bold leading-tight",
                "transition-all duration-200 active:scale-95 hover:-translate-y-0.5",
                activeTheme.primaryButton
              )}
              onClick={handleNext}
              type="button"
            >
              Skip →
            </button>
          </div>
        );
    }
  }, [
    stepId,
    config,
    answers,
    handleAccept,
    handleUpdate,
    handleNext,
    handleBack,
    triggerEffect,
    handleOpenProfile,
    activeTheme.primaryButton,
  ]);

  return (
    <div
      className={cx(
        `dp-root theme-${colorScheme}`,
        "relative min-h-screen w-full overflow-x-hidden",
        "font-['Nunito','Segoe_UI',system-ui,sans-serif]",
        "text-[#3d2c4e]",
        activeTheme.rootBg
      )}
      onClick={handleBackgroundClick}
    >
      <header
        className={cx(
          "sticky top-0 z-[100] flex items-center justify-between",
          "border-b-[1.5px] border-[#f0e0f0] px-6 py-3",
          "backdrop-blur-[10px]",
          activeTheme.headerBg
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span
              className={cx(
                "h-3 w-3 rounded-full bg-[#ff5f57]",
                isStarted && !isFinished ? "cursor-pointer" : "cursor-default"
              )}
              title="Close"
              onClick={(e) => {
                e.stopPropagation();

                if (isStarted && !isFinished) {
                  setShowLeaveDialog(true);
                }
              }}
            />

            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />

            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>

          <span
            className={cx(
              "text-xl font-extrabold tracking-[-0.02em]",
              activeTheme.logoText
            )}
          >
            {theme.title || "date♡"}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xl">
          <div className="mr-3 flex items-center gap-2">
            {colorSchemes.map((scheme) => (
              <div
                key={scheme.id}
                className={cx(
                  "h-4 w-4 border-[1.5px] border-[#f0e0f0] p-0",
                  "cursor-pointer transition-all duration-200",
                  "hover:scale-125 hover:border-[#3d2c4e]",
                  colorScheme === scheme.id &&
                  cx(
                    "scale-110 border-[#3d2c4e] ring-[3.5px] ring-offset-2 ring-offset-white",
                    activeTheme.activeChipRing
                  )
                )}
                style={{ backgroundColor: scheme.primary }}
                title={`${scheme.label} Theme`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleThemeChange(scheme.id);
                }}
                type="button"
              >
              </div>
            ))}
          </div>

          <span>✨</span>
          <span>💗</span>
        </div>
      </header>

      {stepId !== "invitation" && (
        <div className="px-5 pt-5">
          <DatePlannerProgress steps={steps} currentStep={currentStepIndex} />
        </div>
      )}

      <main
        className={cx(
          "relative z-[1] mx-auto px-5 pb-[60px] pt-8 flex justify-center items-center",
          stepId === "activity"
            ? "w-full max-w-none px-10"
            : "max-w-[1280px]",
          "max-md:px-4 max-md:pb-10 max-md:pt-5"
        )}
      >
        <AnimatePresence mode="wait">{stepComponent}</AnimatePresence>
      </main>

      <footer className="px-5 py-5 text-center text-[0.8rem] font-medium text-[#8e7aa0]">
        {config.footer?.icon || "💗"} Made with love by miku :>{" "}
        {config.footer?.sparkle || "✨"}
      </footer>

      <div
        className="pointer-events-none fixed z-0 animate-[dp-float_4s_ease-in-out_infinite] text-[1.5rem] text-[var(--dp-primary)] opacity-[0.15]"
        style={{ top: "15%", left: "5%", animationDelay: "0s" }}
      >
        ♡
      </div>

      <div
        className="pointer-events-none fixed z-0 animate-[dp-float_4s_ease-in-out_infinite] text-base text-[var(--dp-primary)] opacity-[0.15]"
        style={{ top: "25%", right: "8%", animationDelay: "1s" }}
      >
        ♡
      </div>

      <div
        className="pointer-events-none fixed z-0 animate-[dp-float_4s_ease-in-out_infinite] text-[0.8rem] text-[var(--dp-primary)] opacity-[0.15]"
        style={{ top: "60%", left: "3%", animationDelay: "2s" }}
      >
        ♡
      </div>

      <div
        className="pointer-events-none fixed z-0 animate-[dp-float_4s_ease-in-out_infinite] text-[1.2rem] text-[var(--dp-primary)] opacity-[0.15]"
        style={{ top: "45%", right: "4%", animationDelay: "0.5s" }}
      >
        💗
      </div>

      <div
        className="pointer-events-none fixed z-0 animate-[dp-float_4s_ease-in-out_infinite] text-base text-[var(--dp-primary)] opacity-[0.15]"
        style={{ bottom: "20%", left: "10%", animationDelay: "1.5s" }}
      >
        ✨
      </div>

      <AnimatePresence>
        {showLeaveDialog && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/35 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={cx(
                "w-[90%] max-w-[380px] bg-white px-8 py-8 text-center",
                "border-[3px] shadow-[0_8px_32px_rgba(255,92,138,0.18)]",
                activeTheme.popupBorder
              )}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={cx(
                  "mx-auto mb-3 flex h-16 w-16 items-center justify-center text-5xl",
                  activeTheme.popupEmojiBg
                )}
              >
                🥺
              </div>

              <div className="mb-2 text-lg font-extrabold text-[#3d2c4e]">
                Leave the date planner?
              </div>

              <div className="mb-5 text-sm font-medium leading-relaxed text-[#8e7aa0]">
                You haven't finished the date plan yet. Your progress will be lost if you
                leave now.
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  className={cx(
                    "inline-flex items-center justify-center gap-1.5 border-[2.5px] px-6 py-2.5",
                    "text-sm font-bold leading-tight transition-all duration-200",
                    "border-[#f0e0f0] bg-white text-[#3d2c4e]",
                    "shadow-[0_2px_12px_rgba(139,111,232,0.10)]",
                    "hover:-translate-y-0.5 hover:border-[#ffb6d0] hover:shadow-[0_4px_20px_rgba(255,92,138,0.12)]",
                    "active:scale-95"
                  )}
                  onClick={() => setShowLeaveDialog(false)}
                  type="button"
                >
                  Keep planning 💗
                </button>

                <button
                  className={cx(
                    "inline-flex items-center justify-center gap-1.5 border-[2.5px] px-6 py-2.5",
                    "text-sm font-bold leading-tight transition-all duration-200",
                    "border-transparent bg-transparent text-[#8e7aa0]",
                    "hover:bg-[#fff0f5] hover:text-[#ff5c8a]",
                    "active:scale-95"
                  )}
                  onClick={() => {
                    setShowLeaveDialog(false);
                    window.location.reload();
                  }}
                  type="button"
                >
                  Leave anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profileModal && (
          <ProfileRetroModal
            user={profileModal}
            config={config}
            onClose={() => setProfileModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}