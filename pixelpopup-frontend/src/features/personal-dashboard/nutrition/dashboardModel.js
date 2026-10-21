const DAY = 86400000;
export const clampProgress = (value) => Math.max(0, Math.min(100, value));
export const nutritionNumber = (value, digits = 0) => value == null ? "—" : new Intl.NumberFormat("en-PH", { maximumFractionDigits: digits }).format(Number(value));
export const shiftDay = (date, amount) => new Date(Date.parse(`${date}T12:00:00Z`) + amount * DAY).toISOString().slice(0, 10);
const validDay = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "") && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
const statusFor = (percentage) => percentage == null ? "unlogged" : percentage > 100 ? "over" : percentage === 100 ? "reached" : percentage >= 90 ? "approaching" : "below";

export function deriveDailyOverview({ summary, profile, basis = "food" }) {
  const food = summary?.day_totals ? Number(summary.day_totals.calories) : null;
  const burn = Number(summary?.day_activity_kcal || 0);
  const target = Number(profile?.daily_target_kcal) || null;
  const net = food == null ? null : food - burn;
  const calories = basis === "net" ? net : food;
  const percentage = calories == null || target == null ? null : calories / target * 100;
  const foodPercentage = food == null || target == null ? null : food / target * 100;
  const previous = summary?.days?.at(-2);
  const previousValue = previous?.totals ? Number(basis === "net" ? previous.net_calories ?? Number(previous.totals.calories) - Number(previous.activity_kcal || 0) : previous.totals.calories) : null;
  return {
    food, burn, net, target, calories, percentage, fill: clampProgress(percentage ?? 0),
    remaining: calories == null || target == null ? null : target - calories,
    status: statusFor(percentage), foodStatus: statusFor(foodPercentage),
    previousDelta: calories == null || previousValue == null ? null : calories - previousValue,
    macros: ["protein", "carbs", "fat"].map((key) => {
      const value = summary?.day_totals ? Number(summary.day_totals[key]) : null;
      const goal = Number(profile?.[`daily_target_${key}_g`]) || null;
      return { key, value, target: goal, remaining: value == null || goal == null ? null : goal - value, fill: clampProgress(value == null || !goal ? 0 : value / goal * 100) };
    }),
  };
}

export function resolveAnalyticsRange({ period, anchor, start, end, today }) {
  if (!validDay(today)) throw new Error("A valid current date is required.");
  if (period !== "custom") {
    if (!validDay(anchor)) throw new Error("Choose a valid report date.");
    end = anchor > today ? today : anchor;
    start = period === "week" ? shiftDay(end, -6) : `${anchor.slice(0, 7)}-01`;
    if (period === "month") {
      const monthEnd = new Date(Date.UTC(Number(anchor.slice(0, 4)), Number(anchor.slice(5, 7)), 0, 12)).toISOString().slice(0, 10);
      end = monthEnd < today ? monthEnd : today;
    }
    if (!["week", "month"].includes(period)) throw new Error("Choose Week, Month or Custom.");
  }
  if (!validDay(start) || !validDay(end)) throw new Error("Choose valid start and end dates.");
  if (start > end) throw new Error("The start date must be on or before the end date.");
  if (start > today) throw new Error("The range must include a date on or before today.");
  end = end > today ? today : end;
  const length = Math.round((Date.parse(end) - Date.parse(start)) / DAY) + 1;
  if (length > 366) throw new Error("Choose a range of 366 days or less.");
  return { start, end, previousStart: shiftDay(start, -length), previousEnd: shiftDay(start, -1) };
}

export function manilaDateTime(now = new Date()) {
  return new Date(new Date(now).getTime() + 8 * 3600000).toISOString().slice(0, 19) + "+08:00";
}

export function copyMealDraft(source, destinationDate, nowIso = manilaDateTime()) {
  const now = manilaDateTime(nowIso);
  if (!validDay(destinationDate) || destinationDate > now.slice(0, 10)) throw new Error("Choose today or an earlier date.");
  const sourceClock = source.datetime ? manilaDateTime(source.datetime).slice(11, 19) : now.slice(11, 19);
  let datetime = `${destinationDate}T${sourceClock}+08:00`;
  if (Date.parse(datetime) > Date.parse(now)) datetime = now;
  const keys = ["name", "amount", "unit", "calories", "protein", "carbs", "fat"];
  return { date: destinationDate, datetime, meal_name: source.meal_name || "", items: source.items.map((item) => Object.fromEntries(keys.map((key) => [key, item[key]]))) };
}

export function weightGoalProgress({ baseline, latest, target }) {
  if (!baseline || !latest || !Number(target)) return null;
  const from = Number(baseline.weight_kg), current = Number(latest.weight_kg), goal = Number(target);
  const raw = from === goal ? current === goal ? 100 : 0 : (current - from) / (goal - from) * 100;
  return { percentage: clampProgress(raw), reached: raw >= 100, baselineDate: baseline.date, remaining: Math.abs(goal - current) };
}

export function sortHistoryRows(rows, key, direction = "desc") {
  const value = (row) => key === "date" ? row.date : ["calories", "protein", "carbs", "fat"].includes(key) ? row.totals?.[key] : row[key];
  return [...rows].sort((a, b) => {
    const av = value(a), bv = value(b);
    if (av == null || bv == null) return av == null && bv == null ? b.date.localeCompare(a.date) : av == null ? 1 : -1;
    const comparison = key === "date" ? av.localeCompare(bv) : Number(av) - Number(bv);
    return comparison * (direction === "asc" ? 1 : -1);
  });
}
