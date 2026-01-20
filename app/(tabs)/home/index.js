import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../lib/auth/auth-context';
import { useSQLite } from '../../../lib/sqlite-provider';
import { useSettings } from '../../../lib/settings-context';
import { computePRsForUser } from '../../../lib/prs-utils';
import Header from '../../../components/Header';
import Card from '../../../components/Card';

const SCREEN_WIDTH = Dimensions.get('window').width;

function ProgressRing({ value, colors }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.ringWrap}>
      <View style={[styles.ringOuter, { borderColor: colors.accent }]}>
        <View style={[styles.ringInner, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.ringPct, { color: colors.text }]}>{pct}%</Text>
          <Text style={[styles.ringLabel, { color: colors.muted }]}>Today</Text>
        </View>
      </View>
    </View>
  );
}

function MiniChart({ data, colors }) {
  if (!data || data.length === 0) {
    return <Text style={[styles.muted, { color: colors.muted }]}>No data</Text>;
  }
  const weights = data.map((d) => Number(d.weight) || 0);
  const max = Math.max(...weights, 1);
  const bars = weights.slice(-12); // Last 12 entries
  return (
    <View style={styles.miniChartWrap}>
      {bars.map((w, i) => {
        const h = Math.max(4, Math.round((w / max) * 60));
        return (
          <View key={i} style={styles.miniBarCol}>
            <View style={[styles.miniBar, { height: h, backgroundColor: colors.accent }]} />
          </View>
        );
      })}
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const db = useSQLite();
  const { colors } = useSettings();

  const [pr, setPr] = useState({ bench: '-', squat: '-', deadlift: '-' });
  const [weightLogs, setWeightLogs] = useState([]);
  const [dailyProgress, setDailyProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!db || !user?.id) return;
      try {
        // PRs
        const prs = await computePRsForUser(db, user.id);
        if (mounted) {
          const prData = {};
          prs.forEach(p => {
            if (p.exercise.toLowerCase().includes('bench')) prData.bench = p.max_weight;
            else if (p.exercise.toLowerCase().includes('squat')) prData.squat = p.max_weight;
            else if (p.exercise.toLowerCase().includes('deadlift')) prData.deadlift = p.max_weight;
          });
          setPr(prev => ({ ...prev, ...prData }));
        }

        // Weight logs
        const logs = await db.getAllAsync('SELECT ts, weight FROM bodyweight_logs WHERE user_id = ? ORDER BY ts DESC LIMIT 12', [user.id]);
        if (mounted) setWeightLogs(logs || []);

        // Daily progress: 100 if logged today, 0 otherwise
        const todayKey = new Date().toISOString().slice(0, 10);
        const hasToday = (logs || []).some(l => l.ts === todayKey);
        if (mounted) setDailyProgress(hasToday ? 100 : 0);
      } catch (e) {
        console.log('HOME LOAD ERR:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [db, user?.id]);

  const username = user?.username ?? 'Athlete';

  const quickActions = [
    { label: 'Start Workout', onPress: () => router.push('/workouts/create') },
    { label: 'Log Workout', onPress: () => router.push('/workouts/create') },
    { label: 'Profile', onPress: () => router.push('/profile') },
    { label: 'Settings', onPress: () => router.push('/settings') },
  ];

  const recentItems = (weightLogs || []).slice(0, 6).map((l) => ({
    id: `${l.ts}-${l.weight}`,
    title: `Bodyweight: ${l.weight}`,
    date: l.ts,
  }));

  if (loading) {
    return (
      <View style={[styles.page, { backgroundColor: colors.bg }]}>
        <Header title="Home" showBack={false} />
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Loading…</Text>
        </View>
      </View>
    );
  }

  const renderItem = () => (
    <View style={{ padding: 16 }}>
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Welcome back, <Text style={{ color: colors.accent }}>{username}</Text>
        </Text>
        <Text style={[styles.sub, { color: colors.muted }]}>Track your progress. Stay consistent.</Text>
      </View>

      {/* Progress Row */}
      <View style={styles.topRow}>
        <View style={styles.cardLeft}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today</Text>
          <ProgressRing value={dailyProgress} colors={colors} />
          <Text style={[styles.muted, { color: colors.muted }]}>
            {dailyProgress === 100 ? 'Done for today' : 'No activity yet today'}
          </Text>
        </View>

        <View style={styles.cardRight}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>PR Summary</Text>
          <View style={styles.prRow}>
            <View style={styles.prCol}>
              <Text style={[styles.prLabel, { color: colors.muted }]}>Bench</Text>
              <Text style={[styles.prValue, { color: colors.text }]}>{pr.bench}</Text>
            </View>
            <View style={styles.prCol}>
              <Text style={[styles.prLabel, { color: colors.muted }]}>Squat</Text>
              <Text style={[styles.prValue, { color: colors.text }]}>{pr.squat}</Text>
            </View>
            <View style={styles.prCol}>
              <Text style={[styles.prLabel, { color: colors.muted }]}>Deadlift</Text>
              <Text style={[styles.prValue, { color: colors.text }]}>{pr.deadlift}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <Card style={{ marginVertical: 8 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {quickActions.map((a, i) => (
            <TouchableOpacity key={i} style={[styles.actionBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]} onPress={a.onPress}>
              <Text style={{ color: colors.text }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Bodyweight */}
      <Card style={{ marginVertical: 8 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Bodyweight (recent)</Text>
        <MiniChart data={weightLogs} colors={colors} />
        <Text style={[styles.muted, { color: colors.muted }]}>
          Last {Math.min(12, weightLogs.length)} entries
        </Text>
      </Card>

      {/* Recent Activity */}
      <Card style={{ marginVertical: 8 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent</Text>
        {recentItems.length === 0 ? (
          <Text style={[styles.muted, { color: colors.muted }]}>No recent activity</Text>
        ) : (
          recentItems.map((item) => (
            <View key={item.id} style={styles.recentRow}>
              <Text style={[styles.recentTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.recentDate, { color: colors.muted }]}>{item.date}</Text>
            </View>
          ))
        )}
      </Card>

      {/* Motivation */}
      <Card style={{ marginVertical: 8 }}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 8 }]}>
          Keep the streak alive
        </Text>
        <Text style={[styles.muted, { color: colors.muted }]}>
          Consistency beats intensity. Log at least one entry per day to maintain your streak.
        </Text>
      </Card>

      <View style={{ height: 40 }} />
    </View>
  );

  return (
    <View style={[styles.page, { backgroundColor: colors.bg }]}>
      <Header title="Home" showBack={false} />
      <FlatList
        data={[{ key: 'home' }]}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', height: 200 },
  greetingRow: { paddingHorizontal: 8, marginTop: 6 },
  greeting: { fontSize: 18, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  cardLeft: { width: SCREEN_WIDTH * 0.4, alignItems: 'center' },
  cardRight: { width: SCREEN_WIDTH * 0.54, paddingLeft: 8 },
  sectionTitle: { fontWeight: '700', marginBottom: 6 },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  ringOuter: { width: 90, height: 90, borderRadius: 45, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontSize: 18, fontWeight: '700' },
  ringLabel: { fontSize: 12 },
  prRow: { flexDirection: 'row', justifyContent: 'space-between' },
  prCol: { alignItems: 'center', flex: 1 },
  prLabel: { fontSize: 12 },
  prValue: { fontWeight: '700', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between', marginTop: 8 },
  actionBtn: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  miniChartWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 70, marginVertical: 8 },
  miniBarCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  miniBar: { width: 6, borderRadius: 3, marginHorizontal: 1 },
  muted: { color: '#666' },
  recentRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  recentTitle: { fontSize: 13 },
  recentDate: { fontSize: 11, marginTop: 2 },
});
