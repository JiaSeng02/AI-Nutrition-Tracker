import * as SQLite from "expo-sqlite";

export interface IDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    ...params: any[]
  ): Promise<{ lastInsertRowId: number; changes: number }>;
  getFirstAsync<T>(sql: string, ...params: any[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: any[]): Promise<T[]>;
}

let dbInstance: IDatabase | null = null;

export async function getDatabase(): Promise<IDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync("nutrition_tracker.db");
  await initDatabase(db);
  dbInstance = db;
  return db;
}

async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      photo_uri TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_targets (
      id INTEGER PRIMARY KEY,
      calorie_target INTEGER NOT NULL DEFAULT 2000,
      protein_target INTEGER NOT NULL DEFAULT 120,
      carbs_target INTEGER NOT NULL DEFAULT 220,
      fat_target INTEGER NOT NULL DEFAULT 65
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS health_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      age INTEGER,
      height_cm REAL,
      weight_kg REAL,
      sex_parameter TEXT,
      activity_level TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS health_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recorded_at TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      height_cm REAL
    );

    -- Seed initial targets if none exist
    INSERT OR IGNORE INTO daily_targets (id, calorie_target, protein_target, carbs_target, fat_target)
    VALUES (1, 2000, 120, 220, 65);

    -- Seed default settings
    INSERT OR IGNORE INTO settings (key, value) VALUES ('user_name', 'User');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('units', 'metric');
  `);
}
