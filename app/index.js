// app/index.js
import { Redirect } from 'expo-router';
import SplashAnimation from './SplashAnimation';
import { useState } from 'react';
import { View } from 'react-native';
import { useSettings } from '../lib/settings-context';
import { useAuth } from '../lib/auth/auth-context';

export default function Index() {
  const { user, loading } = useAuth();
  const { colors, loading: settingsLoading } = useSettings();
  const [done, setDone] = useState(false);

  // Phase 5 splash: show while booting, then redirect to proper route
  if (!done) {
    return <SplashAnimation onDone={() => setDone(true)} />;
  }

  if (!user) return <Redirect href="/auth/login" />;
  return <Redirect href="/(tabs)/home" />;
}
