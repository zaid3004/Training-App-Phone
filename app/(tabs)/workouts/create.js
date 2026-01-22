// app/(tabs)/workouts/create.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../../lib/settings-context";
import { useSQLite } from "../../../lib/sqlite-provider";
import { useAuth } from "../../../lib/auth/auth-context";
import ExercisePicker from "../../../components/ExercisePicker";
import Header from "../../../components/Header";
import { updatePRsAfterWorkout } from "../../../lib/prs-utils";

export default function CreateWorkout() {
  const router = useRouter();
  const { colors } = useSettings();
  const db = useSQLite();
  const { user } = useAuth();

  const [workoutName, setWorkoutName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState([{ exercise: null, sets: '', reps: '', weight: '' }]);
  const [saving, setSaving] = useState(false);
  const [openIndex, setOpenIndex] = useState(0); // only one open at a time

  function addExercise() {
    const next = [...exercises, { exercise: null, sets: '', reps: '', weight: '' }];
    setExercises(next);
    setOpenIndex(next.length - 1); // open the new one
  }

  function updateExercise(index, field, value) {
    setExercises(exercises.map((e, i) => i === index ? { ...e, [field]: value } : e));
  }

  function removeExercise(index) {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  }

  async function saveWorkout() {
    if (!workoutName.trim()) {
      Alert.alert("Required", "Please enter workout name");
      return;
    }
    if (!exercises.every(e => e.exercise?.name)) {
      Alert.alert("Required", "Please select exercise for all entries");
      return;
    }
    if (!user?.uid) {
      Alert.alert("Error", "User not loaded");
      return;
    }

    try {
      setSaving(true);
      const id = Date.now().toString();
      const createdAt = new Date().toISOString();
      const exercisesArray = exercises.map(e => ({
        name: e.exercise.name,
        id: e.exercise.id,
        sets: Number(e.sets) || 1,
        reps: Number(e.reps) || null
      }));
      const exercisesJson = JSON.stringify(exercisesArray).replace(/'/g, "''");

      await db.execAsync(
        `INSERT INTO workouts (id, user_id, name, description, exercises, created_at)
         VALUES ('${id}', '${user.uid}', '${workoutName.replace(/'/g, "''")}','${description.replace(/'/g, "''")}','${exercisesJson}','${createdAt}')`
      );

      // Log the workout as completed
      const workoutLogId = Date.now().toString();
       await db.execAsync(
        `INSERT INTO workout_logs (id, user_id, workout_id, completed_at, duration, notes)
         VALUES ('${workoutLogId}', '${user.uid}', '${id}', '${createdAt}', 0, '')`
      );

      // Insert completed sets
      let setIdCounter = 0;
      for (const ex of exercises) {
        const weightVal = Number(ex.weight) || 0;
        const repsVal = Number(ex.reps) || 0;
        for (let setNum = 1; setNum <= (Number(ex.sets) || 1); setNum++) {
          await db.execAsync(
            `INSERT INTO workout_sets (id, workout_log_id, exercise_name, set_number, reps, weight, completed)
             VALUES ('${Date.now() + ++setIdCounter}', '${workoutLogId}', '${ex.exercise.name.replace(/'/g, "''")}', ${setNum}, ${repsVal}, ${weightVal}, 1)`
          );
        }
      }

      // PR Sync after workout is saved (incremental)
      const entries = exercises.map(e => ({
        name: e.exercise.name,
        weight: Number(e.weight) || 0,
        reps: Number(e.reps) || null
      }));
      try {
        await updatePRsAfterWorkout(db, user.uid, id, entries);
      } catch (e) {
        console.log('PR sync after workout failed', e);
      }

      Alert.alert("Saved", "Workout created successfully", [ { text: "OK", onPress: () => router.push('/(tabs)/workouts') } ]);
    } catch (e) {
      console.log("Save workout error:", e);
      Alert.alert("Error", "Could not save workout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Create Workout" showBack={true} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Workout Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.accent, color: colors.text }]}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="e.g. Push Day"
            placeholderTextColor={colors.muted}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Description</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.accent, color: colors.text }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
          />
        </View>

        {exercises.map((ex, index) => {
          const isOpen = openIndex === index;
          const title = ex.exercise?.name ? ex.exercise.name : `Exercise ${index + 1}`;
          const summaryParts = [
            ex.sets ? `${ex.sets} sets` : null,
            ex.reps ? `${ex.reps} reps` : null,
            ex.weight ? `${ex.weight} kg` : null,
          ].filter(Boolean);

          const summary = summaryParts.length ? summaryParts.join(" • ") : "Tap to edit";

          return (
            <View key={index} style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              {/* DROPDOWN HEADER */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setOpenIndex(isOpen ? -1 : index)}
                style={styles.exerciseHeaderBtn}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text, marginBottom: 2 }]} numberOfLines={1}>
                    {title}
                  </Text>

                  {!isOpen && (
                    <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>
                      {summary}
                    </Text>
                  )}
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  {/* trash only when open */}
                  {exercises.length > 1 && isOpen && (
                    <TouchableOpacity onPress={() => removeExercise(index)} style={styles.removeBtn}>
                      <Ionicons name="trash-outline" size={20} color="#ff6a6a" />
                    </TouchableOpacity>
                  )}

                  <Ionicons
                    name={isOpen ? "chevron-up-outline" : "chevron-down-outline"}
                    size={20}
                    color={colors.muted}
                  />
                </View>
              </TouchableOpacity>

              {/* DROPDOWN CONTENT */}
              {isOpen && (
                <View style={{ marginTop: 8 }}>
                  <ExercisePicker
                    value={ex.exercise}
                    onChange={(value) => updateExercise(index, 'exercise', value)}
                    placeholder="Choose exercise"
                  />

                  <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Sets</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.accent, color: colors.text }]}
                    value={ex.sets}
                    onChangeText={(value) => updateExercise(index, 'sets', value)}
                    placeholder="Number of sets"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                  />

                  <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Reps</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.accent, color: colors.text }]}
                    value={ex.reps}
                    onChangeText={(value) => updateExercise(index, 'reps', value)}
                    placeholder="Reps"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                  />

                  <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Weight (kg)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.accent, color: colors.text }]}
                    value={ex.weight}
                    onChangeText={(value) => updateExercise(index, 'weight', value)}
                    placeholder="Weight"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                  />

                  {/* Optional: collapse button */}
                  <TouchableOpacity
                    onPress={() => setOpenIndex(-1)}
                    style={[styles.collapseBtn, { borderColor: colors.border }]}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: colors.muted, fontWeight: "700" }}>Collapse</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={addExercise} activeOpacity={0.8}>
          <Ionicons name="add-outline" size={22} color={colors.text} />
          <Text style={[styles.addText, { color: colors.text }]}>Add Exercise</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={saveWorkout} disabled={saving}>
          <Text style={[styles.saveBtnText, { color: colors.text }]}>{saving ? "Saving..." : "Save Workout"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  exerciseHeaderBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  removeBtn: { padding: 4 },
  collapseBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 8, alignItems: "center", borderWidth: 1 },
  addBtn: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  addText: { fontSize: 16, fontWeight: '700', marginLeft: 8 },
  saveBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#000', fontWeight: '700' },
});
