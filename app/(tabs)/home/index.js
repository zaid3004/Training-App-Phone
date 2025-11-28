// app/(tabs)/home/index.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../../../lib/auth/auth-context";
import { useSQLite } from "../../../lib/sqlite-provider";
import { useSettings } from "../../../lib/settings-context";
import UserHeader from "../../../components/UserHeader";

const SCREEN_WIDTH = Dimensions.get("window").width;

function SmallCard({ children, style, colors }) {
  return <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }, style]}>{children}</View>;
}

function ActionButton({ icon, label, onPress, colors }) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.cardBg }]} onPress={onPress}>
      <View style={[styles.actionIconWrap, { backgroundColor: colors.accent }]}>
        <Ionicons name={icon} size={22} color="#000" />
      </View>
      <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ProgressRing({ percent = 0, label = "Daily", colors }) {
  const display = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <View style={styles.ringWrap}>
      <View style={[styles.ringOuter, { borderColor: colors.accent }]}>
        <View style={[styles.ringInner, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.ringPct, { color: colors.text }]}>{display}%</Text>
          <Text style={[styles.ringLabel, { color: colors.muted }]}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

function MiniWeightChart({ data = [], colors }) {
  if (!data || data.length === 0) {
    return <Text style={[styles.muted, { color: colors.muted }]}>No data</Text>;
  }

  const weights = data.map((d) => Number(d.weight) || 0);
  const max = Math.max(...weights, 1);
  const arr = [...weights].reverse();

  return (
    <View style={styles.miniChartWrap}>
      {arr.map((w, i) => {
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

  const [pr, setPr] = useState({ bench: null, squat: null, deadlift: null });
  const [weightLogs, setWeightLogs] = useState([]);
  const [streak, setStreak] = useState(0);
  const [dailyProgress, setDailyProgress] = useState(0);

  if (!user || !user.id) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading dashboard…</Text>
      </View>
    );
  }

  // Reload data whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      async function load() {
        try {
          const row = await db.getFirstAsync(
            "SELECT bench, squat, deadlift FROM user_stats WHERE user_id = ?",
            [user.id]
          );

          if (mounted) {
            setPr({
              bench: row?.bench ?? "-",
              squat: row?.squat ?? "-",
              deadlift: row?.deadlift ?? "-",
            });
          }

          const logs = await db.getAllAsync(
            "SELECT ts, weight FROM bodyweight_logs WHERE user_id = ? ORDER BY ts DESC LIMIT 12",
            [user.id]
          );

          if (mounted) setWeightLogs(logs || []);

          if (logs && logs.length > 0) {
            const dates = logs.map((l) => l.ts);
            const uniq = [...new Set(dates)];

            let s = 0;
            const today = new Date();
            for (let d = 0; ; d++) {
              const cur = new Date(today);
              cur.setDate(today.getDate() - d);
              const key = cur.toISOString().slice(0, 10);
              if (uniq.includes(key)) s++;
              else break;
              if (d > 365) break;
            }
            if (mounted) setStreak(s);
          }

          const todayKey = new Date().toISOString().slice(0, 10);
          const hasToday = (logs || []).some((r) => r.ts === todayKey);
          if (mounted) setDailyProgress(hasToday ? 100 : 0);
        } catch (e) {
          console.log("HOME LOAD ERR:", e);
        }
      }

      load();
      return () => {
        mounted = false;
      };
    }, [db, user.id])
  );

  const username = user?.username ?? "Soldier";

  const quickActions = useMemo(
    () => [
      { icon: "play", label: "Start", onPress: () => router.push("/workouts/create") },
      { icon: "add", label: "Log", onPress: () => router.push("/workouts/create") },
      { icon: "person", label: "Profile", onPress: () => router.push("/profile") },
      { icon: "bar-chart", label: "PRs", onPress: () => router.push("/profile") },
    ],
    [router]
  );

  const recentItems = (weightLogs || []).slice(0, 6).map((l) => ({
    id: `${l.ts}-${l.weight}`,
    title: `Bodyweight: ${l.weight}`,
    date: l.ts,
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <UserHeader title="PRVault" showSettings={true} />
      <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Welcome back soldier; <Text style={[styles.username, { color: colors.accent }]}>{username}</Text>
            </Text>
            <Text style={[styles.sub, { color: colors.muted }]}>Track your progress. Stay consistent.</Text>
          </View>
        </View>

        {/* PROGRESS ROW */}
        <View style={styles.topRow}>
          <SmallCard colors={colors} style={{ width: SCREEN_WIDTH * 0.42 }}>
            <ProgressRing percent={dailyProgress} label="Today" colors={colors} />
          </SmallCard>

          <View style={{ width: SCREEN_WIDTH * 0.54, paddingLeft: 12 }}>
            <SmallCard colors={colors} style={{ marginBottom: 12 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Streak</Text>
              <Text style={[styles.streak, { color: colors.accent }]}>{streak} days</Text>
              <Text style={[styles.muted, { color: colors.muted }]}>Days in a row with a log</Text>
            </SmallCard>

            <SmallCard colors={colors}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>PR Summary</Text>
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
            </SmallCard>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={{ paddingHorizontal: 18, marginTop: 10 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Workout Actions</Text>

          <View style={styles.actionsRow}>
            {quickActions.map((a, idx) => (
              <ActionButton key={idx} icon={a.icon} label={a.label} onPress={a.onPress} colors={colors} />
            ))}
          </View>
        </View>

        {/* BODYWEIGHT + RECENT */}
        <View style={{ paddingHorizontal: 18, marginTop: 12 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Bodyweight (recent)</Text>
              <SmallCard colors={colors}>
                <MiniWeightChart data={weightLogs} colors={colors} />
                <View style={{ height: 10 }} />
                <Text style={[styles.muted, { color: colors.muted }]}>
                  Last {Math.min(12, weightLogs.length)} entries
                </Text>
              </SmallCard>
            </View>

            <View style={{ width: 150 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent</Text>
              <SmallCard colors={colors} style={{ paddingVertical: 8 }}>
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
              </SmallCard>
            </View>
          </View>
        </View>

        {/* MOTIVATION */}
        <View style={{ padding: 18, marginTop: 8 }}>
          <SmallCard colors={colors}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 8 }]}>
              Keep the streak alive
            </Text>
            <Text style={[styles.muted, { color: colors.muted }]}>
              Consistency beats intensity. Log at least one entry per day to maintain
              your streak.
            </Text>
          </SmallCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },

  headerContainer: {
    width: "100%",
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },

  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {},

  header: {
    padding: 18,
    paddingTop: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  greeting: { fontSize: 16, marginBottom: 4 },
  username: { fontWeight: "700" },
  sub: { fontSize: 12 },

  topRow: { flexDirection: "row", paddingHorizontal: 18, marginBottom: 12 },

  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },

  ringWrap: { alignItems: "center", justifyContent: "center" },
  ringOuter: {
    width: 110,
    height: 110,
    borderRadius: 110 / 2,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 86,
    height: 86,
    borderRadius: 86 / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ringPct: { fontSize: 22, fontWeight: "700" },
  ringLabel: { fontSize: 12 },

  cardTitle: { fontWeight: "700", marginBottom: 6 },
  streak: { fontSize: 24, fontWeight: "800" },

  prRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  prCol: { alignItems: "center", flex: 1 },
  prLabel: { fontSize: 12 },
  prValue: { fontWeight: "700", marginTop: 4 },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    gap: 10,
  },

  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  actionIconWrap: {
    padding: 8,
    borderRadius: 10,
    marginBottom: 6,
  },

  actionLabel: {
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },

  sectionTitle: { fontWeight: "700", marginBottom: 8, paddingLeft: 2 },

  miniChartWrap: { flexDirection: "row", alignItems: "flex-end", height: 70 },
  miniBarCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  miniBar: { width: 6, borderRadius: 6 },

  muted: {},

  recentRow: { paddingVertical: 6, borderBottomWidth: 1, borderColor: "#0b0b0b" },
  recentTitle: { fontSize: 13 },
  recentDate: { fontSize: 11 },
});
