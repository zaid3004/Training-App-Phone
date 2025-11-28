// app/(tabs)/workouts/[id].js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../../lib/settings-context";
import { useSQLite } from "../../../lib/sqlite-provider";
import { useAuth } from "../../../lib/auth/auth-context";

export default function WorkoutDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors } = useSettings();
  const db = useSQLite();
  const { user } = useAuth();

  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // For active workout session
  const [isActive, setIsActive] = useState(false);
  const [workoutSets, setWorkoutSets] = useState([]);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    loadWorkout();
  }, [id]);

  async function loadWorkout() {
    if (!user?.id || !id) return;

    try {
      const row = await db.getFirstAsync(
        "SELECT * FROM workouts WHERE id = ? AND user_id = ?",
        [id, user.id]
      );

      if (row) {
        setWorkout(row);
        try {
          const exs = JSON.parse(row.exercises || "[]");
          setExercises(exs);
          
          // Initialize workout sets for tracking
          const initialSets = exs.flatMap((ex) =>
            Array.from({ length: ex.sets }, (_, i) => ({
              exerciseName: ex.name,
              setNumber: i + 1,
              targetReps: ex.reps,
              reps: "",
              weight: "",
              completed: false,
            }))
          );
          setWorkoutSets(initialSets);
        } catch (e) {
          console.log("Parse error:", e);
        }
      }
    } catch (e) {
      console.log("Load workout error:", e);
    } finally {
      setLoading(false);
    }
  }

  function startWorkout() {
    setIsActive(true);
    setStartTime(Date.now());
  }

  function updateSet(index, field, value) {
    const updated = [...workoutSets];
    updated[index][field] = value;
    setWorkoutSets(updated);
  }

  function toggleSetCompleted(index) {
    const updated = [...workoutSets];
    updated[index].completed = !updated[index].completed;
    setWorkoutSets(updated);
  }

  async function finishWorkout() {
    const completedSets = workoutSets.filter((s) => s.completed);
    
    if (completedSets.length === 0) {
      Alert.alert("No sets completed", "Please complete at least one set before finishing.");
      return;
    }

    try {
      const logId = Date.now().toString() + Math.random().toString(36).slice(2);
      const completedAt = new Date().toISOString();
      const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

      // Save workout log
      await db.execAsync(
        `INSERT INTO workout_logs (id, user_id, workout_id, completed_at, duration, notes)
         VALUES ('${logId}', '${user.id}', '${id}', '${completedAt}', ${duration}, '')`
      );

      // Save individual sets
      for (const set of completedSets) {
        const setId = Date.now().toString() + Math.random().toString(36).slice(2);
        const reps = parseInt(set.reps) || 0;
        const weight = parseFloat(set.weight) || 0;

        await db.execAsync(
          `INSERT INTO workout_sets (id, workout_log_id, exercise_name, set_number, reps, weight, completed)
           VALUES ('${setId}', '${logId}', '${set.exerciseName.replace(/'/g, "''")}', 
                   ${set.setNumber}, ${reps}, ${weight}, 1)`
        );
      }

      Alert.alert("Workout Complete! 💪", `You completed ${completedSets.length} sets!`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.log("Save workout log error:", e);
      Alert.alert("Error", "Failed to save workout");
    }
  }

  function cancelWorkout() {
    Alert.alert(
      "Cancel Workout",
      "Are you sure? Your progress will be lost.",
      [
        { text: "Continue Workout", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: () => {
            setIsActive(false);
            setStartTime(null);
            loadWorkout(); // Reset sets
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.centered}>
          <Text style={[styles.text, { color: colors.text }]}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.centered}>
          <Text style={[styles.text, { color: colors.text }]}>Workout not found</Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.accent }]}
            onPress={() => router.back()}
          >
            <Text style={styles.btnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{workout.name}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {workout.description ? (
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.descText, { color: colors.muted }]}>{workout.description}</Text>
          </View>
        ) : null}

        {!isActive ? (
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Exercises ({exercises.length})
            </Text>
            {exercises.map((ex, idx) => (
              <View
                key={idx}
                style={[styles.exercisePreview, { backgroundColor: colors.bg, borderColor: colors.border }]}
              >
                <Ionicons name="fitness-outline" size={20} color={colors.accent} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>{ex.name}</Text>
                  <Text style={[styles.exerciseDetail, { color: colors.muted }]}>
                    {ex.sets} sets × {ex.reps} reps
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: colors.accent }]}
              onPress={startWorkout}
            >
              <Ionicons name="play" size={20} color="#000" />
              <Text style={styles.startBtnText}>Start Workout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {exercises.map((ex, exIdx) => {
              const exerciseSets = workoutSets.filter((s) => s.exerciseName === ex.name);
              return (
                <View
                  key={exIdx}
                  style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                >
                  <Text style={[styles.exerciseTitle, { color: colors.text }]}>{ex.name}</Text>
                  
                  {exerciseSets.map((set, setIdx) => {
                    const globalIndex = workoutSets.findIndex(
                      (s) => s.exerciseName === ex.name && s.setNumber === set.setNumber
                    );
                    return (
                      <View
                        key={setIdx}
                        style={[
                          styles.setRow,
                          {
                            backgroundColor: set.completed ? colors.accent + "20" : colors.bg,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View style={styles.setInfo}>
                          <Text style={[styles.setLabel, { color: colors.text }]}>
                            Set {set.setNumber}
                          </Text>
                        </View>

                        <View style={styles.setInputs}>
                          <TextInput
                            style={[styles.setInput, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                            value={set.reps}
                            onChangeText={(v) => updateSet(globalIndex, "reps", v)}
                            placeholder={`${set.targetReps}`}
                            placeholderTextColor={colors.muted}
                            keyboardType="numeric"
                            editable={!set.completed}
                          />
                          <Text style={[styles.setInputLabel, { color: colors.muted }]}>reps</Text>

                          <TextInput
                            style={[styles.setInput, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                            value={set.weight}
                            onChangeText={(v) => updateSet(globalIndex, "weight", v)}
                            placeholder="0"
                            placeholderTextColor={colors.muted}
                            keyboardType="numeric"
                            editable={!set.completed}
                          />
                          <Text style={[styles.setInputLabel, { color: colors.muted }]}>kg</Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.checkBtn,
                            { borderColor: set.completed ? colors.accent : colors.border },
                          ]}
                          onPress={() => toggleSetCompleted(globalIndex)}
                        >
                          {set.completed && (
                            <Ionicons name="checkmark" size={20} color={colors.accent} />
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              );
            })}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                onPress={cancelWorkout}
              >
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.finishBtn, { backgroundColor: colors.accent }]}
                onPress={finishWorkout}
              >
                <Ionicons name="checkmark" size={20} color="#000" />
                <Text style={styles.finishBtnText}>Finish Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  descText: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  exercisePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "600",
  },
  exerciseDetail: {
    fontSize: 13,
    marginTop: 2,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  startBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  setInfo: {
    width: 60,
  },
  setLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  setInputs: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  setInput: {
    width: 60,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 14,
    textAlign: "center",
  },
  setInputLabel: {
    fontSize: 12,
  },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelBtnText: {
    fontWeight: "700",
    fontSize: 15,
  },
  finishBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  finishBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  btnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
});
