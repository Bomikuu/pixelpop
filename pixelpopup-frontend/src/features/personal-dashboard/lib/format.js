export const money = (value) =>
  value == null
    ? "Not set"
    : new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(Number(value));
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const dateLabel = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value.slice(0, 10) + "T12:00:00"))
    : "No date set";
export const monthLabel = (value) =>
  new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(
    new Date(value + "-01T12:00:00"),
  );
export const words = (value = "") =>
  value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
export const requestId = () => crypto.randomUUID();
