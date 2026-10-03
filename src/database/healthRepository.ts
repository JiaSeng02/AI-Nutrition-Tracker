import {
  HealthMeasurement,
  HealthProfile,
  HealthProfileInput,
  NutritionDay,
} from "../types/health";
import { formatDateToISO } from "../utils/date";
import { getDatabase } from "./database";
import { getAllFoods } from "./foodRepository";

export async function getHealthProfile(): Promise<HealthProfile | null> {
  const db = await getDatabase();
  return db.getFirstAsync<HealthProfile>(
    "SELECT * FROM health_profile WHERE id = 1;",
  );
}

export async function getHealthMeasurements(): Promise<HealthMeasurement[]> {
  const db = await getDatabase();
  return db.getAllAsync<HealthMeasurement>(
    "SELECT * FROM health_measurements ORDER BY recorded_at ASC, id ASC;",
  );
}

export async function saveHealthProfile(
  input: HealthProfileInput,
): Promise<HealthProfile> {
  const db = await getDatabase();
  const previous = await getHealthProfile();
  const updatedAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO health_profile (id, age, height_cm, weight_kg, sex_parameter, activity_level, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       age = excluded.age,
       height_cm = excluded.height_cm,
       weight_kg = excluded.weight_kg,
       sex_parameter = excluded.sex_parameter,
       activity_level = excluded.activity_level,
       updated_at = excluded.updated_at;`,
    input.age,
    input.height_cm,
    input.weight_kg,
    input.sex_parameter,
    input.activity_level,
    updatedAt,
  );

  const measurementChanged =
    input.weight_kg !== null &&
    (previous?.weight_kg !== input.weight_kg ||
      previous?.height_cm !== input.height_cm);

  if (measurementChanged) {
    await db.runAsync(
      "INSERT INTO health_measurements (recorded_at, weight_kg, height_cm) VALUES (?, ?, ?);",
      updatedAt,
      input.weight_kg,
      input.height_cm,
    );
  }

  const saved = await getHealthProfile();
  if (!saved) throw new Error("Could not retrieve the saved health profile.");
  return saved;
}

export async function getRecentNutritionDays(
  days = 7,
): Promise<NutritionDay[]> {
  const today = new Date();
  const dates = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - index - 1));
    return formatDateToISO(date);
  });
  const byDate = new Map<string, NutritionDay>(
    dates.map((date) => [
      date,
      { date, entries: 0, calories: 0, protein: 0, carbs: 0, fat: 0 },
    ]),
  );
  const foods = await getAllFoods();

  for (const food of foods) {
    const date = food.created_at.slice(0, 10);
    const day = byDate.get(date);
    if (!day) continue;
    day.entries += 1;
    day.calories += food.calories;
    day.protein += food.protein;
    day.carbs += food.carbs;
    day.fat += food.fat;
  }

  return dates.map((date) => byDate.get(date)!);
}
