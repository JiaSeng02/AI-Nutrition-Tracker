import { DailyTargets, NutritionGoal } from "./food";

export type NutritionTargetSource = "default" | "suggested" | "custom";

export interface NutritionTargetMetadata {
  goal: NutritionGoal;
  source: NutritionTargetSource;
  suggestedCalories: number | null;
  suggestionPending: boolean;
}

export type EditableNutritionTargets = Omit<DailyTargets, "id">;
