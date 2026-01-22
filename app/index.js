// app/index.js
import SplashAnimation from './SplashAnimation';
import { useState } from 'react';
import { View, Text } from 'react-native';
import { Redirect } from 'expo-router';
import { useSettings } from '../lib/settings-context';
import { useAuth } from '../lib/auth/auth-context';

export default function Index() {
  const { user, loading } = useAuth();
  const { colors } = useSettings();
  const [done, setDone] = useState(false);

  if (!done) {
    return <SplashAnimation onDone={() => setDone(true)} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  if (!user) return <Redirect href="/auth/login" />;
  return <Redirect href="/(tabs)/home" />;
}
