import MealDialog from "./MealDialog";
import { today } from "../../lib/format";

// Use the same numeric inputs, food editor, JSON preview and draft protection as meals.
export default function MealPresetDialog({ preset, initialMeal, onSave, onClose, restoreFocus }) {
  return <MealDialog presetMode initialMealDraft={preset || initialMeal} date={today()} onClose={onClose} restoreFocus={restoreFocus} onSave={(body) => onSave(body, preset?.id)} />;
}
