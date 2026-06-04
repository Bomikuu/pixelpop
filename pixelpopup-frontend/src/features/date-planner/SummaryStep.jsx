import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";

/**
 * SummaryStep — Final date plan summary with save/share.
 * Includes congrats effects: firework burst, floating hearts, confetti rain.
 *
 * @param {{ config: object, answers: object, triggerEffect: (type: string, payload?: object) => void }} props
 */

// Floating confetti piece
const ConfettiPiece = ({ style, emoji }) => (
  <motion.div
    className="pointer-events-none fixed z-50 select-none text-lg"
    style={style}
    initial={{ y: -40, opacity: 1, rotate: 0, x: style.x }}
    animate={{
      y: typeof window !== "undefined" ? window.innerHeight + 80 : 900,
      opacity: [1, 1, 0.8, 0],
      rotate: style.rotate,
      x: [style.x, style.x + (Math.random() - 0.5) * 120],
    }}
    transition={{ duration: style.duration, ease: "easeIn", delay: style.delay }}
  >
    {emoji}
  </motion.div>
);

const CONFETTI_EMOJIS = ["💗", "✨", "🌸", "💕", "⭐", "🎉", "💖", "🎊", "🌟"];

export default function SummaryStep({ config, answers, triggerEffect, onBack }) {
  const { finalStep = {}, invitation = {}, users = [], activities = [], detailOptions = {}, timeStep = {}, detailsStep = {} } = config;
  const summaryRef = useRef(null);
  const [savedImage, setSavedImage] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [showCongrats, setShowCongrats] = useState(false);

  const user1 = users[0] || {};
  const user2 = users[1] || {};

  const meetLocationOptions = detailsStep.meetLocationOptions || [];

  // Fire congrats effect on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCongrats(true);
      // Spawn confetti
      const pieces = Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
        rotate: (Math.random() - 0.5) * 720,
        duration: 2.5 + Math.random() * 2,
        delay: Math.random() * 0.8,
        emoji: CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)],
      }));
      setConfettiPieces(pieces);

      // Trigger global confetti effect
      try {
        triggerEffect?.("confetti", { particleCount: 60, spread: 80 });
      } catch { /* ignore */ }

      // Clear confetti after animation
      setTimeout(() => setConfettiPieces([]), 5000);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Resolve time display
  const timeLabel = useMemo(() => {
    if (answers.time === "__custom__") {
      if (!answers.customTime) return "Custom";
      const [h, m] = answers.customTime.split(":");
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m} ${ampm}`;
    }
    const opt = (timeStep.options || []).find((o) => o.id === answers.time);
    return opt ? opt.label : answers.time || "—";
  }, [answers.time, answers.customTime, timeStep.options]);

  // Resolve activity labels
  const activityLabels = useMemo(() => {
    return (answers.activities || [])
      .map((id) => {
        const a = activities.find((x) => x.id === id);
        return a ? a.label.replace(/\n/g, " ") : id;
      })
      .join(", ");
  }, [answers.activities, activities]);

  // Resolve detail labels
  const resolveDetailLabel = useCallback(
    (detailType) => {
      const val = answers[detailType];
      if (!val) return null;
      const opts = detailOptions[detailType]?.options || [];
      const found = opts.find((o) => o.id === val);
      return found ? found.label : val;
    },
    [answers, detailOptions]
  );

  // Resolve meet location label
  const meetLocationLabel = useMemo(() => {
    if (!answers.meetLocation) return null;
    const opt = meetLocationOptions.find((o) => o.id === answers.meetLocation);
    return opt ? opt.label : answers.meetLocation;
  }, [answers.meetLocation, meetLocationOptions]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Build summary rows
  const rows = useMemo(() => {
    const r = finalStep.rows || {};
    const result = [];

    result.push({
      icon: r.date?.icon || "📅",
      label: r.date?.label || "Date",
      value: invitation.dateLabel || "Saturday",
    });

    result.push({
      icon: r.time?.icon || "🕐",
      label: r.time?.label || "Time",
      value: timeLabel,
    });

    result.push({
      icon: r.activities?.icon || "💗",
      label: r.activities?.label || "Activities",
      value: activityLabels || "—",
    });

    // Dynamic detail rows
    const selectedActs = answers.activities || [];
    selectedActs.forEach((actId) => {
      const act = activities.find((a) => a.id === actId);
      if (act && act.requiresDetails && act.detailType) {
        const label = resolveDetailLabel(act.detailType);
        if (label) {
          const rowCfg = r[act.detailType] || {};
          result.push({
            icon: rowCfg.icon || "✨",
            label: rowCfg.label || act.detailType,
            value: label,
          });
        }
      }
    });

    if (meetLocationLabel) {
      result.push({
        icon: r.meetLocation?.icon || "📍",
        label: r.meetLocation?.label || "Meet Location",
        value: meetLocationLabel,
      });
    }

    if (answers.otherDetails) {
      result.push({
        icon: r.otherDetails?.icon || "📝",
        label: r.otherDetails?.label || "Other Details",
        value: answers.otherDetails,
      });
    }

    return result;
  }, [finalStep, invitation, timeLabel, activityLabels, answers, activities, resolveDetailLabel, meetLocationLabel]);

  // Save as image
  const handleSaveImage = useCallback(async () => {
    if (!summaryRef.current) return;
    setSaving(true);

    try {
      const dataUrl = await toPng(summaryRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        style: {
          transform: "none",
          margin: "0",
          width: "680px",
        },
        width: 680,
      });

      const link = document.createElement("a");
      link.download = "date-plan-summary.png";
      link.href = dataUrl;
      link.click();

      setSavedImage(dataUrl);
      triggerEffect?.("confetti", { particleCount: 80, spread: 60 });
      showToast("💗 Image saved successfully!");
    } catch (err) {
      console.error("Failed to save image:", err);
      showToast("❌ Failed to save image. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [triggerEffect, showToast]);

  // Share / send
  const handleShare = useCallback(async () => {
    try {
      let imageBlob = null;

      if (summaryRef.current) {
        const dataUrl = savedImage || (await toPng(summaryRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          style: {
            transform: "none",
            margin: "0",
            width: "680px",
          },
          width: 680,
        }));

        if (!savedImage) setSavedImage(dataUrl);

        const response = await fetch(dataUrl);
        imageBlob = await response.blob();
      }

      const textSummary = rows.map((r) => `${r.label}: ${r.value}`).join("\n");

      if (navigator.share) {
        const shareData = {
          title: finalStep.title || "Date Plan Summary",
          text: `✨ ${finalStep.title || "Date Plan Summary"} ✨\n\n${textSummary}`,
        };

        if (imageBlob && navigator.canShare) {
          const file = new File([imageBlob], "date-plan-summary.png", { type: "image/png" });
          const shareWithFile = { ...shareData, files: [file] };

          if (navigator.canShare(shareWithFile)) {
            await navigator.share(shareWithFile);
            showToast("💗 Shared successfully!");
            return;
          }
        }

        await navigator.share(shareData);
        showToast("💗 Shared successfully!");
        return;
      }

      const textToCopy = `✨ ${finalStep.title || "Date Plan Summary"} ✨\n\n${textSummary}`;
      await navigator.clipboard.writeText(textToCopy);
      showToast("📋 Summary copied to clipboard!");

      if (savedImage) {
        const link = document.createElement("a");
        link.download = "date-plan-summary.png";
        link.href = savedImage;
        link.click();
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Share failed:", err);
      showToast("❌ Sharing failed. Text has been copied instead.");

      try {
        const textSummary = rows.map((r) => `${r.label}: ${r.value}`).join("\n");
        await navigator.clipboard.writeText(textSummary);
      } catch { /* ignore */ }
    }
  }, [savedImage, rows, finalStep, showToast]);

  return (
    <motion.div
      className="relative w-full text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      {/* ── Confetti rain ── */}
      <AnimatePresence>
        {confettiPieces.map((p) => (
          <ConfettiPiece
            key={p.id}
            emoji={p.emoji}
            style={{
              x: p.x,
              left: p.x,
              top: 0,
              rotate: p.rotate,
              duration: p.duration,
              delay: p.delay,
            }}
          />
        ))}
      </AnimatePresence>

      {/* ── Congrats banner ── */}
      <AnimatePresence>
        {showCongrats && (
          <motion.div
            className="mb-5 flex flex-wrap items-center justify-center gap-2"
            initial={{ opacity: 0, scale: 0.7, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <span className="text-2xl">🎉</span>
            <span className="text-lg font-extrabold text-[#ff5c8a]">
              Yay! Date plan complete!
            </span>
            <span className="text-2xl">🎊</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Summary card container (handles centering and responsive max-width) ── */}
      <div className="mx-auto w-full max-w-[680px] px-2 py-4">
        {/* ── Summary card (ref for image export, no margins/transforms to avoid html-to-image bugs) ── */}
        <div
          className="relative w-full overflow-hidden bg-white shadow-[0_8px_32px_rgba(255,92,138,0.18)]"
          ref={summaryRef}
        >
          {/* Gradient top bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#ff5c8a] via-[#8b6fe8] to-[#ff5c8a]" />

          <div className="px-8 py-10">
            {/* Avatar pair */}
            <div className="mb-5 flex items-center justify-center gap-4">
              <div className="relative">
                <img
                  className="h-[100px] w-[100px] rounded-none border-[3px] border-[#ffb6d0] object-cover shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                  src={user1.avatar}
                  alt={user1.name}
                  draggable={false}
                />
                <span className="absolute -right-1 -top-2 animate-[dp-float_2s_ease-in-out_infinite] text-lg">💗</span>
              </div>

              {/* Heart connector */}
              <motion.div
                className="flex flex-col items-center gap-1"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-3xl">💗</span>
              </motion.div>

              <div className="relative">
                <img
                  className="h-[100px] w-[100px] rounded-none border-[3px] border-[#ffb6d0] object-cover shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                  src={user2.avatar}
                  alt={user2.name}
                  draggable={false}
                />
                <span className="absolute -bottom-1 -left-1 animate-[dp-float_2s_ease-in-out_infinite] text-lg" style={{ animationDelay: "0.5s" }}>💗</span>
              </div>
            </div>

            <h2 className="mb-1 text-2xl font-black text-[#3d2c4e]">
              💗 {finalStep.title || "Date Plan Summary"} 💗
            </h2>
            <p className="mb-7 text-sm font-medium text-[#8e7aa0]">
              {finalStep.subtitle || "Here's your final date plan ✨"}
            </p>

            {/* Summary rows */}
            <div className="mx-auto w-full max-w-[500px] text-left">
              {rows.map((row, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-start gap-3 border-b border-[#f0e0f0] px-4 py-3.5 last:border-b-0"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.3 }}
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-[#fff0f5] text-base">
                    {row.icon}
                  </div>
                  <div className="flex min-w-[110px] items-center text-sm font-bold text-[#3d2c4e]">
                    {row.label}
                  </div>
                  <div className="mx-1 font-semibold text-[#b8a5c8]">:</div>
                  <div className="flex-1 text-sm font-semibold text-[#ff5c8a]">{row.value}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <div
          className="inline-flex items-center justify-center gap-2 rounded-none border-[2.5px] border-[#f0e0f0] bg-white px-6 py-2.5 text-sm font-bold text-[#3d2c4e] shadow-[0_2px_12px_rgba(139,111,232,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ffb6d0] hover:shadow-[0_4px_20px_rgba(255,92,138,0.12)] active:scale-95"
          onClick={onBack}
          type="button"
          id="dp-btn-summary-back"
        >
          ← Back
        </div>

        <motion.div
          className="inline-flex items-center justify-center gap-2 rounded-none border-[2.5px] border-[#ff5c8a] bg-[#ff5c8a] px-10 py-3.5 text-base font-bold text-white shadow-[0_4px_20px_rgba(255,92,138,0.12)] transition-all duration-200 hover:shadow-[0_8px_32px_rgba(255,92,138,0.18)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleSaveImage}
          disabled={saving}
          type="button"
          id="dp-btn-save-image"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="text-lg">{finalStep.saveImageIcon || "🖼️"}</span>
          {saving ? "Saving..." : finalStep.saveImageText || "Save as Image"}
          <span className="text-sm">✨</span>
        </motion.div>

        <motion.div
          className="inline-flex items-center justify-center gap-2 rounded-none border-[2.5px] border-[#ff5c8a] bg-white px-10 py-3.5 text-base font-bold text-[#ff5c8a] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fff0f5] hover:shadow-[0_4px_20px_rgba(255,92,138,0.12)] active:scale-95"
          onClick={handleShare}
          type="button"
          id="dp-btn-share"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="text-lg">{finalStep.shareIcon || "✈️"}</span>
          {finalStep.shareText || "Send to Me"}
        </motion.div>
      </div>

      <p className="mt-4 text-sm font-medium text-[#8e7aa0]">
        💗 {finalStep.helperText || "Save the summary first, then send it. ✨"}
      </p>

      {/* ── Floating hearts animation (congrats) ── */}
      <AnimatePresence>
        {showCongrats && [0, 1, 2, 3].map((i) => (
          <motion.div
            key={`heart-${i}`}
            className="pointer-events-none fixed z-40 text-2xl"
            style={{
              left: `${15 + i * 22}%`,
              bottom: "10%",
            }}
            initial={{ y: 0, opacity: 0.9 }}
            animate={{
              y: [-0, -200 - i * 40],
              opacity: [0.9, 0.6, 0],
              x: [(i % 2 === 0 ? 1 : -1) * 20 * Math.sin(i)],
            }}
            transition={{
              duration: 2 + i * 0.4,
              delay: i * 0.3,
              ease: "easeOut",
            }}
          >
            {["💗", "💕", "✨", "💖"][i]}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="dp-toast fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 rounded-none bg-[#3d2c4e] px-6 py-3 text-sm font-bold text-white shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
