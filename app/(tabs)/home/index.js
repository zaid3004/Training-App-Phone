//home/index.js 
import React, { use, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, ActivityIndicator, InteractionManager } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../lib/auth/auth-context';
import { useSQLite } from '../../../lib/sqlite-provider';
import { useSettings } from '../../../lib/settings-context';
import { getDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db as firestoreDb } from '../../../lib/firebase';
import { setUserDocWithRetry } from '../../../lib/auth/auth-context';
import { computePRsForUser } from '../../../lib/prs-utils';
import { subscribeProfileUpdate } from '../../../lib/event-bus';
import { MOTIVATIONAL_QUOTES } from '../../../constants/motivationalQuotes';
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

// Lightweight bar chart for last weight entries (last 10)
function WeightBarChart({ data, colors }) {
  if (!data || data.length === 0) {
    return <Text style={[styles.muted, { color: colors.muted }]}>No data</Text>;
  }
  const weights = data.map((d) => Number(d.weight) || 0);
  const max = Math.max(...weights, 1);
  return (
    <View style={styles.weightBarRow}>
      {weights.map((w, idx) => {
        const h = Math.max(6, Math.round((w / max) * 60));
        return (
          <View key={idx} style={styles.weightBarCol}>
            <View style={[styles.weightBar, { height: h, backgroundColor: colors.accent }]} />
          </View>
        );
      })}
    </View>
  );
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const db = useSQLite();
  const { colors } = useSettings();
  const params = useLocalSearchParams();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.displayName || 'Athlete');
  const [bodyweight, setBodyweight] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [pr, setPr] = useState({ bench: '-', squat: '-', deadlift: '-' });
  const [weightLogs, setWeightLogs] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [dailyProgress, setDailyProgress] = useState(0);
  const [motivationalQuote, setMotivationalQuote] = useState('');
  // Local bodyweight display value (latest from profile updates)
  // Reuse existing bodyweight state when available

  // Set random motivational quote on mount
  useEffect(() => {
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    setMotivationalQuote(randomQuote);
  }, []);

  // Listen for profile updates to reflect changes instantly on Home
  useEffect(() => {
    const unsubscribe = subscribeProfileUpdate((update) => {
      if (!update) return;
      if (update.bodyweight !== undefined) {
        setBodyweight(update.bodyweight);
      }
      if (update.bench !== undefined || update.squat !== undefined || update.deadlift !== undefined) {
        setPr((p) => ({
          bench: update.bench ?? p.bench,
          squat: update.squat ?? p.squat,
          deadlift: update.deadlift ?? p.deadlift,
        }));
      }
    });
    return unsubscribe;
  }, []);

  // Force reload when navigated with refresh param (e.g., from profile save)
  useEffect(() => {
    if (params.refresh) {
      setRefreshKey(prev => prev + 1);
    }
  }, [params.refresh]);

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

        // Firestore user doc check moved into parallel flow below
        const firestoreCheckP = (async () => {
          console.time('firestore_check');
          try {
            const userDoc = await getDoc(doc(firestoreDb, 'users', user.uid));
            if (!userDoc.exists()) {
              await setUserDocWithRetry(firestoreDb, user.uid, {
                email: user.email,
                username: user.displayName || 'User',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          } catch (e) {
            // Silent fail for Firestore issues
          }
          console.timeEnd('firestore_check');
        })();

        try {
          console.time('db_queries');
          // Run in parallel and gracefully handle potential failures
          const results = await Promise.allSettled([
            firestoreCheckP,
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

          const stats = results[1].status === 'fulfilled' ? results[1].value : null;
          const prs = results[2].status === 'fulfilled' ? results[2].value : [];
          const logs = results[3].status === 'fulfilled' ? results[3].value : [];
          const workouts = results[4].status === 'fulfilled' ? results[4].value : [];
          console.timeEnd('db_queries');



          if (mounted) {
            // Display name
            const newDisplayName = stats?.name || user?.displayName || 'Athlete';
            setDisplayName(newDisplayName);
            // Bodyweight for Home display (prefer DB value; fall back to null)
            setBodyweight(stats?.bodyweight ?? null);

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
          setWeightLogs(logs || []);
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
        {/* Greeting subtitle removed per design request; bodyweight display moved to bodyweight graph */}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>PR Summary (KG's)</Text>
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
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Bodyweight <Text style={{ color: colors.accent }}>(recent)</Text></Text>
      <WeightBarChart data={weightLogs.slice(-10)} colors={colors} />
      <Text style={[styles.muted, { color: colors.muted }]}>Last {Math.min(10, weightLogs.length)} entries</Text>
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
  weightBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 70,
    paddingHorizontal: 6,
  },
  weightBarCol: {
    flex: 1,
    alignItems: 'center',
  },
  weightBar: {
    width: 8,
    borderRadius: 4,
  },
  bodyweight: {
    fontSize: 14,
    marginTop: 6,
  },
  recentRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  recentTitle: { fontSize: 13 },
  recentDate: { fontSize: 11, marginTop: 2 },
});
