import { FoodLibraryItem } from "../types/food";

export interface ScaledFoodNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
}

export function formatNutritionAmount(
  value: number,
  maxDecimalPlaces = 1,
): string {
  if (!Number.isFinite(value)) return "0";
  const formatted = roundTo(value, maxDecimalPlaces).toFixed(maxDecimalPlaces);
  return formatted.includes(".")
    ? formatted.replace(/0+$/, "").replace(/\.$/, "")
    : formatted;
}

function roundTo(value: number, decimalPlaces: number): number {
  const scale = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

export function scaleFoodNutrition(
  food: Pick<
    FoodLibraryItem,
    "calories" | "protein" | "carbs" | "fat" | "fiber"
  >,
  quantity: number,
): ScaledFoodNutrition {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new RangeError("Serving quantity must be a positive number.");
  }

  return {
    calories: roundTo(food.calories * quantity, 2),
    protein: roundTo(food.protein * quantity, 2),
    carbs: roundTo(food.carbs * quantity, 2),
    fat: roundTo(food.fat * quantity, 2),
    fiber: food.fiber === null ? null : roundTo(food.fiber * quantity, 2),
  };
}
