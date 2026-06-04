import React, { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import DatePlannerCard from "./DatePlannerCard";
import OptionCarousel from "./OptionCarousel";

/**
 * DetailsStep — Dynamic details based on selected activities.
 *
 * Renders cuisine/movie/matcha/picnic/pickleball detail sections dynamically,
 * plus meeting location (options + custom) + other details inputs,
 * plus a live mini summary card.
 * Now includes a back button and carousel for 5+ options.
 *
 * @param {{ config: object, answers: object, onUpdate: (updates: object) => void, onNext: () => void, onBack: () => void }} props
 */
export default function DetailsStep({ config, answers, onUpdate, onNext, onBack }) {
  const { activities = [], detailOptions = {}, detailsStep = {}, timeStep = {} } = config;

  const meetLocationOptions = detailsStep.meetLocationOptions || [];
  const allowCustomMeet = detailsStep.meetLocationAllowCustom !== false;
  const [showCustomMeet, setShowCustomMeet] = useState(
    answers.meetLocation && !meetLocationOptions.find((o) => o.id === answers.meetLocation)
  );

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

  const handleMeetLocationSelect = useCallback(
    (optionId) => {
      setShowCustomMeet(false);
      onUpdate({ meetLocation: optionId });
    },
    [onUpdate]
  );

  const handleCustomMeetToggle = useCallback(() => {
    setShowCustomMeet(true);
    onUpdate({ meetLocation: "" });
  }, [onUpdate]);

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

  // Resolve meet location label for mini summary
  const meetLocationLabel = useMemo(() => {
    if (!answers.meetLocation) return "—";
    const opt = meetLocationOptions.find((o) => o.id === answers.meetLocation);
    return opt ? opt.label : answers.meetLocation;
  }, [answers.meetLocation, meetLocationOptions]);

  const selectedMeetId = showCustomMeet ? "__custom__" : (answers.meetLocation || "");

  // Inputs section (shared between mobile + sidebar)
  const InputsSection = ({ idPrefix = "" }) => (
    <div className="space-y-5">
      {/* Meet location */}
      <div>
        <label className="mb-2 block text-sm font-bold text-[#3d2c4e]">
          {detailsStep.meetLocationIcon || "📍"}{" "}
          {detailsStep.meetLocationLabel || "Where do you want to meet?"}
        </label>

        {meetLocationOptions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {meetLocationOptions.map((opt) => (
              <div
                key={opt.id}
                onClick={() => handleMeetLocationSelect(opt.id)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-none border-[2px] px-3 py-1.5 cursor-pointer",
                  "text-xs font-bold transition-all duration-200 active:scale-95",
                  selectedMeetId === opt.id && !showCustomMeet
                    ? "border-[#ff5c8a] bg-[#ff5c8a] text-white shadow-[0_2px_10px_rgba(255,92,138,0.25)]"
                    : "border-[#f0e0f0] bg-white text-[#3d2c4e] hover:border-[#ffb6d0] hover:bg-[#fff0f5]",
                ].join(" ")}
              >
                {opt.icon && <span>{opt.icon}</span>}
                {opt.label}
              </div>
            ))}

            {allowCustomMeet && (
              <div
                onClick={handleCustomMeetToggle}
                className={[
                  "inline-flex items-center gap-1.5 rounded-none border-[2px] border-dashed px-3 py-1.5 cursor-pointer",
                  "text-xs font-bold transition-all duration-200 active:scale-95",
                  showCustomMeet
                    ? "border-[#8b6fe8] bg-[#8b6fe8] text-white"
                    : "border-[#c4b5fd] bg-white text-[#8b6fe8] hover:bg-[#f3f0ff]",
                ].join(" ")}
              >
                ✏️ {detailsStep.meetLocationCustomLabel || "Somewhere else..."}
              </div>
            )}
          </div>
        )}

        {(showCustomMeet || meetLocationOptions.length === 0) && (
          <div className="relative">
            <input
              className="w-full rounded-none border-[2px] border-[#f0e0f0] bg-white px-4 py-3 font-[Nunito,system-ui,sans-serif] text-sm font-medium text-[#3d2c4e] placeholder-[#b8a5c8] outline-none transition-all duration-200 focus:border-[#ff5c8a] focus:shadow-[0_0_0_3px_#ffb6d0]"
              type="text"
              placeholder={detailsStep.meetLocationPlaceholder || "e.g., Central Park"}
              value={showCustomMeet ? (answers.meetLocation || "") : ""}
              onChange={handleInputChange("meetLocation")}
              id={`${idPrefix}dp-meet-location`}
              autoFocus={showCustomMeet}
            />
          </div>
        )}
      </div>

      {/* Other details */}
      <div>
        <label className="mb-2 block text-sm font-bold text-[#3d2c4e]">
          {detailsStep.otherDetailsLabel || "Any other details?"}
        </label>
        <textarea
          className="w-full resize-none rounded-none border-[2px] border-[#f0e0f0] bg-white px-4 py-3 font-[Nunito,system-ui,sans-serif] text-sm font-medium text-[#3d2c4e] placeholder-[#b8a5c8] outline-none transition-all duration-200 focus:border-[#ff5c8a] focus:shadow-[0_0_0_3px_#ffb6d0]"
          rows={4}
          placeholder={detailsStep.otherDetailsPlaceholder || "Add notes..."}
          value={answers.otherDetails || ""}
          onChange={handleInputChange("otherDetails")}
          maxLength={detailsStep.otherDetailsMaxLength || 200}
          id={`${idPrefix}dp-other-details`}
        />
        <div className="mt-1 text-right text-xs text-[#b8a5c8]">
          {(answers.otherDetails || "").length}/{detailsStep.otherDetailsMaxLength || 200}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Main: dynamic detail sections ── */}
        <div className="flex flex-col gap-6">
          {detailSections.map(({ detailType, config: sectionCfg }) => {
            const sectionOptions = sectionCfg.options || [];
            return (
              <motion.div
                key={detailType}
                className="rounded-none border-[1.5px] border-[#f0e0f0] bg-white p-6 shadow-[0_2px_12px_rgba(139,111,232,0.08)]"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-4 text-base font-bold text-[#3d2c4e]">
                  {sectionCfg.question || `Choose ${detailType}`}
                </div>
                {sectionCfg.subtitle && (
                  <p className="mb-4 text-xs font-medium text-[#8e7aa0]">{sectionCfg.subtitle}</p>
                )}

                {sectionOptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <span className="mb-2 text-3xl">🗂️</span>
                    <p className="text-sm text-[#8e7aa0]">No choices to be chosen from</p>
                  </div>
                ) : sectionOptions.length >= 5 ? (
                  <OptionCarousel
                    items={sectionOptions}
                    selected={answers[detailType] || ""}
                    onToggle={(id) => handleDetailSelect(detailType, id)}
                    type="detail"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {sectionOptions.map((opt) => (
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
                    <DatePlannerCard small showMore onClick={() => { }} />
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Mobile-only inputs */}
          <div className="rounded-none border-[1.5px] border-[#f0e0f0] bg-white p-6 shadow-[0_2px_12px_rgba(139,111,232,0.08)] lg:hidden">
            <InputsSection idPrefix="mobile-" />
          </div>
        </div>

        {/* ── Sidebar: inputs + mini summary + actions ── */}
        <div className="sticky top-20 hidden flex-col gap-4 lg:flex">
          {/* Inputs */}
          <div className="rounded-none border-[1.5px] border-[#f0e0f0] bg-white p-6 shadow-[0_2px_12px_rgba(139,111,232,0.08)]">
            <InputsSection idPrefix="sidebar-" />
          </div>

          {/* Mini summary */}
          <div className="rounded-none border-[1.5px] border-[#f0e0f0] bg-white p-6 shadow-[0_2px_12px_rgba(139,111,232,0.08)]">
            <div className="mb-3 text-sm font-bold text-[#3d2c4e]">
              {detailsStep.summaryLabel || "Date Plan Summary"}
            </div>

            <div className="flex items-start gap-2 mb-2 text-sm">
              <span className="w-5 flex-shrink-0 text-center">📅</span>
              <span className="font-semibold text-[#ff5c8a]">
                {config.invitation?.dateLabel || "Saturday"}
              </span>
            </div>

            <div className="flex items-start gap-2 mb-2 text-sm">
              <span className="w-5 flex-shrink-0 text-center">🕐</span>
              <span className="font-semibold text-[#ff5c8a]">{timeLabel}</span>
            </div>

            <div className="flex items-start gap-2 mb-2 text-sm">
              <span className="w-5 flex-shrink-0 text-center">💗</span>
              <span className="font-semibold text-[#ff5c8a]">{activityLabels || "—"}</span>
            </div>

            {answers.meetLocation && (
              <div className="flex items-start gap-2 text-sm">
                <span className="w-5 flex-shrink-0 text-center">📍</span>
                <span className="font-semibold text-[#ff5c8a]">{meetLocationLabel}</span>
              </div>
            )}
          </div>

          {/* Sidebar Actions */}
          <div className="flex flex-col gap-3">
            <div
              className="w-full inline-flex items-center justify-center gap-2 rounded-none border-[2.5px] border-[#ff5c8a] bg-[#ff5c8a] px-12 py-4 text-lg font-bold text-white shadow-[0_4px_20px_rgba(255,92,138,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(255,92,138,0.18)] active:scale-95 cursor-pointer"
              onClick={onNext}
              id="dp-btn-send-plan"
            >
              <span className="text-xl">{detailsStep.sendButtonIcon || "💗"}</span>
              {detailsStep.sendButtonText || "Send Date Plan"}
            </div>
            
            <div
              className="w-full inline-flex items-center justify-center gap-2 rounded-none border-[2.5px] border-[#f0e0f0] bg-white px-6 py-2.5 text-sm font-bold text-[#3d2c4e] shadow-[0_2px_12px_rgba(139,111,232,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ffb6d0] hover:shadow-[0_4px_20px_rgba(255,92,138,0.12)] active:scale-95 cursor-pointer"
              onClick={onBack}
              id="dp-btn-details-back"
            >
              ← Back
            </div>
          </div>
        </div>
      </div>

      {/* Navigation (Mobile only) */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 lg:hidden">
        <div
          className="inline-flex items-center justify-center gap-2 rounded-none border-[2.5px] border-[#f0e0f0] bg-white px-6 py-2.5 text-sm font-bold text-[#3d2c4e] shadow-[0_2px_12px_rgba(139,111,232,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ffb6d0] hover:shadow-[0_4px_20px_rgba(255,92,138,0.12)] active:scale-95 cursor-pointer"
          onClick={onBack}
          id="dp-btn-details-back-mobile"
        >
          ← Back
        </div>
        <div
          className="inline-flex items-center justify-center gap-2 rounded-none border-[2.5px] border-[#ff5c8a] bg-[#ff5c8a] px-12 py-4 text-lg font-bold text-white shadow-[0_4px_20px_rgba(255,92,138,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(255,92,138,0.18)] active:scale-95 cursor-pointer"
          onClick={onNext}
          id="dp-btn-send-plan-mobile"
        >
          <span className="text-xl">{detailsStep.sendButtonIcon || "💗"}</span>
          {detailsStep.sendButtonText || "Send Date Plan"}
        </div>
      </div>
    </motion.div>
  );
}
