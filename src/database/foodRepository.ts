import {
  DailyNutritionSummary,
  FoodItem,
  MealType,
  NewFoodInput,
  UpdateFoodInput,
} from "../types/food";
import { getDatabase } from "./database";
import { getSetting, getTargets } from "./settingsRepository";

export async function addFood(input: NewFoodInput): Promise<FoodItem> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const createdAt = input.created_at || now;
  const updatedAt = now;

  const result = await db.runAsync(
    `INSERT INTO foods (name, meal_type, calories, protein, carbs, fat, photo_uri, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    input.name.trim(),
    input.meal_type,
    Number(input.calories) || 0,
    Number(input.protein) || 0,
    Number(input.carbs) || 0,
    Number(input.fat) || 0,
    input.photo_uri ?? null,
    input.notes?.trim() ?? null,
    createdAt,
    updatedAt,
  );

  const inserted = await getFoodById(result.lastInsertRowId);
  if (!inserted) {
    throw new Error("Failed to retrieve newly added food item");
  }
  return inserted;
}

export async function updateFood(
  id: number,
  input: UpdateFoodInput,
): Promise<FoodItem | null> {
  const db = await getDatabase();
  const current = await getFoodById(id);
  if (!current) return null;

  const updatedName =
    input.name !== undefined ? input.name.trim() : current.name;
  const updatedMealType =
    input.meal_type !== undefined ? input.meal_type : current.meal_type;
  const updatedCalories =
    input.calories !== undefined ? Number(input.calories) : current.calories;
  const updatedProtein =
    input.protein !== undefined ? Number(input.protein) : current.protein;
  const updatedCarbs =
    input.carbs !== undefined ? Number(input.carbs) : current.carbs;
  const updatedFat = input.fat !== undefined ? Number(input.fat) : current.fat;
  const updatedPhotoUri =
    input.photo_uri !== undefined ? input.photo_uri : current.photo_uri;
  const updatedNotes =
    input.notes !== undefined
      ? input.notes
        ? input.notes.trim()
        : null
      : current.notes;
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE foods
     SET name = ?, meal_type = ?, calories = ?, protein = ?, carbs = ?, fat = ?, photo_uri = ?, notes = ?, updated_at = ?
     WHERE id = ?;`,
    updatedName,
    updatedMealType,
    updatedCalories,
    updatedProtein,
    updatedCarbs,
    updatedFat,
    updatedPhotoUri,
    updatedNotes,
    now,
    id,
  );

  return getFoodById(id);
}

export async function deleteFood(id: number): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync("DELETE FROM foods WHERE id = ?;", id);
  return result.changes > 0;
}

export async function getFoodById(id: number): Promise<FoodItem | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<FoodItem>(
    "SELECT * FROM foods WHERE id = ?;",
    id,
  );
  return row || null;
}

export async function getFoodsByDate(dateStr: string): Promise<FoodItem[]> {
  const db = await getDatabase();
  // dateStr is 'YYYY-MM-DD'
  const pattern = `${dateStr}%`;
  const rows = await db.getAllAsync<FoodItem>(
    "SELECT * FROM foods WHERE created_at LIKE ? ORDER BY created_at ASC, id ASC;",
    pattern,
  );
  return rows;
}

export async function getDailyNutritionSummary(
  dateStr: string,
): Promise<DailyNutritionSummary> {
  const [foods, targets, goalSetting] = await Promise.all([
    getFoodsByDate(dateStr),
    getTargets(),
    getSetting("nutrition_goal", "general"),
  ]);
  const nutritionGoal =
    goalSetting === "consistency" || goalSetting === "custom"
      ? goalSetting
      : "general";

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  const meals: DailyNutritionSummary["meals"] = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  for (const item of foods) {
    totalCalories += item.calories;
    totalProtein += item.protein;
    totalCarbs += item.carbs;
    totalFat += item.fat;

    const type = item.meal_type as MealType;
    if (meals[type]) {
      meals[type].push(item);
    } else {
      meals.snack.push(item);
    }
  }

  return {
    date: dateStr,
    nutritionGoal,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    calorieTarget: targets.calorie_target,
    proteinTarget: targets.protein_target,
    carbsTarget: targets.carbs_target,
    fatTarget: targets.fat_target,
    meals,
  };
}

export async function getAllFoods(): Promise<FoodItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<FoodItem>(
    "SELECT * FROM foods ORDER BY created_at DESC;",
  );
}

export async function clearAllFoods(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM foods;");
}

// No sample data — app starts with a clean empty state.
// This function is kept for forward compatibility.
export async function seedSampleData(): Promise<void> {
  // Intentionally empty — users start fresh with no pre-loaded food entries.
}
