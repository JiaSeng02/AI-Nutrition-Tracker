import {
  FoodCategory,
  FoodLibraryItem,
  FoodLibrarySource,
} from "../types/food";
import { getDatabase } from "./database";
import { getAllFoods } from "./foodRepository";

export type FoodLibraryInput = Omit<
  FoodLibraryItem,
  "id" | "source_type" | "seed_key" | "created_at" | "updated_at"
>;

interface SeedFood extends FoodLibraryInput {
  seed_key: string;
}

const SEED_FOODS: SeedFood[] = [
  {
    seed_key: "ref-white-rice",
    name: "White Rice",
    category: "Rice & Grains",
    serving_size: 1,
    serving_unit: "cup cooked",
    calories: 205,
    protein: 4.3,
    carbs: 44.5,
    fat: 0.4,
    fiber: 0.6,
    description: "Reference value for plain cooked white rice.",
    photo_uri: null,
  },
  {
    seed_key: "ref-oatmeal",
    name: "Oatmeal",
    category: "Rice & Grains",
    serving_size: 1,
    serving_unit: "cup cooked",
    calories: 154,
    protein: 5.3,
    carbs: 27.4,
    fat: 2.6,
    fiber: 4,
    description: "Plain oatmeal prepared with water.",
    photo_uri: null,
  },
  {
    seed_key: "ref-chicken-breast",
    name: "Chicken Breast",
    category: "Meat",
    serving_size: 100,
    serving_unit: "g cooked",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    description: "Reference value for plain roasted chicken breast.",
    photo_uri: null,
  },
  {
    seed_key: "ref-salmon",
    name: "Salmon",
    category: "Seafood",
    serving_size: 100,
    serving_unit: "g cooked",
    calories: 206,
    protein: 22,
    carbs: 0,
    fat: 12.4,
    fiber: 0,
    description: "Reference value for plain cooked salmon.",
    photo_uri: null,
  },
  {
    seed_key: "ref-egg",
    name: "Egg",
    category: "Eggs",
    serving_size: 1,
    serving_unit: "large egg",
    calories: 78,
    protein: 6.3,
    carbs: 0.6,
    fat: 5.3,
    fiber: 0,
    description: "Reference value for one large cooked egg.",
    photo_uri: null,
  },
  {
    seed_key: "ref-broccoli",
    name: "Broccoli",
    category: "Vegetables",
    serving_size: 1,
    serving_unit: "cup cooked",
    calories: 55,
    protein: 3.7,
    carbs: 11.2,
    fat: 0.6,
    fiber: 5.1,
    description: "Reference value for cooked broccoli.",
    photo_uri: null,
  },
  {
    seed_key: "ref-banana",
    name: "Banana",
    category: "Fruits",
    serving_size: 1,
    serving_unit: "medium banana",
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.4,
    fiber: 3.1,
    description: "Reference value for one medium banana.",
    photo_uri: null,
  },
  {
    seed_key: "ref-apple",
    name: "Apple",
    category: "Fruits",
    serving_size: 1,
    serving_unit: "medium apple",
    calories: 95,
    protein: 0.5,
    carbs: 25.1,
    fat: 0.3,
    fiber: 4.4,
    description: "Reference value for one medium apple.",
    photo_uri: null,
  },
  {
    seed_key: "ref-whole-milk",
    name: "Whole Milk",
    category: "Dairy",
    serving_size: 1,
    serving_unit: "cup",
    calories: 149,
    protein: 7.7,
    carbs: 11.7,
    fat: 8,
    fiber: 0,
    description: "Reference value for whole dairy milk.",
    photo_uri: null,
  },
  {
    seed_key: "ref-fries",
    name: "French Fries",
    category: "Fast Food",
    serving_size: 1,
    serving_unit: "medium order",
    calories: 365,
    protein: 4,
    carbs: 48,
    fat: 17,
    fiber: 4,
    description: "Approximate reference value for a medium order.",
    photo_uri: null,
  },
  {
    seed_key: "ref-chicken-rice",
    name: "Chicken Rice",
    category: "Local / Malaysian Food",
    serving_size: 1,
    serving_unit: "plate",
    calories: 600,
    protein: 30,
    carbs: 75,
    fat: 18,
    fiber: 2,
    description: "Approximate reference value; recipes and portions vary.",
    photo_uri: null,
  },
  {
    seed_key: "ref-nasi-lemak",
    name: "Nasi Lemak",
    category: "Local / Malaysian Food",
    serving_size: 1,
    serving_unit: "serving",
    calories: 650,
    protein: 20,
    carbs: 80,
    fat: 28,
    fiber: 5,
    description:
      "Approximate reference value; accompaniments and portions vary.",
    photo_uri: null,
  },
  {
    seed_key: "ref-roti-canai",
    name: "Roti Canai",
    category: "Local / Malaysian Food",
    serving_size: 1,
    serving_unit: "piece",
    calories: 300,
    protein: 7,
    carbs: 42,
    fat: 11,
    fiber: 2,
    description: "Approximate reference value for one plain piece.",
    photo_uri: null,
  },
  {
    seed_key: "ref-char-kway-teow",
    name: "Char Kway Teow",
    category: "Local / Malaysian Food",
    serving_size: 1,
    serving_unit: "plate",
    calories: 750,
    protein: 25,
    carbs: 95,
    fat: 28,
    fiber: 4,
    description: "Approximate reference value; hawker recipes vary widely.",
    photo_uri: null,
  },
  {
    seed_key: "ref-teh-tarik",
    name: "Teh Tarik",
    category: "Beverages",
    serving_size: 1,
    serving_unit: "cup",
    calories: 150,
    protein: 4,
    carbs: 25,
    fat: 4,
    fiber: 0,
    description: "Approximate reference value for a sweetened cup.",
    photo_uri: null,
  },
];

