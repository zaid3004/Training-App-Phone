// lib/settings-context.js
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSQLite } from "./sqlite-provider";
import { useAuth } from "./auth/auth-context";

const ACCENTS = {
  teal: "#2EF0BA",
  blue: "#1E90FF",
  pink: "#FFB6C1",
  red: "#FF0000",
  lime: "#A4DE02",
};

const THEMES = {
  dark: {
    bg: "#000",
    cardBg: "#0A0A0A",
    text: "#FFF",
    muted: "#888",
    border: "#fff",
  },
  light: {
    bg: "#FFFFFF",
    cardBg: "#F5F5F5",
    text: "#000",
    muted: "#666",
    border: "#DDD",
  },
};

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const db = useSQLite();
  const { user } = useAuth();

  const [theme, setTheme] = useState("dark");
  const [accent, setAccent] = useState("original");
  const [loading, setLoading] = useState(true);

  // Load settings on mount (GLOBAL from AsyncStorage first, then per-user from SQLite)
  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        // STEP 1: Load global app theme from AsyncStorage (persists across logout)
        const globalTheme = await AsyncStorage.getItem("@app_theme");
        const globalAccent = await AsyncStorage.getItem("@app_accent");

        if (mounted) {
          setTheme(globalTheme || "dark");
          setAccent(globalAccent || "teal");
        }

        // STEP 2: If user is logged in, load their specific settings from SQLite
        if (user?.id) {
          // Ensure table exists
          await db.execAsync(`
            CREATE TABLE IF NOT EXISTS user_settings (
              user_id TEXT PRIMARY KEY NOT NULL,
              theme TEXT,
              accent TEXT,
              notifications INTEGER
            );
          `);

          // Load user settings
          const row = await db.getFirstAsync(
            "SELECT theme, accent FROM user_settings WHERE user_id = ?",
            [user.id]
          );

          if (mounted) {
            if (row) {
              // User has saved settings - use them and sync to AsyncStorage
              const userTheme = row.theme || "dark";
              const userAccent = row.accent || "original";
              
              setTheme(userTheme);
              setAccent(userAccent);

              // Sync to global AsyncStorage so it persists after logout
              await AsyncStorage.setItem("@app_theme", userTheme);
              await AsyncStorage.setItem("@app_accent", userAccent);
            } else {
              // No settings found - insert current global settings as user defaults
              await db.execAsync(
                `INSERT INTO user_settings (user_id, theme, accent, notifications) 
                 VALUES ('${user.id}', '${globalTheme || "dark"}', '${globalAccent || "teal"}', 1)`
              );
            }
          }
        }
      } catch (e) {
        console.log("SETTINGS LOAD ERROR:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, [db, user?.id]);

  // Save theme (both AsyncStorage AND SQLite if logged in)
  async function updateTheme(newTheme) {
    setTheme(newTheme);

    try {
      // Save to global AsyncStorage (persists across logout)
      await AsyncStorage.setItem("@app_theme", newTheme);

      // If logged in, also save to user settings
      if (user?.id) {
        await db.execAsync(
          `INSERT OR REPLACE INTO user_settings (user_id, theme, accent, notifications) 
           VALUES ('${user.id}', '${newTheme}', '${accent}', 1)`
        );
      }
    } catch (e) {
      console.log("THEME SAVE ERROR:", e);
    }
  }

  // Save accent (both AsyncStorage AND SQLite if logged in)
  async function updateAccent(newAccent) {
    setAccent(newAccent);

    try {
      // Save to global AsyncStorage (persists across logout)
      await AsyncStorage.setItem("@app_accent", newAccent);

      // If logged in, also save to user settings
      if (user?.id) {
        await db.execAsync(
          `INSERT OR REPLACE INTO user_settings (user_id, theme, accent, notifications) 
           VALUES ('${user.id}', '${theme}', '${newAccent}', 1)`
        );
      }
    } catch (e) {
      console.log("ACCENT SAVE ERROR:", e);
    }
  }

  // Get current colors object
  const colors = {
    ...THEMES[theme],
    accent: ACCENTS[accent],
  };

  const value = {
    theme,
    accent,
    colors,
    updateTheme,
    updateAccent,
    loading,
    ACCENTS, // Export for settings page
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
