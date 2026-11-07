import { useEffect, useState } from "react";
import { quizQuestions } from "./quizQuestions";
import { isCorrectAnswer } from "./quizAnswers";

const storageKey = "mico-full-stack-ai-quiz-progress-v1";
const questionIds = new Set(quizQuestions.map((question) => question.id));

function readProgress() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
    const answers = saved?.answers && typeof saved.answers === "object" && !Array.isArray(saved.answers)
      ? Object.fromEntries(Object.entries(saved.answers).filter(([id, correct]) => questionIds.has(id) && typeof correct === "boolean"))
      : {};
    return { answers, canSave: true };
  } catch {
    return { answers: {}, canSave: false };
  }
}

export default function useQuizProgress() {
  const [progress, setProgress] = useState(readProgress);

  useEffect(() => {
    if (!progress.canSave) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ answers: progress.answers }));
    } catch {
      setProgress((previous) => ({ ...previous, canSave: false }));
    }
  }, [progress.answers, progress.canSave]);

  const recordAnswer = (question, choice) => {
    setProgress((previous) => ({ ...previous, answers: { ...previous.answers, [question.id]: isCorrectAnswer(question, choice) } }));
  };

  return { ...progress, recordAnswer };
}