const FOOD_COLUMNS =
  "(name, category, serving_size, serving_unit, calories, protein, carbs, fat, fiber, description, photo_uri, source_type, seed_key, created_at, updated_at)";
const FOOD_VALUES = "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

export async function seedFoodLibrary(): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  for (const food of SEED_FOODS) {
    await db.runAsync(
      `INSERT OR IGNORE INTO food_library ${FOOD_COLUMNS} ${FOOD_VALUES};`,
      food.name,
      food.category,
      food.serving_size,
      food.serving_unit,
      food.calories,
      food.protein,
      food.carbs,
      food.fat,
      food.fiber,
      food.description,
      food.photo_uri,
      "reference",
      food.seed_key,
      now,
      now,
    );
  }
}

export async function getFoodLibraryItem(
  id: number,
): Promise<FoodLibraryItem | null> {
  const db = await getDatabase();
  return db.getFirstAsync<FoodLibraryItem>(
    "SELECT * FROM food_library WHERE id = ?;",
    id,
  );
}

export async function searchFoodLibrary(
  searchText = "",
  category: FoodCategory | null = null,
): Promise<FoodLibraryItem[]> {
  const db = await getDatabase();
  const foods = await db.getAllAsync<FoodLibraryItem>(
    "SELECT * FROM food_library ORDER BY name COLLATE NOCASE ASC;",
  );
  const query = searchText.trim().toLocaleLowerCase();
  return foods.filter(
    (food) =>
      (!query || food.name.toLocaleLowerCase().includes(query)) &&
      (!category || food.category === category),
  );
}

export async function getRecentFoodLibraryItems(
  limit = 5,
): Promise<FoodLibraryItem[]> {
  const [entries, catalog] = await Promise.all([
    getAllFoods(),
    searchFoodLibrary(),
  ]);
  const recentIds: number[] = [];
  for (const entry of entries) {
    if (
      entry.food_library_id !== null &&
      !recentIds.includes(entry.food_library_id)
    ) {
      recentIds.push(entry.food_library_id);
    }
    if (recentIds.length >= limit) break;
  }
  const byId = new Map(catalog.map((food: any) => [food.id, food]));
  return recentIds
    .map((id) => byId.get(id))
    .filter((food): food is FoodLibraryItem => food !== undefined);
}

export async function createCustomFood(
  input: FoodLibraryInput,
): Promise<FoodLibraryItem> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO food_library ${FOOD_COLUMNS} ${FOOD_VALUES};`,
    input.name.trim(),
    input.category,
    input.serving_size,
    input.serving_unit.trim(),
    input.calories,
    input.protein,
    input.carbs,
    input.fat,
    input.fiber,
    input.description?.trim() || null,
    input.photo_uri,
    "custom",
    null,
    now,
    now,
  );
  const saved = await getFoodLibraryItem(result.lastInsertRowId);
  if (!saved)
    throw new Error("Could not retrieve the custom food after saving.");
  return saved;
}

export async function updateCustomFood(
  id: number,
  input: FoodLibraryInput,
): Promise<FoodLibraryItem | null> {
  const db = await getDatabase();
  const existing = await getFoodLibraryItem(id);
  if (!existing || existing.source_type !== "custom") return null;
  await db.runAsync(
    `UPDATE food_library
     SET name = ?, category = ?, serving_size = ?, serving_unit = ?, calories = ?, protein = ?, carbs = ?, fat = ?, fiber = ?, description = ?, photo_uri = ?, updated_at = ?
     WHERE id = ? AND source_type = 'custom';`,
    input.name.trim(),
    input.category,
    input.serving_size,
    input.serving_unit.trim(),
    input.calories,
    input.protein,
    input.carbs,
    input.fat,
    input.fiber,
    input.description?.trim() || null,
    input.photo_uri,
    new Date().toISOString(),
    id,
  );
  return getFoodLibraryItem(id);
}

export async function deleteCustomFood(id: number): Promise<boolean> {
  const db = await getDatabase();
  const food = await getFoodLibraryItem(id);
  if (!food || food.source_type !== "custom") return false;
  await db.runAsync(
    "UPDATE foods SET food_library_id = NULL WHERE food_library_id = ?;",
    id,
  );
  const result = await db.runAsync(
    "DELETE FROM food_library WHERE id = ? AND source_type = 'custom';",
    id,
  );
  return result.changes > 0;
}

export function getFoodSourceLabel(
  source: FoodLibrarySource | "user_entered",
): string {
  return source === "reference" ? "Reference" : "User Entered";
}
