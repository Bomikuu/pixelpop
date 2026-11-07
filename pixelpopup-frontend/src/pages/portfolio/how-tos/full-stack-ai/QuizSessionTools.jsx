import { useEffect, useRef, useState } from "react";
import { ChevronDown, Maximize2, Minimize2, Pause, Play, RotateCcw, Timer } from "lucide-react";

const durations = [5, 10, 15, 25, 45];

function formatTime(seconds) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export default function QuizSessionTools({ phase, roundId, answered, total, focusMode, onFocusMode }) {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [resetId, setResetId] = useState(0);
  const remaining = useRef(0);
  const settings = useRef(null);
  const toggle = useRef(null);

  useEffect(() => {
    remaining.current = minutes * 60000;
    setSeconds(minutes * 60);
    setPaused(false);
    setFinished(false);
  }, [minutes, roundId, resetId]);

  useEffect(() => {
    if (settings.current) settings.current.open = false;
  }, [phase, roundId]);

  useEffect(() => {
    if (phase !== "active" || !minutes || paused) return;
    if (remaining.current <= 0) {
      setSeconds(0);
      setFinished(true);
      return;
    }
    // Use a deadline so background tabs do not slow down the countdown.
    const deadline = Date.now() + remaining.current;
    const tick = () => {
      remaining.current = Math.max(0, deadline - Date.now());
      setSeconds(Math.ceil(remaining.current / 1000));
      if (!remaining.current) {
        setFinished(true);
        window.clearInterval(interval);
      }
    };
    const interval = window.setInterval(tick, 1000);
    return () => {
      remaining.current = Math.max(0, deadline - Date.now());
      window.clearInterval(interval);
    };
  }, [phase, minutes, paused, roundId, resetId]);

  useEffect(() => {
    const closeSettings = (event) => {
      if (event.key === "Escape" && settings.current?.open) {
        event.stopPropagation();
        settings.current.open = false;
        settings.current.querySelector("summary")?.focus();
      } else if (event.key === "Escape" && focusMode && !event.defaultPrevented) {
        onFocusMode(false);
        toggle.current?.focus({ preventScroll: true });
      }
    };
    const closeOutside = (event) => {
      if (settings.current && !settings.current.contains(event.target)) settings.current.open = false;
    };
    document.addEventListener("keydown", closeSettings);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeSettings);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [focusMode, onFocusMode]);

  const timerLabel = !minutes ? "Timer" : phase === "setup" ? `${minutes} min` : formatTime(seconds);
  const timerPaused = minutes > 0 && !finished && phase !== "setup" && (paused || phase !== "active");
  const progress = phase === "setup" ? "Choose a round to begin" : `${answered} of ${total} checked`;

  return <div className="quiz-session-tools" data-focus={focusMode}>
    <div className="quiz-session-context">{focusMode && <h1>Practice quiz</h1>}<span>{progress}</span></div>
    <div className="quiz-session-controls">
      <details className="quiz-timer" ref={settings}>
        <summary aria-label={`Focus timer: ${timerLabel}${timerPaused ? ", paused" : finished ? ", finished" : ""}`}><Timer size={17} aria-hidden="true" /><span role="timer" aria-live="off">{timerLabel}</span>{timerPaused && <small>Paused</small>}<ChevronDown size={14} aria-hidden="true" /></summary>
        <div className="quiz-timer-settings">
          <label htmlFor="quiz-timer-duration">Focus timer<select id="quiz-timer-duration" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}><option value={0}>Off · no time limit</option>{durations.map((duration) => <option value={duration} key={duration}>{duration} minutes</option>)}</select></label>
          <p>{phase === "setup" ? "Starts with your round. A reminder, with no automatic submission." : "Pauses while you review your score. Your answers stay saved in this round."}</p>
          {minutes > 0 && phase !== "setup" && <div className="quiz-timer-actions"><button type="button" className="ai-learn-button" disabled={finished || phase !== "active"} onClick={() => setPaused((value) => !value)}>{paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}{paused ? "Resume" : "Pause"}</button><button type="button" className="ai-learn-button" onClick={() => setResetId((value) => value + 1)}><RotateCcw size={15} aria-hidden="true" />Reset</button></div>}
        </div>
      </details>
      <button type="button" className="ai-learn-button quiz-focus-toggle" ref={toggle} aria-pressed={focusMode} onClick={() => onFocusMode(!focusMode)}>{focusMode ? <Minimize2 size={17} aria-hidden="true" /> : <Maximize2 size={17} aria-hidden="true" />}{focusMode ? "Exit focus" : "Focus mode"}</button>
    </div>
    <p className="quiz-timer-notice" role="status">{finished && phase === "active" ? "Focus timer finished. Continue at your pace, or reset for another session." : ""}</p>
  </div>;
}
