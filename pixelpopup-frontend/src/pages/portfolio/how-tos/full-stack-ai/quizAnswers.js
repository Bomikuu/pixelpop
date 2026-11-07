export function isIdentification(question) {
  return question.type === "identification";
}

function normalizeAnswer(value) {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
}

export function hasAnswer(question, value) {
  return isIdentification(question) ? typeof value === "string" && Boolean(value.trim()) : Number.isInteger(value);
}

export function isCorrectAnswer(question, value) {
  if (!hasAnswer(question, value)) return false;
  if (!isIdentification(question)) return value === question.answer;
  const accepted = [question.answer, ...(question.acceptedAnswers || [])];
  return accepted.some((answer) => normalizeAnswer(answer) === normalizeAnswer(value));
}

export function answerText(question, value = question.answer) {
  return isIdentification(question) ? value : question.options[value];
}

export function matchesFormat(question, format) {
  return format === "mixed" || (format === "identification" ? isIdentification(question) : !isIdentification(question));
}
