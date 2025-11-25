import { Stack } from "expo-router";
import { SQLiteProvider } from "../lib/sqlite-provider";
import { AuthProvider } from "../lib/auth/auth-context";

export default function RootLayout() {
  return (
    <SQLiteProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SQLiteProvider>
  );
}
