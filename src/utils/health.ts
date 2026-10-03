import { ActivityLevel, EnergySexParameter } from "../types/health";

const POUNDS_PER_KILOGRAM = 2.2046226218;
const CENTIMETERS_PER_INCH = 2.54;
const BMI_SCALE_MIN = 16;
const BMI_SCALE_MAX = 40;

export function getAdultBmiScalePosition(bmi: number): number {
  return Math.max(
    0,
    Math.min(
      100,
      ((bmi - BMI_SCALE_MIN) / (BMI_SCALE_MAX - BMI_SCALE_MIN)) * 100,
    ),
  );
}

export function calculateBmi(
  heightCm: number | null,
  weightKg: number | null,
): number | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const heightMeters = heightCm / 100;
  return weightKg / (heightMeters * heightMeters);
}

export function getAdultBmiCategory(
  bmi: number,
  age: number | null,
): string | null {
  if (age === null || age < 18) return null;
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy weight";
  if (bmi < 30) return "Overweight";
  return "Obesity range";
}

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  very_high: 1.9,
};

export function estimateDailyEnergyNeeds(
  age: number | null,
  heightCm: number | null,
  weightKg: number | null,
  sexParameter: EnergySexParameter | null,
  activityLevel: ActivityLevel | null,
): number | null {
  if (
    age === null ||
    heightCm === null ||
    weightKg === null ||
    sexParameter === null ||
    activityLevel === null ||
    age < 18 ||
    heightCm <= 0 ||
    weightKg <= 0
  ) {
    return null;
  }

  // Mifflin-St Jeor: 10W + 6.25H - 5A + 5 (male) or -161 (female); multiply by activity factor for TDEE.
  const sexAdjustment = sexParameter === "male" ? 5 : -161;
  const restingEnergy =
    10 * weightKg + 6.25 * heightCm - 5 * age + sexAdjustment;
  return Math.round(restingEnergy * ACTIVITY_FACTORS[activityLevel]);
}

export function weightToKilograms(
  value: number,
  units: "metric" | "imperial",
): number {
  return units === "imperial" ? value / POUNDS_PER_KILOGRAM : value;
}

export function weightFromKilograms(
  value: number,
  units: "metric" | "imperial",
): number {
  return units === "imperial" ? value * POUNDS_PER_KILOGRAM : value;
}

export function heightToCentimeters(
  value: number,
  units: "metric" | "imperial",
): number {
  return units === "imperial" ? value * CENTIMETERS_PER_INCH : value;
}

export function heightFromCentimeters(
  value: number,
  units: "metric" | "imperial",
): number {
  return units === "imperial" ? value / CENTIMETERS_PER_INCH : value;
}

export function formatHeight(
  heightCm: number,
  units: "metric" | "imperial",
): string {
  if (units === "metric")
    return `${heightCm.toFixed(1).replace(/\.0$/, "")} cm`;
  const totalInches = Math.round(heightCm / CENTIMETERS_PER_INCH);
  return `${Math.floor(totalInches / 12)} ft ${totalInches % 12} in`;
}

export function formatWeight(
  weightKg: number,
  units: "metric" | "imperial",
): string {
  const value = weightFromKilograms(weightKg, units);
  const formatted = value.toFixed(1).replace(/\.0$/, "");
  return `${formatted} ${units === "imperial" ? "lb" : "kg"}`;
}

export function formatUpdatedDate(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
