import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../lib/auth/auth-context';
import { useSettings } from '../../../lib/settings-context';
import Header from '../../../components/Header';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useSettings();

  // Simple placeholder home with bubbly styling; will be replaced with full phase 6+ home soon
  if (!user) {
    return (
      <ScrollView contentContainerStyle={styles.page} style={{ backgroundColor: colors?.bg }}>
        <View style={styles.center}>
          <Text style={{ color: colors?.text ?? '#000' }}>Loading…</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page} style={{ backgroundColor: colors?.bg }}>
      <Header title="Home" showBack={false} />
      <View style={[styles.card, { backgroundColor: colors?.cardBg, borderColor: colors?.border }]}>
        <Text style={{ color: colors?.text ?? '#000' }}>Welcome back, {user?.username ?? 'Athlete'}!</Text>
        <Text style={{ color: colors?.muted ?? '#666' }}>Your dashboard is under construction in this phase.</Text>
      </View>

      <TouchableOpacity onPress={() => router.push('/workouts/create')} style={[styles.cardBtn, { backgroundColor: colors?.cardBg, borderColor: colors?.border }]}>
        <Text style={{ color: colors?.text }}>Create Workout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', height: 200 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  link: { padding: 6 },
  card: { padding: 16, borderRadius: 8, borderWidth: 1, marginTop: 8 },
  cardBtn: { padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, marginTop: 8 },
});
