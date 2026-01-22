import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../../lib/settings-context';
import { useAuth } from '../../lib/auth/auth-context';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

function TabLayout() {
  const { colors } = useSettings();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  const screenOptions = {
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: {
      backgroundColor: colors.bg,
      borderTopColor: colors.border,
    },
    headerStyle: {
      backgroundColor: colors.bg,
    },
    headerTintColor: colors.text,
    headerTitleStyle: {
      fontWeight: 'bold',
      textTransform: 'capitalize',
      textAlign: 'center',
    },
  };

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workouts',
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default TabLayout;
