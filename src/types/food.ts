export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

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
  created_at: string; // ISO 8601 string or YYYY-MM-DD HH:MM:SS
  updated_at: string;
}

export type NewFoodInput = Omit<FoodItem, 'id' | 'created_at' | 'updated_at'> & {
  created_at?: string; // Optional custom timestamp or date (defaults to now)
};

export type UpdateFoodInput = Partial<Omit<FoodItem, 'id' | 'created_at' | 'updated_at'>>;

export interface DailyTargets {
  id: number;
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
}

export interface DailyNutritionSummary {
  date: string; // YYYY-MM-DD
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
