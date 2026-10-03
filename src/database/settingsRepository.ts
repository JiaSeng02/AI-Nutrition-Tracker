import { getDatabase } from './database';
import { DailyTargets } from '../types/food';

const DEFAULT_TARGETS: DailyTargets = {
  id: 1,
  calorie_target: 2000,
  protein_target: 120,
  carbs_target: 220,
  fat_target: 65,
};

export async function getTargets(): Promise<DailyTargets> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DailyTargets>('SELECT * FROM daily_targets WHERE id = 1;');
  if (!row) {
    await db.runAsync(
      'INSERT OR IGNORE INTO daily_targets (id, calorie_target, protein_target, carbs_target, fat_target) VALUES (1, ?, ?, ?, ?);',
      DEFAULT_TARGETS.calorie_target,
      DEFAULT_TARGETS.protein_target,
      DEFAULT_TARGETS.carbs_target,
      DEFAULT_TARGETS.fat_target
    );
    return DEFAULT_TARGETS;
  }
  return row;
}

export async function updateTargets(targets: Partial<Omit<DailyTargets, 'id'>>): Promise<DailyTargets> {
  const db = await getDatabase();
  const current = await getTargets();

  const newCalorieTarget = targets.calorie_target ?? current.calorie_target;
  const newProteinTarget = targets.protein_target ?? current.protein_target;
  const newCarbsTarget = targets.carbs_target ?? current.carbs_target;
  const newFatTarget = targets.fat_target ?? current.fat_target;

  await db.runAsync(
    `UPDATE daily_targets
     SET calorie_target = ?, protein_target = ?, carbs_target = ?, fat_target = ?
     WHERE id = 1;`,
    newCalorieTarget,
    newProteinTarget,
    newCarbsTarget,
    newFatTarget
  );

  return {
    id: 1,
    calorie_target: newCalorieTarget,
    protein_target: newProteinTarget,
    carbs_target: newCarbsTarget,
    fat_target: newFatTarget,
  };
}

export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?;', key);
  return row ? row.value : defaultValue;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    key,
    value
  );
}

export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM foods;
    UPDATE daily_targets SET calorie_target = 2000, protein_target = 120, carbs_target = 220, fat_target = 65 WHERE id = 1;
    UPDATE settings SET value = 'User' WHERE key = 'user_name';
    UPDATE settings SET value = 'metric' WHERE key = 'units';
  `);
}

export async function exportAllData(): Promise<string> {
  const db = await getDatabase();
  const foods = await db.getAllAsync('SELECT * FROM foods ORDER BY created_at ASC;');
  const targets = await getTargets();
  const settings = await db.getAllAsync('SELECT * FROM settings;');

  return JSON.stringify(
    {
      app: 'AI Nutrition Tracker',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      dailyTargets: targets,
      settings,
      foods,
    },
    null,
    2
  );
}
