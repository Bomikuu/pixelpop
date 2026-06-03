import React, { useMemo, useState } from "react";
import RetroPanel from "./Panel";
import RetroButton from "./Button";
import { overlay } from "../overlay";

const cx = (...c) => c.filter(Boolean).join(" ");

export default function QuizPanel({
  // Panel
  title = "QUIZ.EXE",
  rightSlot,
  className,
  bg,
  borderColor,
  shadow,

  // Question
  question = "",
  questionClassName = "text-sm md:text-base",

  // Answers
  // answers: [{ id, label, correct, description, onCorrect, onWrong }]
  answers = [],

  // Behavior
  multiple = false, // allow multi select
  lockUntilCorrect = true,
  maxAttempts, // optional number
  showExplanation = true,
  explanation = "",
  autoNextDelayMs = 0,

  // Effects
  correctEffects = [
    { type: "sfx", name: "success" },
    { type: "confetti", doubleBurst: true },
  ],
  wrongEffects = [
    { type: "sfx", name: "error" },
    { type: "shake", ms: 420, intensity: 6 },
  ],

  // Events
  onCorrect,
  onWrong,
  onComplete,
}) {
  const normalized = useMemo(() => {
    return answers.map((a, i) => ({
      id: a.id ?? String(i),
      label: a.label ?? `Answer ${i + 1}`,
      correct: Boolean(a.correct),
      description: a.description,
      onCorrect: a.onCorrect,
      onWrong: a.onWrong,
    }));
  }, [answers]);

  const [selected, setSelected] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | correct | wrong

  const isLocked =
    lockUntilCorrect && status !== "correct";

  const remainingAttempts =
    maxAttempts != null
      ? Math.max(0, maxAttempts - attempts)
      : null;

  const runEffects = (arr) =>
    (arr || []).forEach((e) => overlay.effect(e));

  const toggleSelect = (id) => {
    if (status === "correct") return;

    if (multiple) {
      setSelected((prev) =>
        prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id]
      );
    } else {
      setSelected([id]);
    }
  };

  const checkAnswer = () => {
    if (!selected.length) return;

    const selectedAnswers = normalized.filter((a) =>
      selected.includes(a.id)
    );

    const allCorrect =
      selectedAnswers.length > 0 &&
      selectedAnswers.every((a) => a.correct) &&
      normalized
        .filter((a) => a.correct)
        .every((a) => selected.includes(a.id));

    if (allCorrect) {
      setStatus("correct");
      runEffects(correctEffects);
      overlay.toast({
        type: "success",
        message: "Correct answer!",
      });

      selectedAnswers.forEach((a) =>
        a.onCorrect?.(a)
      );

      onCorrect?.(selectedAnswers);

      if (autoNextDelayMs > 0) {
        setTimeout(() => {
          onComplete?.(selectedAnswers);
        }, autoNextDelayMs);
      }
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setStatus("wrong");

      runEffects(wrongEffects);
      overlay.toast({
        type: "error",
        message: "Wrong answer.",
      });

      selectedAnswers.forEach((a) =>
        a.onWrong?.(a)
      );

      onWrong?.(selectedAnswers);

      if (
        maxAttempts != null &&
        nextAttempts >= maxAttempts
      ) {
        overlay.showModal({
          title: "GAME OVER",
          subtitle: "No attempts left",
          content: (
            <div className="font-pp font-extrabold">
              Try again later 😈
            </div>
          ),
          showDefaultActions: true,
        });
      }
    }
  };

  return (
    <RetroPanel
      title={title}
      rightSlot={rightSlot}
      className={className}
      bg={bg}
      borderColor={borderColor}
      shadow={shadow}
    >
      <div className="p-4 space-y-4">
        {/* Question */}
        <div
          className={cx(
            "font-pp font-extrabold",
            questionClassName
          )}
        >
          {question}
        </div>

        {/* Attempts */}
        {remainingAttempts != null ? (
          <div className="font-pp text-xs opacity-70">
            Attempts left:{" "}
            <span className="font-extrabold">
              {remainingAttempts}
            </span>
          </div>
        ) : null}

        {/* Answers */}
        <div className="space-y-3">
          {normalized.map((a) => {
            const isSelected =
              selected.includes(a.id);

            const isCorrectReveal =
              status === "correct" && a.correct;

            const isWrongReveal =
              status === "correct" &&
              !a.correct;

            return (
              <button
                key={a.id}
                type="button"
                disabled={
                  isLocked &&
                  status === "correct"
                }
                onClick={() =>
                  toggleSelect(a.id)
                }
                className={cx(
                  "w-full text-left border-[3px] rounded-xl p-3 transition-transform",
                  "hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]",
                  isSelected
                    ? "scale-[1.01]"
                    : ""
                )}
                style={{
                  borderColor: "var(--pp-border)",
                  boxShadow: "var(--pp-shadow)",
                  background:
                    isCorrectReveal
                      ? "rgba(34,197,94,0.2)"
                      : isWrongReveal
                      ? "rgba(239,68,68,0.15)"
                      : "rgba(255,255,255,0.92)",
                }}
              >
                <div className="font-pp font-extrabold text-sm">
                  {a.label}
                </div>
                {a.description ? (
                  <div className="mt-1 font-pp text-xs opacity-80">
                    {a.description}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation &&
        status === "correct" &&
        explanation ? (
          <div className="font-pp text-xs opacity-85 border-t-[3px] pt-3"
               style={{ borderColor: "var(--pp-border)" }}>
            {explanation}
          </div>
        ) : null}

        {/* Controls */}
        {status !== "correct" ? (
          <div className="flex justify-end">
            <RetroButton onClick={checkAnswer}>
              Submit
            </RetroButton>
          </div>
        ) : null}
      </div>
    </RetroPanel>
  );
}
