import { DailyTargets, FoodItem } from "../types/food";
import { HealthMeasurement, HealthProfile } from "../types/health";

export interface IDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    ...params: any[]
  ): Promise<{ lastInsertRowId: number; changes: number }>;
  getFirstAsync<T>(sql: string, ...params: any[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: any[]): Promise<T[]>;
}

const STORAGE_KEYS = {
  FOODS: "nutrition_tracker_foods",
  TARGETS: "nutrition_tracker_targets",
  SETTINGS: "nutrition_tracker_settings",
  AUTO_ID: "nutrition_tracker_auto_id",
  HEALTH_PROFILE: "nutrition_tracker_health_profile",
  HEALTH_MEASUREMENTS: "nutrition_tracker_health_measurements",
};

class MemoryStorage {
  private memoryMap = new Map<string, string>();

  getItem(key: string): string | null {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return this.memoryMap.get(key) ?? null;
      }
    }
    return this.memoryMap.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        // Fallback to memory
      }
    }
    this.memoryMap.set(key, value);
  }

  removeItem(key: string): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        // Fallback to memory
      }
    }
    this.memoryMap.delete(key);
  }
}

const storage = new MemoryStorage();

class WebDatabase implements IDatabase {
  private getFoods(): FoodItem[] {
    const raw = storage.getItem(STORAGE_KEYS.FOODS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveFoods(foods: FoodItem[]): void {
    storage.setItem(STORAGE_KEYS.FOODS, JSON.stringify(foods));
  }

  private getTargets(): DailyTargets {
    const raw = storage.getItem(STORAGE_KEYS.TARGETS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return {
      id: 1,
      calorie_target: 2000,
      protein_target: 120,
      carbs_target: 220,
      fat_target: 65,
    };
  }

  private saveTargets(targets: DailyTargets): void {
    storage.setItem(STORAGE_KEYS.TARGETS, JSON.stringify(targets));
  }

  private getSettings(): Record<string, string> {
    const raw = storage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return { user_name: "User", units: "metric" };
  }

  private saveSettings(settings: Record<string, string>): void {
    storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  private getNextId(): number {
    const raw = storage.getItem(STORAGE_KEYS.AUTO_ID);
    const current = raw ? Number(raw) : 0;
    const next = current + 1;
    storage.setItem(STORAGE_KEYS.AUTO_ID, String(next));
    return next;
  }

  async execAsync(sql: string): Promise<void> {
    if (sql.includes("DELETE FROM foods")) {
      this.saveFoods([]);
    }
    if (sql.includes("DELETE FROM health_profile")) {
      storage.removeItem(STORAGE_KEYS.HEALTH_PROFILE);
    }
    if (sql.includes("DELETE FROM health_measurements")) {
      storage.removeItem(STORAGE_KEYS.HEALTH_MEASUREMENTS);
    }
    if (sql.includes("UPDATE daily_targets")) {
      this.saveTargets({
        id: 1,
        calorie_target: 2000,
        protein_target: 120,
        carbs_target: 220,
        fat_target: 65,
      });
    }
    if (sql.includes("UPDATE settings SET value = 'Alex'")) {
      const settings = this.getSettings();
      settings.user_name = "Alex";
      this.saveSettings(settings);
    }
    if (sql.includes("UPDATE settings SET value = 'User'")) {
      const settings = this.getSettings();
      settings.user_name = "User";
      this.saveSettings(settings);
    }
    if (sql.includes("UPDATE settings SET value = 'metric'")) {
      const settings = this.getSettings();
      settings.units = "metric";
      this.saveSettings(settings);
    }
  }

  async runAsync(
    sql: string,
    ...params: any[]
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    const trimmed = sql.trim();

    if (trimmed.startsWith("INSERT INTO health_profile")) {
      const [
        age,
        height_cm,
        weight_kg,
        sex_parameter,
        activity_level,
        updated_at,
      ] = params;
      const profile: HealthProfile = {
        id: 1,
        age,
        height_cm,
        weight_kg,
        sex_parameter,
        activity_level,
        updated_at: String(updated_at),
      };
      storage.setItem(STORAGE_KEYS.HEALTH_PROFILE, JSON.stringify(profile));
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (trimmed.startsWith("INSERT INTO health_measurements")) {
      const [recorded_at, weight_kg, height_cm] = params;
      const raw = storage.getItem(STORAGE_KEYS.HEALTH_MEASUREMENTS);
      let measurements: HealthMeasurement[] = [];
      if (raw) {
        try {
          measurements = JSON.parse(raw) as HealthMeasurement[];
        } catch {
          measurements = [];
        }
      }
      const id =
        measurements.reduce(
          (max, measurement) => Math.max(max, measurement.id),
          0,
        ) + 1;
      measurements.push({
        id,
        recorded_at: String(recorded_at),
        weight_kg,
        height_cm,
      });
      storage.setItem(
        STORAGE_KEYS.HEALTH_MEASUREMENTS,
        JSON.stringify(measurements),
      );
      return { lastInsertRowId: id, changes: 1 };
    }

    // INSERT INTO foods
    if (trimmed.startsWith("INSERT INTO foods")) {
      const foods = this.getFoods();
      const id = this.getNextId();
      const [
        name,
        meal_type,
        calories,
        protein,
        carbs,
        fat,
        photo_uri,
        notes,
        created_at,
        updated_at,
      ] = params;

      const newFood: FoodItem = {
        id,
        name: String(name),
        meal_type,
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        photo_uri: photo_uri ?? null,
        notes: notes ?? null,
        created_at: String(created_at),
        updated_at: String(updated_at),
      };

      foods.push(newFood);
      this.saveFoods(foods);
      return { lastInsertRowId: id, changes: 1 };
    }

    // UPDATE foods
    if (trimmed.startsWith("UPDATE foods")) {
      const foods = this.getFoods();
      const [
        name,
        meal_type,
        calories,
        protein,
        carbs,
        fat,
        photo_uri,
        notes,
        updated_at,
        id,
      ] = params;
      const index = foods.findIndex((f) => f.id === Number(id));

      if (index !== -1) {
        foods[index] = {
          ...foods[index],
          name: String(name),
          meal_type,
          calories: Number(calories) || 0,
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
          photo_uri: photo_uri ?? null,
          notes: notes ?? null,
          updated_at: String(updated_at),
        };
        this.saveFoods(foods);
        return { lastInsertRowId: Number(id), changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }

    // DELETE FROM foods WHERE id = ?
    if (trimmed.startsWith("DELETE FROM foods WHERE id = ?")) {
      const id = Number(params[0]);
      const foods = this.getFoods();
      const filtered = foods.filter((f) => f.id !== id);
      const changes = foods.length - filtered.length;
      this.saveFoods(filtered);
      return { lastInsertRowId: 0, changes };
    }

    // DELETE FROM foods
    if (trimmed.startsWith("DELETE FROM foods")) {
      const foods = this.getFoods();
      this.saveFoods([]);
      return { lastInsertRowId: 0, changes: foods.length };
    }

    // UPDATE daily_targets
    if (trimmed.startsWith("UPDATE daily_targets")) {
      const [calorie_target, protein_target, carbs_target, fat_target] = params;
      const targets: DailyTargets = {
        id: 1,
        calorie_target: Number(calorie_target),
        protein_target: Number(protein_target),
        carbs_target: Number(carbs_target),
        fat_target: Number(fat_target),
      };
      this.saveTargets(targets);
      return { lastInsertRowId: 1, changes: 1 };
    }

    // INSERT INTO settings
    if (trimmed.startsWith("INSERT INTO settings")) {
      const [key, value] = params;
      const settings = this.getSettings();
      settings[String(key)] = String(value);
      this.saveSettings(settings);
      return { lastInsertRowId: 1, changes: 1 };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getFirstAsync<T>(sql: string, ...params: any[]): Promise<T | null> {
    const trimmed = sql.trim();

    if (trimmed.includes("FROM health_profile")) {
      const raw = storage.getItem(STORAGE_KEYS.HEALTH_PROFILE);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    }

    // SELECT * FROM foods WHERE id = ?
    if (trimmed.includes("FROM foods WHERE id = ?")) {
      const id = Number(params[0]);
      const foods = this.getFoods();
      const found = foods.find((f) => f.id === id);
      return (found as T) || null;
    }

    // SELECT * FROM daily_targets
    if (trimmed.includes("FROM daily_targets")) {
      return (this.getTargets() as T) || null;
    }

    // SELECT value FROM settings WHERE key = ?
    if (trimmed.includes("FROM settings WHERE key = ?")) {
      const key = String(params[0]);
      const settings = this.getSettings();
      if (key in settings) {
        return { value: settings[key] } as T;
      }
      return null;
    }

    return null;
  }

  async getAllAsync<T>(sql: string, ...params: any[]): Promise<T[]> {
    const trimmed = sql.trim();

    if (trimmed.includes("FROM health_measurements")) {
      const raw = storage.getItem(STORAGE_KEYS.HEALTH_MEASUREMENTS);
      if (!raw) return [];
      try {
        const measurements = JSON.parse(raw) as HealthMeasurement[];
        measurements.sort(
          (a, b) => a.recorded_at.localeCompare(b.recorded_at) || a.id - b.id,
        );
        return measurements as T[];
      } catch {
        return [];
      }
    }

    // SELECT * FROM foods WHERE created_at LIKE ?
    if (trimmed.includes("FROM foods WHERE created_at LIKE ?")) {
      const pattern = String(params[0] || "").replace(/%/g, "");
      const foods = this.getFoods();
      const matched = foods.filter((f) => f.created_at.startsWith(pattern));
      matched.sort(
        (a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id,
      );
      return matched as T[];
    }

    // SELECT * FROM foods ORDER BY created_at
    if (trimmed.includes("FROM foods")) {
      const foods = this.getFoods();
      foods.sort((a, b) => b.created_at.localeCompare(a.created_at));
      return foods as T[];
    }

    // SELECT * FROM settings
    if (trimmed.includes("FROM settings")) {
      const settings = this.getSettings();
      const rows = Object.entries(settings).map(([key, value], idx) => ({
        id: idx + 1,
        key,
        value,
      }));
      return rows as T[];
    }

    return [];
  }
}

let webDbInstance: IDatabase | null = null;

export async function getDatabase(): Promise<IDatabase> {
  if (!webDbInstance) {
    webDbInstance = new WebDatabase();
  }
  return webDbInstance;
}
