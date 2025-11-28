// lib/sqlite-provider.js
import * as SQLite from "expo-sqlite";
import { createContext, useContext, useEffect, useState } from "react";

const SQLiteContext = createContext(null);

export const DB_NAME = "prvault.db";

export function SQLiteProvider({ children }) {
  const [db, setDb] = useState(null);

  useEffect(() => {
    async function init() {
      const database = await SQLite.openDatabaseAsync(DB_NAME);

      // ===========================
      //     CREATE TABLES HERE
      // ===========================
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY NOT NULL,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS user_stats (
          user_id TEXT PRIMARY KEY NOT NULL,
          name TEXT,
          bodyweight REAL,
          bench REAL,
          squat REAL,
          deadlift REAL,
          preferences TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS bodyweight_logs (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          ts TEXT NOT NULL,
          weight REAL,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS workouts (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          exercises TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS workout_logs (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          workout_id TEXT NOT NULL,
          completed_at TEXT NOT NULL,
          duration INTEGER,
          notes TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (workout_id) REFERENCES workouts(id)
        );
      `);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS workout_sets (
          id TEXT PRIMARY KEY NOT NULL,
          workout_log_id TEXT NOT NULL,
          exercise_name TEXT NOT NULL,
          set_number INTEGER NOT NULL,
          reps INTEGER,
          weight REAL,
          completed INTEGER DEFAULT 0,
          FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id)
        );
      `);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS user_settings (
          user_id TEXT PRIMARY KEY NOT NULL,
          theme TEXT,
          accent TEXT,
          notifications INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      setDb(database);
    }

    init();
  }, []);

  async function runAsync(sql, params = []) {
    if (!db) throw new Error("DB not ready");
    return db.runAsync(sql, params);
  }

  async function execAsync(sql, params = []) {
    if (!db) throw new Error("DB not ready");
    return db.execAsync(sql, params);
  }

  async function getFirstAsync(sql, params = []) {
    if (!db) throw new Error("DB not ready");
    return db.getFirstAsync(sql, params);
  }

  async function getAllAsync(sql, params = []) {
    if (!db) throw new Error("DB not ready");
    return db.getAllAsync(sql, params);
  }

  async function prepare(sql) {
    if (!db) throw new Error("DB not ready");
    return db.prepareAsync(sql);
  }

  const value = {
    db,
    runAsync,
    execAsync,
    getFirstAsync,
    getAllAsync,
    prepare,
  };

  return (
    <SQLiteContext.Provider value={value}>
      {children}
    </SQLiteContext.Provider>
  );
}

export function useSQLite() {
  return useContext(SQLiteContext);
}
