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

    CREATE TABLE IF NOT EXISTS food_library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      serving_size REAL NOT NULL DEFAULT 1,
      serving_unit TEXT NOT NULL DEFAULT 'serving',
      calories REAL NOT NULL DEFAULT 0,
      protein REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      fiber REAL,
      description TEXT,
      photo_uri TEXT,
      source_type TEXT NOT NULL DEFAULT 'custom',
      seed_key TEXT UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_food_library_name ON food_library(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_food_library_category ON food_library(category);

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
  await migrateFoodDiarySchema(db);
}

async function migrateFoodDiarySchema(
  db: SQLite.SQLiteDatabase,
): Promise<void> {
  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version;",
  );
  const currentVersion = versionRow?.user_version ?? 0;
  if (currentVersion >= 1) return;

  const columns = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(foods);",
  );
  const existingColumns = new Set(columns.map((column) => column.name));
  const additions: [string, string][] = [
    [
      "quantity",
      "ALTER TABLE foods ADD COLUMN quantity REAL NOT NULL DEFAULT 1;",
    ],
    [
      "serving_size",
      "ALTER TABLE foods ADD COLUMN serving_size REAL NOT NULL DEFAULT 1;",
    ],
    [
      "serving_unit",
      "ALTER TABLE foods ADD COLUMN serving_unit TEXT NOT NULL DEFAULT 'serving';",
    ],
    ["fiber", "ALTER TABLE foods ADD COLUMN fiber REAL;"],
    [
      "food_library_id",
      "ALTER TABLE foods ADD COLUMN food_library_id INTEGER;",
    ],
    [
      "source_type",
      "ALTER TABLE foods ADD COLUMN source_type TEXT NOT NULL DEFAULT 'user_entered';",
    ],
  ];

  for (const [column, statement] of additions) {
    if (!existingColumns.has(column)) await db.execAsync(statement);
  }

  await db.execAsync("PRAGMA user_version = 1;");
}
