import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth/auth-context';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#2EF0BA" />
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