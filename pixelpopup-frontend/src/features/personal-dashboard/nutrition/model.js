const nutrients = ["calories", "protein", "carbs", "fat"];

function decimal(value, label, places, minimum, maximum) {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw new Error(`${label} is required.`);
  }
  const number = Number(value);
  const scale = 10 ** places;
  if (!Number.isFinite(number) || number < minimum || number > maximum || Math.abs(number * scale - Math.round(number * scale)) > 0.000001) {
    throw new Error(`${label} must be a valid number with at most ${places} decimal places.`);
  }
  return Math.round(number * scale) / scale;
}

function label(value, field, maxLength) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw new Error(`${field} must be 1–${maxLength} characters.`);
  }
  return value.trim();
}

export function calculateTotals(items) {
  const cents = Object.fromEntries(nutrients.map((field) => [field, 0]));
  for (const item of items) {
    for (const field of nutrients) {
      cents[field] += Math.round(decimal(item[field], field, 2, 0, 99999999.99) * 100);
    }
  }
  return Object.fromEntries(nutrients.map((field) => [field, cents[field] / 100]));
}

export function parseMealJson(text, { allowUnnamed = false } = {}) {
  if (typeof text !== "string" || new TextEncoder().encode(text).length > 65536) {
    throw new Error("Meal JSON must be 64 KiB or smaller.");
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Enter valid JSON for one meal.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON must contain one meal object.");
  }
  if (parsed.datetime !== undefined && (typeof parsed.datetime !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/.test(parsed.datetime) || !Number.isFinite(Date.parse(parsed.datetime)))) {
    throw new Error("Datetime must use YYYY-MM-DDTHH:mm:ss+08:00.");
  }
  const meal_name = allowUnnamed && typeof parsed.meal_name === "string" && !parsed.meal_name.trim()
    ? "Meal"
    : label(parsed.meal_name, "Meal name", 160);
  if (!Array.isArray(parsed.items) || parsed.items.length < 1 || parsed.items.length > 100) {
    throw new Error("A meal needs 1–100 food items.");
  }
  const items = parsed.items.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Item ${index + 1} must be an object.`);
    }
    const prefix = `Item ${index + 1}`;
    return {
      name: label(item.name, `${prefix} name`, 160),
      amount: decimal(item.amount, `${prefix} amount`, 3, 0.001, 999999999.999),
      unit: label(item.unit, `${prefix} unit`, 24),
      ...Object.fromEntries(nutrients.map((field) => [field, decimal(item[field], `${prefix} ${field}`, 2, 0, 99999999.99)])),
    };
  });
  const calculatedTotals = calculateTotals(items);
  let suppliedTotals = null;
  let mismatches = [];
  if (parsed.totals !== undefined) {
    if (!parsed.totals || typeof parsed.totals !== "object" || Array.isArray(parsed.totals)) {
      throw new Error("Totals must be an object with calories, protein, carbs, and fat.");
    }
    suppliedTotals = Object.fromEntries(nutrients.map((field) => [field, decimal(parsed.totals[field], `Total ${field}`, 2, 0, 99999999.99)]));
    mismatches = nutrients.filter((field) => Math.abs(Math.round(suppliedTotals[field] * 100) - Math.round(calculatedTotals[field] * 100)) > 1);
  }
  return { meal_name, items, datetime: parsed.datetime || null, calculatedTotals, suppliedTotals, mismatches };
}
