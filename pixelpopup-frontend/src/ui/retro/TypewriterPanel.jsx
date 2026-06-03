import React, { useMemo, useState } from "react";
import RetroPanel from "./Panel";
import RetroButton from "./Button";
import TypewriterText from "./TypewriterText";

const cx = (...c) => c.filter(Boolean).join(" ");

export default function TypewriterPanel({
  // Panel
  title = "MESSAGE",
  rightSlot,
  className,
  bg,
  borderColor,
  shadow,

  // Text
  text = "",
  textClassName = "text-sm md:text-base",
  speedMs = 22,
  startDelayMs = 0,
  cursor = "▌",
  showCursor = true,
  cursorBlinkMs = 450,
  preserveNewlines = true,

  // Beeps
  beepEnabled = false,
  beepEvery = 2,
  beepVolume = 0.03,
  beepFrequency = 880,
  beepDurationMs = 18,

  // Controls
  showControls = true,
  primaryText = "Next",
  secondaryText = "Skip",
  onPrimary,
  onSecondary,

  // Behavior
  autoEnablePrimaryOnDone = true,
  disablePrimary = false,
  disableSecondary = false,

  // Optional footer slot override
  footer,

  // Optional extra content above controls
  extra,

  // Styling tokens for controls area
  controlsClassName = "mt-4 flex items-center justify-end gap-2",
}) {
  const [done, setDone] = useState(false);

  const effectiveDisablePrimary = useMemo(() => {
    if (disablePrimary) return true;
    if (!autoEnablePrimaryOnDone) return false;
    return !done;
  }, [disablePrimary, autoEnablePrimaryOnDone, done]);

  return (
    <RetroPanel
      title={title}
      rightSlot={rightSlot}
      className={className}
      bg={bg}
      borderColor={borderColor}
      shadow={shadow}
    >
      <TypewriterText
        className={cx("font-pp font-extrabold", textClassName)}
        text={text}
        speedMs={speedMs}
        startDelayMs={startDelayMs}
        cursor={cursor}
        showCursor={showCursor}
        cursorBlinkMs={cursorBlinkMs}
        preserveNewlines={preserveNewlines}
        beepEnabled={beepEnabled}
        beepEvery={beepEvery}
        beepVolume={beepVolume}
        beepFrequency={beepFrequency}
        beepDurationMs={beepDurationMs}
        onDone={() => setDone(true)}
      />

      {extra ? <div className="mt-3">{extra}</div> : null}

      {footer ? (
        <div className="mt-4">{footer}</div>
      ) : showControls ? (
        <div className={controlsClassName}>
          {secondaryText ? (
            <RetroButton
              variant="secondary"
              onClick={onSecondary}
              disabled={disableSecondary}
            >
              {secondaryText}
            </RetroButton>
          ) : null}

          {primaryText ? (
            <RetroButton
              onClick={onPrimary}
              disabled={effectiveDisablePrimary}
            >
              {primaryText}
            </RetroButton>
          ) : null}
        </div>
      ) : null}
    </RetroPanel>
  );
}
