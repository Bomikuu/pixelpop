import React, { useRef, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";

/**
 * SummaryStep — Final date plan summary with save/share.
 *
 * @param {{ config: object, answers: object, triggerEffect: (type: string, payload?: object) => void }} props
 */
export default function SummaryStep({ config, answers, triggerEffect }) {
  const { finalStep = {}, invitation = {}, users = [], activities = [], detailOptions = {}, timeStep = {} } = config;
  const summaryRef = useRef(null);
  const [savedImage, setSavedImage] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const user1 = users[0] || {};
  const user2 = users[1] || {};

  // Resolve time display
  const timeLabel = useMemo(() => {
    if (answers.time === "__custom__") {
      if (!answers.customTime) return "Custom";
      // Format custom time nicely
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

    if (answers.meetLocation) {
      result.push({
        icon: r.meetLocation?.icon || "📍",
        label: r.meetLocation?.label || "Meet Location",
        value: answers.meetLocation,
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
  }, [finalStep, invitation, timeLabel, activityLabels, answers, activities, resolveDetailLabel]);

  // Save as image
  const handleSaveImage = useCallback(async () => {
    if (!summaryRef.current) return;
    setSaving(true);

    try {
      const dataUrl = await toPng(summaryRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      // Create download link
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

      // Generate image if not already saved
      if (summaryRef.current) {
        const dataUrl = savedImage || (await toPng(summaryRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        }));

        if (!savedImage) setSavedImage(dataUrl);

        // Convert data URL to blob
        const response = await fetch(dataUrl);
        imageBlob = await response.blob();
      }

      // Build text summary
      const textSummary = rows
        .map((r) => `${r.label}: ${r.value}`)
        .join("\n");

      // Try Web Share API with file
      if (navigator.share) {
        const shareData = {
          title: finalStep.title || "Date Plan Summary",
          text: `✨ ${finalStep.title || "Date Plan Summary"} ✨\n\n${textSummary}`,
        };

        // Try sharing with file if supported
        if (imageBlob && navigator.canShare) {
          const file = new File([imageBlob], "date-plan-summary.png", { type: "image/png" });
          const shareWithFile = { ...shareData, files: [file] };

          if (navigator.canShare(shareWithFile)) {
            await navigator.share(shareWithFile);
            showToast("💗 Shared successfully!");
            return;
          }
        }

        // Fallback: share without file
        await navigator.share(shareData);
        showToast("💗 Shared successfully!");
        return;
      }

      // Fallback: copy text to clipboard
      const textToCopy = `✨ ${finalStep.title || "Date Plan Summary"} ✨\n\n${textSummary}`;
      await navigator.clipboard.writeText(textToCopy);
      showToast("📋 Summary copied to clipboard!");

      // Also trigger image download if we have it
      if (savedImage) {
        const link = document.createElement("a");
        link.download = "date-plan-summary.png";
        link.href = savedImage;
        link.click();
      }
    } catch (err) {
      if (err.name === "AbortError") return; // User cancelled share
      console.error("Share failed:", err);
      showToast("❌ Sharing failed. Text has been copied instead.");

      // Final fallback: just copy text
      try {
        const textSummary = rows.map((r) => `${r.label}: ${r.value}`).join("\n");
        await navigator.clipboard.writeText(textSummary);
      } catch {
        // ignore
      }
    }
  }, [savedImage, rows, finalStep, showToast]);

  return (
    <motion.div
      className="dp-summary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      {/* Summary card (ref for image export) */}
      <div className="dp-summary-card" ref={summaryRef}>
        {/* Avatar pair */}
        <div className="dp-avatars" style={{ marginBottom: 20 }}>
          <div className="dp-avatar-wrapper">
            <img className="dp-avatar" src={user1.avatar} alt={user1.name} draggable={false} />
            <span className="dp-avatar-heart dp-avatar-heart--top">💗</span>
          </div>
          <div className="dp-avatar-wrapper">
            <img className="dp-avatar" src={user2.avatar} alt={user2.name} draggable={false} />
            <span className="dp-avatar-heart dp-avatar-heart--bottom">💗</span>
          </div>
        </div>

        <h2 className="dp-summary-title">
          💗 {finalStep.title || "Date Plan Summary"} 💗
        </h2>
        <p className="dp-summary-subtitle">{finalStep.subtitle || "Here's your final date plan ✨"}</p>

        {/* Summary rows */}
        <div className="dp-summary-table">
          {rows.map((row, idx) => (
            <motion.div
              key={idx}
              className="dp-summary-row"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
            >
              <div className="dp-summary-row-icon">{row.icon}</div>
              <div className="dp-summary-row-label">{row.label}</div>
              <div className="dp-summary-row-colon">:</div>
              <div className="dp-summary-row-value">{row.value}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="dp-summary-buttons">
        <motion.button
          className="dp-btn dp-btn--primary dp-btn--lg"
          onClick={handleSaveImage}
          disabled={saving}
          type="button"
          id="dp-btn-save-image"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="dp-btn-icon">{finalStep.saveImageIcon || "🖼️"}</span>
          {saving ? "Saving..." : finalStep.saveImageText || "Save as Image"}
          <span style={{ fontSize: "0.7em" }}>✨</span>
        </motion.button>

        <motion.button
          className="dp-btn dp-btn--outline dp-btn--lg"
          onClick={handleShare}
          type="button"
          id="dp-btn-share"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="dp-btn-icon">{finalStep.shareIcon || "✈️"}</span>
          {finalStep.shareText || "Send to Me"}
        </motion.button>
      </div>

      <p className="dp-helper-text">
        💗 {finalStep.helperText || "Save the summary first, then send it. ✨"}
      </p>

      {/* Toast */}
      {toast && (
        <motion.div
          className="dp-toast"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          {toast}
        </motion.div>
      )}
    </motion.div>
  );
}
