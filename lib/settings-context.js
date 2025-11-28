// lib/settings-context.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { useSQLite } from "./sqlite-provider";
import { useAuth } from "./auth/auth-context";

const ACCENTS = {
  original: "#2EF0BA",
  darkblue: "#0B3B8C",
  pink: "#FFB6C1",
  bloodred: "#B20000",
  lime: "#A4DE02",
};

const THEMES = {
  dark: {
    bg: "#000",
    cardBg: "#0A0A0A",
    text: "#FFF",
    muted: "#888",
    border: "#222",
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

  // Load settings when user changes or on mount
  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      if (!user?.id) {
        // Not logged in - use defaults
        if (mounted) {
          setTheme("dark");
          setAccent("original");
          setLoading(false);
        }
        return;
      }

      try {
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
            setTheme(row.theme || "dark");
            setAccent(row.accent || "original");
          } else {
            // No settings found - insert defaults
            setTheme("dark");
            setAccent("original");
            await db.execAsync(
              `INSERT INTO user_settings (user_id, theme, accent, notifications) 
               VALUES ('${user.id}', 'dark', 'original', 1)`
            );
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

  // Save theme to DB
  async function updateTheme(newTheme) {
    if (!user?.id) return;

    setTheme(newTheme);

    try {
      await db.execAsync(
        `INSERT OR REPLACE INTO user_settings (user_id, theme, accent, notifications) 
         VALUES ('${user.id}', '${newTheme}', '${accent}', 1)`
      );
    } catch (e) {
      console.log("THEME SAVE ERROR:", e);
    }
  }

  // Save accent to DB
  async function updateAccent(newAccent) {
    if (!user?.id) return;

    setAccent(newAccent);

    try {
      await db.execAsync(
        `INSERT OR REPLACE INTO user_settings (user_id, theme, accent, notifications) 
         VALUES ('${user.id}', '${theme}', '${newAccent}', 1)`
      );
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