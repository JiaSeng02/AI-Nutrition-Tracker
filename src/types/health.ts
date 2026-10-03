export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "high"
  | "very_high";

export type EnergySexParameter = "female" | "male";

export interface HealthProfile {
  id: 1;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  sex_parameter: EnergySexParameter | null;
  activity_level: ActivityLevel | null;
  updated_at: string;
}

export type HealthProfileInput = Omit<HealthProfile, "id" | "updated_at">;

export interface HealthMeasurement {
  id: number;
  recorded_at: string;
  weight_kg: number;
  height_cm: number | null;
}

export interface NutritionDay {
  date: string;
  entries: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
