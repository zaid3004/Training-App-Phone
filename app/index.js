// app/index.js
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth/auth-context';
import { useSettings } from '../lib/settings-context';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();
  const { colors } = useSettings();

  // CRITICAL: Show loading spinner while checking auth
  // This prevents "unmatched route" bugs
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // If no user, go to login
  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  // If user exists, go to home tab
  return <Redirect href="/(tabs)/home" />;
}