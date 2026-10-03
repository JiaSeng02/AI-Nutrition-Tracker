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
  const result = await db.runAsync(
    `INSERT INTO foods (name, meal_type, calories, protein, carbs, fat, photo_uri, notes, created_at, updated_at, quantity, serving_size, serving_unit, fiber, food_library_id, source_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    input.name.trim(),
    input.meal_type,
    Number(input.calories) || 0,
    Number(input.protein) || 0,
    Number(input.carbs) || 0,
    Number(input.fat) || 0,
    input.photo_uri ?? null,
    input.notes?.trim() ?? null,
    createdAt,
    now,
    input.quantity ?? 1,
    input.serving_size ?? 1,
    input.serving_unit ?? "serving",
    input.fiber ?? null,
    input.food_library_id ?? null,
    input.source_type ?? "user_entered",
  );

  const inserted = await getFoodById(result.lastInsertRowId);
  if (!inserted) throw new Error("Failed to retrieve newly added food item");
  return inserted;
}

export async function updateFood(
  id: number,
  input: UpdateFoodInput,
): Promise<FoodItem | null> {
  const db = await getDatabase();
  const current = await getFoodById(id);
  if (!current) return null;

  await db.runAsync(
    `UPDATE foods
     SET name = ?, meal_type = ?, calories = ?, protein = ?, carbs = ?, fat = ?, photo_uri = ?, notes = ?, updated_at = ?, quantity = ?, serving_size = ?, serving_unit = ?, fiber = ?, food_library_id = ?, source_type = ?
     WHERE id = ?;`,
    input.name !== undefined ? input.name.trim() : current.name,
    input.meal_type ?? current.meal_type,
    input.calories !== undefined ? Number(input.calories) : current.calories,
    input.protein !== undefined ? Number(input.protein) : current.protein,
    input.carbs !== undefined ? Number(input.carbs) : current.carbs,
    input.fat !== undefined ? Number(input.fat) : current.fat,
    input.photo_uri !== undefined ? input.photo_uri : current.photo_uri,
    input.notes !== undefined
      ? input.notes
        ? input.notes.trim()
        : null
      : current.notes,
    new Date().toISOString(),
    input.quantity ?? current.quantity,
    input.serving_size ?? current.serving_size,
    input.serving_unit ?? current.serving_unit,
    input.fiber !== undefined ? input.fiber : current.fiber,
    input.food_library_id !== undefined
      ? input.food_library_id
      : current.food_library_id,
    input.source_type ?? current.source_type,
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
  const pattern = `${dateStr}%`;
  return db.getAllAsync<FoodItem>(
    "SELECT * FROM foods WHERE created_at LIKE ? ORDER BY created_at ASC, id ASC;",
    pattern,
  );
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
    if (meals[type]) meals[type].push(item);
    else meals.snack.push(item);
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

export async function seedSampleData(): Promise<void> {
  // Kept for compatibility with existing app initialization.
}
