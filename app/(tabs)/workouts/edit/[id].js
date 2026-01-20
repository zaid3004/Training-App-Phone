// app/(tabs)/workouts/edit/[id].js
import React, { useState, useEffect } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../../../lib/settings-context";
import { useSQLite } from "../../../../lib/sqlite-provider";
import { useAuth } from "../../../../lib/auth/auth-context";
import ExercisePicker from "../../../../components/ExercisePicker";
import Header from "../../../../components/Header";

export default function EditWorkout() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors } = useSettings();
  const db = useSQLite();
  const { user } = useAuth();

  const [workoutName, setWorkoutName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState([{ exercise: null, sets: '', reps: '', weight: '' }]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkout();
  }, [id]);

  async function loadWorkout() {
    if (!id || !user?.id) return;

    try {
      const row = await db.getFirstAsync("SELECT * FROM workouts WHERE id = ? AND user_id = ?", [id, user.id]);
      if (row) {
        setWorkoutName(row.name || "");
        setDescription(row.description || "");
        const ex = JSON.parse(row.exercises || "[]");
        const formatted = ex.map(e => ({
          exercise: { id: e.id, name: e.name },
          sets: e.sets?.toString() || '',
          reps: e.reps?.toString() || '',
          weight: '' // weight not stored in template
        }));
        if (formatted.length > 0) setExercises(formatted);
      }
    } catch (e) {
      console.log("Load workout error:", e);
      Alert.alert("Error", "Could not load workout");
    } finally {
      setLoading(false);
    }
  }

  function addExercise() {
    setExercises([...exercises, { exercise: null, sets: '', reps: '', weight: '' }]);
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
    if (!user?.id) {
      Alert.alert("Error", "User not loaded");
      return;
    }

    try {
      setSaving(true);
      const exercisesArray = exercises.map(e => ({
        name: e.exercise.name,
        id: e.exercise.id,
        sets: Number(e.sets) || 1,
        reps: Number(e.reps) || null
      }));
      const exercisesJson = JSON.stringify(exercisesArray).replace(/'/g, "''");

      await db.execAsync(
        `UPDATE workouts SET name = '${workoutName.replace(/'/g, "''")}', description = '${description.replace(/'/g, "''")}', exercises = '${exercisesJson}' WHERE id = '${id}' AND user_id = '${user.id}'`
      );

      Alert.alert("Saved", "Workout updated successfully", [ { text: "OK", onPress: () => router.back() } ]);
    } catch (e) {
      console.log("Save workout error:", e);
      Alert.alert("Error", "Could not update workout");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <Header title="Edit Workout" showBack={true} />
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Edit Workout" showBack={true} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Workout Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="e.g. Push Day"
            placeholderTextColor={colors.muted}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Description</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
          />
        </View>

        {exercises.map((ex, index) => (
          <View key={index} style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.exerciseHeader}>
              <Text style={[styles.label, { color: colors.text }]}>Exercise {index + 1}</Text>
              {exercises.length > 1 && (
                <TouchableOpacity onPress={() => removeExercise(index)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={20} color="#ff6a6a" />
                </TouchableOpacity>
              )}
            </View>
            <ExercisePicker
              value={ex.exercise}
              onChange={(value) => updateExercise(index, 'exercise', value)}
              placeholder="Choose exercise"
            />
            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Sets</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
              value={ex.sets}
              onChangeText={(value) => updateExercise(index, 'sets', value)}
              placeholder="Number of sets"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
            />
            <Text style={[styles.label, { color: colors.text }]}>Reps</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
              value={ex.reps}
              onChangeText={(value) => updateExercise(index, 'reps', value)}
              placeholder="Reps"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
            />
          </View>
        ))}

        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={addExercise} activeOpacity={0.8}>
          <Ionicons name="add-outline" size={22} color="#000" />
          <Text style={[styles.addText, { color: colors.text }]}>Add Exercise</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={saveWorkout} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Update Workout'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, marginBottom: 8 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  removeBtn: { padding: 4 },
  addBtn: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  addText: { fontSize: 16, fontWeight: '700', marginLeft: 8 },
  saveBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#000', fontWeight: '700' },
});