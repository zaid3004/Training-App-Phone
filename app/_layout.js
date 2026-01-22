// app/_layout.js
import { Stack } from "expo-router";
import { SQLiteProvider } from "../lib/sqlite-provider";
import { AuthProvider } from "../lib/auth/auth-context";
import { SettingsProvider } from "../lib/settings-context";
import * as Notifications from "expo-notifications";

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  return (
    <SQLiteProvider>
      <AuthProvider>
        <SettingsProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </SettingsProvider>
      </AuthProvider>
    </SQLiteProvider>
  );
}
