export const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

export function cents(value) {
  const text = String(value).trim();
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(amount) ? amount : null;
}

export function splitPreview(total, participants) {
  const budget = cents(total);
  if (!budget || participants.length < 2) return null;
  const fixed = participants.map((person) =>
    person.amount === "" ? null : cents(person.amount),
  );
  if (
    fixed.some(
      (value, index) => participants[index].amount !== "" && value === null,
    )
  )
    return null;
  const remainder =
    budget - fixed.reduce((sum, value) => sum + (value ?? 0), 0);
  const automatic = fixed.filter((value) => value === null).length;
  if (remainder < 0 || (!automatic && remainder !== 0)) return null;
  let extra = automatic ? remainder % automatic : 0;
  return fixed.map(
    (value) =>
      (value ?? Math.floor(remainder / automatic) + (extra-- > 0 ? 1 : 0)) /
      100,
  );
}

export function formError(error) {
  if (!error.fields || typeof error.fields !== "object") return error.message;
  const messages = Object.entries(error.fields).map(
    ([field, value]) =>
      (field === "detail" || field === "non_field_errors"
        ? ""
        : field.replaceAll("_", " ") + ": ") +
      (Array.isArray(value)
        ? value.join(" ")
        : typeof value === "string"
          ? value
          : "Check this field."),
  );
  return messages.join(" ") || error.message;
}
