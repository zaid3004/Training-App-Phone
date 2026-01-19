// lib/auth/auth-context.js
import React, { createContext, useState, useContext, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // load saved user on app start
  useEffect(() => {
    async function loadUser() {
      try {
        const saved = await SecureStore.getItemAsync("user");
        if (saved) {
          try {
            setUser(JSON.parse(saved));
          } catch {
            setUser(null);
          }
        }
      } catch (e) {
        console.log("Error loading user:", e);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (userObj) => {
    setUser(userObj);
    await SecureStore.setItemAsync("user", JSON.stringify(userObj));
    // Use router.replace to clear navigation stack
    router.replace("/(tabs)/home");
  };

  const logout = async () => {
    setUser(null);
    await SecureStore.deleteItemAsync("user");
    // IMPORTANT: Use router.replace (not push) to clear stack and prevent back navigation
    router.replace("/auth/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}