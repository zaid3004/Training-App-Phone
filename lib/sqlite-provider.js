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
