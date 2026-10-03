import { NutritionGoal } from "../types/food";
import {
  EditableNutritionTargets,
  NutritionTargetMetadata,
  NutritionTargetSource,
} from "../types/nutritionTarget";
import {
  getSetting,
  getTargets,
  setSetting,
  updateTargets,
} from "./settingsRepository";

const DEFAULT_TARGETS: EditableNutritionTargets = {
  calorie_target: 2000,
  protein_target: 120,
  carbs_target: 220,
  fat_target: 65,
};

function isGoal(value: string): value is NutritionGoal {
  return value === "general" || value === "consistency" || value === "custom";
}

function isSource(value: string): value is NutritionTargetSource {
  return value === "default" || value === "suggested" || value === "custom";
}

function targetsMatchDefaults(targets: EditableNutritionTargets): boolean {
  return (
    targets.calorie_target === DEFAULT_TARGETS.calorie_target &&
    targets.protein_target === DEFAULT_TARGETS.protein_target &&
    targets.carbs_target === DEFAULT_TARGETS.carbs_target &&
    targets.fat_target === DEFAULT_TARGETS.fat_target
  );
}

export async function getNutritionTargetMetadata(): Promise<NutritionTargetMetadata> {
  const [goalValue, sourceValue, suggestedValue, pendingValue, targets] =
    await Promise.all([
      getSetting("nutrition_goal", "general"),
      getSetting("nutrition_target_source"),
      getSetting("nutrition_suggested_calories"),
      getSetting("nutrition_suggestion_pending", "false"),
      getTargets(),
    ]);

  let source: NutritionTargetSource;
  if (isSource(sourceValue)) {
    source = sourceValue;
  } else {
    // Existing non-default targets predate source metadata; preserve them as user-customized.
    source = targetsMatchDefaults(targets) ? "default" : "custom";
    await setSetting("nutrition_target_source", source);
  }

  const suggestedCalories = Number(suggestedValue);
  return {
    goal: isGoal(goalValue) ? goalValue : "general",
    source,
    suggestedCalories:
      Number.isFinite(suggestedCalories) && suggestedCalories > 0
        ? suggestedCalories
        : null,
    suggestionPending: pendingValue === "true",
  };
}

function suggestedMacros(
  calories: number,
): Pick<
  EditableNutritionTargets,
  "protein_target" | "carbs_target" | "fat_target"
> {
  return {
    protein_target: Math.round((calories * 0.2) / 4),
    carbs_target: Math.round((calories * 0.5) / 4),
    fat_target: Math.round((calories * 0.3) / 9),
  };
}

function suggestionChanged(previous: number | null, next: number): boolean {
  if (previous === null) return false;
  return Math.abs(next - previous) >= Math.max(100, previous * 0.05);
}

export async function syncHealthEnergyEstimate(
  estimatedCalories: number | null,
): Promise<NutritionTargetMetadata> {
  const metadata = await getNutritionTargetMetadata();
  if (estimatedCalories === null || estimatedCalories <= 0) return metadata;

  const suggestedCalories = Math.round(estimatedCalories);
  const changedSignificantly = suggestionChanged(
    metadata.suggestedCalories,
    suggestedCalories,
  );

  if (metadata.source === "default") {
    await updateTargets({
      calorie_target: suggestedCalories,
      ...suggestedMacros(suggestedCalories),
    });
    await setSetting("nutrition_target_source", "suggested");
    await setSetting("nutrition_suggestion_pending", "false");
  } else if (changedSignificantly) {
    await setSetting("nutrition_suggestion_pending", "true");
  }

  await setSetting("nutrition_suggested_calories", String(suggestedCalories));
  return getNutritionTargetMetadata();
}

export async function saveUserNutritionTargets(
  targets: EditableNutritionTargets,
  goal: NutritionGoal,
): Promise<void> {
  await updateTargets(targets);
  await setSetting("nutrition_goal", goal);
  await setSetting("nutrition_target_source", "custom");
  await setSetting("nutrition_suggestion_pending", "false");
}

export async function applyHealthEstimateAsTarget(
  estimatedCalories: number,
): Promise<void> {
  const calories = Math.round(estimatedCalories);
  await updateTargets({
    calorie_target: calories,
    ...suggestedMacros(calories),
  });
  await setSetting("nutrition_target_source", "suggested");
  await setSetting("nutrition_suggested_calories", String(calories));
  await setSetting("nutrition_suggestion_pending", "false");
}
