// app/_layout.js
import { Stack } from "expo-router";
import { SQLiteProvider } from "../lib/sqlite-provider";
import { AuthProvider } from "../lib/auth/auth-context";
import { SettingsProvider } from "../lib/settings-context";

export default function RootLayout() {
  return (
    <SQLiteProvider>
      <AuthProvider>
        <SettingsProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="auth/register" />
          </Stack>
        </SettingsProvider>
      </AuthProvider>
    </SQLiteProvider>
  );
}
