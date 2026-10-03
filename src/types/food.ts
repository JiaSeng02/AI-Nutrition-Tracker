export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type NutritionGoal = "general" | "consistency" | "custom";
export type DiaryFoodSource = "reference" | "user_entered";
export type FoodLibrarySource = "reference" | "custom";

export const FOOD_CATEGORIES = [
  "Rice & Grains",
  "Meat",
  "Seafood",
  "Vegetables",
  "Fruits",
  "Dairy",
  "Eggs",
  "Bread & Bakery",
  "Noodles & Pasta",
  "Snacks",
  "Beverages",
  "Fast Food",
  "Local / Malaysian Food",
  "Other",
] as const;

export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export interface FoodLibraryItem {
  id: number;
  name: string;
  category: FoodCategory;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  description: string | null;
  photo_uri: string | null;
  source_type: FoodLibrarySource;
  seed_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodItem {
  id: number;
  name: string;
  meal_type: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photo_uri: string | null;
  notes: string | null;
  quantity: number;
  serving_size: number;
  serving_unit: string;
  fiber: number | null;
  food_library_id: number | null;
  source_type: DiaryFoodSource;
  created_at: string; // ISO 8601 string or YYYY-MM-DD HH:MM:SS
  updated_at: string;
}

export type NewFoodInput = Omit<
  FoodItem,
  | "id"
  | "created_at"
  | "updated_at"
  | "quantity"
  | "serving_size"
  | "serving_unit"
  | "fiber"
  | "food_library_id"
  | "source_type"
> & {
  created_at?: string; // Optional custom timestamp or date (defaults to now)
  quantity?: number;
  serving_size?: number;
  serving_unit?: string;
  fiber?: number | null;
  food_library_id?: number | null;
  source_type?: DiaryFoodSource;
};

export type UpdateFoodInput = Partial<
  Omit<FoodItem, "id" | "created_at" | "updated_at">
>;

export interface DailyTargets {
  id: number;
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
}

export interface DailyNutritionSummary {
  date: string; // YYYY-MM-DD
  nutritionGoal: NutritionGoal;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  meals: {
    breakfast: FoodItem[];
    lunch: FoodItem[];
    dinner: FoodItem[];
    snack: FoodItem[];
  };
}
