// app/index.js
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth/auth-context';
import { useSettings } from '../lib/settings-context';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();
  const { colors } = useSettings();

  // Block navigation until auth and settings are ready to avoid routing hazards
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors?.bg }}>
        <ActivityIndicator size="large" color={colors?.accent} />
      </View>
    );
  }

  if (!user) return <Redirect href="/auth/login" />;

  return <Redirect href="/(tabs)/home" />;
}
