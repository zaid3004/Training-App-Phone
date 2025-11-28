import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../../lib/settings-context";
import { useSQLite } from "../../../lib/sqlite-provider";
import { useAuth } from "../../../lib/auth/auth-context";
import UserHeader from "../../../components/UserHeader";

export default function Workouts() {
  const router = useRouter();
  const { colors } = useSettings();
  const db = useSQLite();
  const { user } = useAuth();

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reload workouts whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadWorkouts();
    }, [user?.id, db])
  );

  async function loadWorkouts() {
    if (!user?.id) return;

    try {
      const rows = await db.getAllAsync(
        "SELECT * FROM workouts WHERE user_id = ? ORDER BY created_at DESC",
        [user.id]
      );
      setWorkouts(rows || []);
    } catch (e) {
      console.log("Load workouts error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function deleteWorkout(id) {
    Alert.alert(
      "Delete Workout",
      "Are you sure you want to delete this workout template?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await db.execAsync(`DELETE FROM workouts WHERE id = '${id}'`);
              await loadWorkouts();
            } catch (e) {
              console.log("Delete error:", e);
              Alert.alert("Error", "Failed to delete workout");
            }
          },
        },
      ]
    );
  }

  function renderWorkout({ item }) {
    let exercises = [];
    try {
      exercises = JSON.parse(item.exercises || "[]");
    } catch (e) {}

    return (
      <TouchableOpacity
        style={[styles.workoutCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
        onPress={() => router.push(`/workouts/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.workoutHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.workoutName, { color: colors.text }]}>{item.name}</Text>
            {item.description ? (
              <Text style={[styles.workoutDesc, { color: colors.muted }]}>
                {item.description}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => deleteWorkout(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color="#ff6a6a" />
          </TouchableOpacity>
        </View>

        <View style={styles.exerciseList}>
          {exercises.slice(0, 3).map((ex, idx) => (
            <View key={idx} style={styles.exerciseRow}>
              <Ionicons name="fitness-outline" size={16} color={colors.accent} />
              <Text style={[styles.exerciseText, { color: colors.text }]}>
                {ex.name} • {ex.sets}x{ex.reps}
              </Text>
            </View>
          ))}
          {exercises.length > 3 && (
            <Text style={[styles.moreText, { color: colors.muted }]}>
              +{exercises.length - 3} more exercises
            </Text>
          )}
        </View>

        <View style={styles.workoutFooter}>
          <Text style={[styles.exerciseCount, { color: colors.muted }]}>
            {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <UserHeader title="Workouts" showSettings={false} />
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Plan, log, and track your sessions
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.accent }]}
          onPress={() => router.push("/workouts/create")}
          activeOpacity={0.8}
        >
          <Ionicons name="add-outline" size={22} color="#000" />
          <Text style={styles.createText}>Create Workout</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.centered}>
            <Text style={[styles.placeholderText, { color: colors.muted }]}>
              Loading workouts...
            </Text>
          </View>
        ) : workouts.length === 0 ? (
          <View
            style={[
              styles.placeholder,
              { backgroundColor: colors.cardBg, borderColor: colors.border },
            ]}
          >
            <Ionicons name="barbell-outline" size={48} color={colors.muted} />
            <Text style={[styles.placeholderText, { color: colors.muted }]}>
              No workouts yet. Create one to get started!
            </Text>
          </View>
        ) : (
          <FlatList
            data={workouts}
            keyExtractor={(item) => item.id}
            renderItem={renderWorkout}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  createBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  createText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    flex: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    padding: 40,
  },
  placeholderText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: "center",
  },
  workoutCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  workoutDesc: {
    fontSize: 13,
  },
  exerciseList: {
    marginBottom: 12,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  exerciseText: {
    fontSize: 14,
  },
  moreText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  workoutFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  exerciseCount: {
    fontSize: 13,
  },
});
