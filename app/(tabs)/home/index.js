//home/index.js 
import React, { use, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, ActivityIndicator, InteractionManager } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../lib/auth/auth-context';
import { useProfile } from '../../../lib/profile/profile-context';
import { useSQLite } from '../../../lib/sqlite-provider';
import { useSettings } from '../../../lib/settings-context';

import { computePRsForUser } from '../../../lib/prs-utils';
import { MOTIVATIONAL_QUOTES } from '../../../constants/motivationalQuotes';
import Header from '../../../components/Header';
import Card from '../../../components/Card';

const SCREEN_WIDTH = Dimensions.get('window').width;

function formatDateShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function computeChange(logs) {
  const list = (logs || [])
    .map(x => ({ ...x, weight: Number(x.weight) }))
    .filter(x => Number.isFinite(x.weight));

  if (list.length < 2) {
    return { pct: null, direction: "none", text: "Not enough data yet" };
  }

  // logs are DESC (newest first)
  const newest = list[0].weight;
  const oldest = list[list.length - 1].weight;

  if (!oldest || oldest === 0) {
    return { pct: null, direction: "none", text: "Not enough data yet" };
  }

  const pct = ((newest - oldest) / oldest) * 100;
  const abs = Math.abs(pct);

  if (abs < 0.05) {
    return { pct: 0, direction: "none", text: "No meaningful change" };
  }



  
  const direction = pct > 0 ? "up" : "down";
  return {
    pct,
    direction,
    text: `${direction === "up" ? "Up" : "Down"} ${abs.toFixed(1)}% in last ${list.length} logs`,
  };
}

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
  const { user } = useAuth();
  const { profileLoading, profile } = useProfile();
  const profileCompleted = profile?.profileCompleted === true;
  const db = useSQLite();
  const { colors } = useSettings();
  const params = useLocalSearchParams();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.displayName || 'Athlete');
  const [refreshKey, setRefreshKey] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [pr, setPr] = useState({ bench: '-', squat: '-', deadlift: '-' });
  const [weightLogs, setWeightLogs] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [dailyProgress, setDailyProgress] = useState(0);
  const [motivationalQuote, setMotivationalQuote] = useState('');

  // Set random motivational quote on mount
  useEffect(() => {
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    setMotivationalQuote(randomQuote);
  }, []);

  // Force reload when navigated with refresh param (e.g., from profile save)
  useEffect(() => {
    if (params.refresh) {
      setRefreshKey(prev => prev + 1);
    }
  }, [params.refresh]);



  // Profile gate: redirect to onboarding if not completed
  useEffect(() => {
    if (!profileLoading && !profileCompleted) {
      router.replace('/onboarding');
    }
  }, [profileLoading, profileCompleted, router]);

  // Failsafe: prevent infinite loading after 4 seconds
  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 4000);
    return () => clearTimeout(t);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setRefreshKey(prev => prev + 1);
      let mounted = true;

      // Defer heavy loading after first paint
      const task = InteractionManager.runAfterInteractions(async () => {
        console.time('home_load_total');
        if (!db || !user?.uid) {
          setPageLoading(false);
          return;
        }



        try {
          console.time('db_queries');
          const [stats, prs, logs, workouts] = await Promise.all([
            db.getFirstAsync('SELECT name, bench, squat, deadlift, bodyweight FROM user_stats WHERE user_id = ?', [user.uid]),
            computePRsForUser(db, user.uid),
            db.getAllAsync('SELECT ts, weight FROM bodyweight_logs WHERE user_id = ? ORDER BY ts DESC LIMIT 12', [user.uid]),
            db.getAllAsync(`
              SELECT wl.id, wl.completed_at, w.name, w.exercises
              FROM workout_logs wl
              JOIN workouts w ON wl.workout_id = w.id
              WHERE wl.user_id = ?
              ORDER BY wl.completed_at DESC
              LIMIT 3
             `, [user.uid])
          ]);
          console.timeEnd('db_queries');



          if (mounted) {
          // Display name
          const newDisplayName = stats?.name || user?.displayName || 'Athlete';
          setDisplayName(newDisplayName);

            // PRs
            let manualPrData = {};
            if (stats?.bench) manualPrData.bench = stats.bench;
            if (stats?.squat) manualPrData.squat = stats.squat;
            if (stats?.deadlift) manualPrData.deadlift = stats.deadlift;

            const prData = { ...manualPrData };
            prs.forEach(p => {
              if (p.exercise.toLowerCase().includes('bench') && !prData.bench) prData.bench = p.max_weight;
              else if (p.exercise.toLowerCase().includes('squat') && !prData.squat) prData.squat = p.max_weight;
              else if (p.exercise.toLowerCase().includes('deadlift') && !prData.deadlift) prData.deadlift = p.max_weight;
            });
          setPr(prData);

          // Weight logs and workouts
          const displayWeightLogs = (logs && logs.length > 0)
            ? logs
            : (stats?.bodyweight ? [{ ts: new Date().toISOString(), weight: stats.bodyweight }] : []);
          setWeightLogs(displayWeightLogs);
          setRecentWorkouts(workouts || []);

            // Progress calculation
            let progress = 0;
            if (workouts && workouts.length > 0) {
              const lastWorkout = workouts[0];
              let totalSets = 0;
              try {
                const ex = JSON.parse(lastWorkout.exercises);
                totalSets = ex.reduce((sum, e) => sum + (Number(e.sets) || 1), 0);
              } catch (e) {}
              // Note: Progress calculation moved to separate query if needed, but for simplicity, keep sequential
              const completedCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM workout_sets WHERE workout_log_id = ? AND completed = 1', [lastWorkout.id]);
              const completedSets = completedCount?.count || 0;
              progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
            }
            setDailyProgress(progress);
          }
        } catch (e) {
          // Silent error handling for production
        } finally {
          console.timeEnd('home_load_total');
          if (mounted) setPageLoading(false);
        }
      });

      return () => task.cancel();
    }, [db, user?.uid])
  );



  const quickActions = [
    { label: 'Log Workout', onPress: () => router.push('/workouts') },
    { label: 'Create Workout', onPress: () => router.push('/workouts/create') },
    { label: 'Personal Records', onPress: () => router.push('/profile') },
    { label: 'Edit Settings', onPress: () => router.push('/settings') },
  ];

  const recentItems = recentWorkouts.map((w) => ({
    id: w.id,
    title: w.name,
    date: w.completed_at,
  }));

  const last10 = (weightLogs || []).slice(0, 10); // logs are already DESC
  const currentWeight = last10?.[0]?.weight ? Number(last10[0].weight) : null;
  const change = computeChange(last10);

  if (profileLoading) {
    return (
      <View style={[styles.page, { backgroundColor: colors.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.text, marginTop: 7 }}>Setting up...</Text>
        </View>
      </View>
    );
  }

  if (pageLoading) {
    return (
      <View style={[styles.page, { backgroundColor: colors.bg }]}>
        <Header title="Home" showBack={false} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.text, marginTop: 7, marginBottom: 20 }}>Loading…</Text>
        </View>
      </View>
    );
  }

  const renderItem = () => (
    <View style={{ padding: 16 }}>
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Welcome back, <Text style={{ color: colors.accent }}>{displayName}</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>PR Summary (KGs)</Text>
          <View style={styles.prRow}>
            <View style={styles.prCol}>
              <Text style={[styles.prLabel, { color: colors.accent }]}>Bench</Text>
              <Text style={[styles.prValue, { color: colors.text }]}>{pr.bench}</Text>
            </View>
            <View style={styles.prCol}>
              <Text style={[styles.prLabel, { color: colors.accent }]}>Squat</Text>
              <Text style={[styles.prValue, { color: colors.text }]}>{pr.squat}</Text>
            </View>
            <View style={styles.prCol}>
              <Text style={[styles.prLabel, { color: colors.accent }]}>Deadlift</Text>
              <Text style={[styles.prValue, { color: colors.text }]}>{pr.deadlift}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <Card style={{ marginVertical: 8 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <View style={styles.actionsRow}>
            {quickActions.slice(0, 2).map((a, i) => (
              <TouchableOpacity key={i} style={[styles.actionBtn, { backgroundColor: colors.cardBg, borderColor: colors.accent }]} onPress={a.onPress}>
                <Text style={{ color: colors.text }}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actionsRow}>
            {quickActions.slice(2, 4).map((a, i) => (
              <TouchableOpacity key={i + 2} style={[styles.actionBtn, { backgroundColor: colors.cardBg, borderColor: colors.accent }]} onPress={a.onPress}>
                <Text style={{ color: colors.text }}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>

      {/* Bodyweight */}
      <Card style={{ marginVertical: 8 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Bodyweight <Text style={{ color: colors.accent }}>(recent)</Text>
        </Text>

        {/* Current weight number */}
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800" }}>
            {currentWeight != null ? currentWeight.toFixed(1) : "--"}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14 }}>kg</Text>

          {/* % change badge */}
          {change.pct != null && (
            <View
              style={{
                marginLeft: 10,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.bg,
              }}
            >
              <Text
                style={{
                  color:
                    change.direction === "up"
                      ? "#FF6A6A"
                      : change.direction === "down"
                      ? "#2EF0BA"
                      : colors.muted,
                  fontWeight: "800",
                  fontSize: 12,
                }}
              >
                {change.direction === "up" ? "▲" : change.direction === "down" ? "▼" : "•"}{" "}
                {Math.abs(change.pct).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.muted, { color: colors.muted, marginTop: 6 }]}>
          {change.text}
        </Text>

        {/* Chart */}
        <MiniChart data={last10} colors={colors} />

        <Text style={[styles.muted, { color: colors.muted }]}>
          Last {Math.min(10, last10.length)} entries
        </Text>

        {/* Last 10 logs list */}
        <View style={{ marginTop: 10 }}>
          {last10.length === 0 ? (
            <Text style={[styles.muted, { color: colors.muted }]}>No data</Text>
          ) : (
            last10.map((l, i) => (
              <View
                key={`${l.ts}-${i}`}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 6,
                  borderBottomWidth: i === last10.length - 1 ? 0 : 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {formatDateShort(l.ts)}
                </Text>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>
                  {Number(l.weight).toFixed(1)} kg
                </Text>
              </View>
            ))
          )}
        </View>
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
          Daily Motivation
        </Text>
        <Text style={[styles.muted, { color: colors.muted, fontStyle: 'italic' }]}>
          {motivationalQuote || 'Loading...'}
        </Text>
      </Card>

      <View style={{ height: 40 }} />
    </View>
  );

  return (
    <View style={[styles.page, { backgroundColor: colors.bg }]}>
      <FlatList
        data={[{ key: 'home' }]}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        extraData={[displayName, refreshKey]}
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
  actionsContainer: { marginTop: 8 },
  actionsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 8 },
  actionBtn: { paddingVertical: 15, paddingHorizontal: 5, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, minWidth: 85, flex: 1},
  miniChartWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 70, marginVertical: 8 },
  miniBarCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  miniBar: { width: 6, borderRadius: 3, marginHorizontal: 1 },
  muted: { color: '#666' },
  recentRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  recentTitle: { fontSize: 13 },
  recentDate: { fontSize: 11, marginTop: 2 },
});
