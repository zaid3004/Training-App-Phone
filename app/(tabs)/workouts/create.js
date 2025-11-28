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

export default function CreateWorkout() {
  const router = useRouter();
  const { colors } = useSettings();
  const db = useSQLite();
  const { user } = useAuth();

  const [workoutName, setWorkoutName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState([]);
  const [saving, setSaving] = useState(false);

  // Modal state for adding exercise
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");

  function addExercise() {
    if (!exerciseName.trim()) {
      Alert.alert("Required", "Please enter exercise name");
      return;
    }

    const setsNum = parseInt(sets) || 3;
    const repsNum = parseInt(reps) || 10;

    setExercises([...exercises, { name: exerciseName, sets: setsNum, reps: repsNum }]);
    setExerciseName("");
    setSets("3");
    setReps("10");
    setShowExerciseForm(false);
  }

  function removeExercise(index) {
    setExercises(exercises.filter((_, i) => i !== index));
  }

  async function saveWorkout() {
    if (!workoutName.trim()) {
      Alert.alert("Required", "Please enter workout name");
      return;
    }

    if (exercises.length === 0) {
      Alert.alert("Required", "Please add at least one exercise");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not loaded");
      return;
    }

    try {
      setSaving(true);
      const id = Date.now().toString() + Math.random().toString(36).slice(2);
      const createdAt = new Date().toISOString();
      const exercisesJson = JSON.stringify(exercises);

      await db.execAsync(
        `INSERT INTO workouts (id, user_id, name, description, exercises, created_at)
         VALUES ('${id}', '${user.id}', '${workoutName.replace(/'/g, "''")}', 
                 '${description.replace(/'/g, "''")}', '${exercisesJson.replace(/'/g, "''")}', '${createdAt}')`
      );

      Alert.alert("Success", "Workout created!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.log("Save workout error:", e);
      Alert.alert("Error", "Failed to save workout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Workout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Workout Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="e.g. Push Day"
            placeholderTextColor={colors.muted}
          />

          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Exercises ({exercises.length})
            </Text>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.accent }]}
              onPress={() => setShowExerciseForm(true)}
            >
              <Ionicons name="add" size={20} color="#000" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {exercises.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No exercises added yet
            </Text>
          ) : (
            exercises.map((ex, idx) => (
              <View
                key={idx}
                style={[styles.exerciseItem, { backgroundColor: colors.bg, borderColor: colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>{ex.name}</Text>
                  <Text style={[styles.exerciseDetail, { color: colors.muted }]}>
                    {ex.sets} sets × {ex.reps} reps
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeExercise(idx)}>
                  <Ionicons name="trash-outline" size={20} color="#ff6a6a" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {showExerciseForm && (
          <View style={[styles.card, styles.exerciseForm, { backgroundColor: colors.cardBg, borderColor: colors.accent }]}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: colors.text }]}>Add Exercise</Text>
              <TouchableOpacity onPress={() => setShowExerciseForm(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Exercise Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
              value={exerciseName}
              onChangeText={setExerciseName}
              placeholder="e.g. Bench Press"
              placeholderTextColor={colors.muted}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, { color: colors.text }]}>Sets</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                  value={sets}
                  onChangeText={setSets}
                  placeholder="3"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.label, { color: colors.text }]}>Reps</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                  value={reps}
                  onChangeText={setReps}
                  placeholder="10"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveExerciseBtn, { backgroundColor: colors.accent }]}
              onPress={addExercise}
            >
              <Text style={styles.saveExerciseBtnText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.accent }]}
          onPress={saveWorkout}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Create Workout"}</Text>
        </TouchableOpacity>
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
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  exerciseItem: {
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
    marginBottom: 4,
  },
  exerciseDetail: {
    fontSize: 13,
  },
  exerciseForm: {
    borderWidth: 2,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
  },
  saveExerciseBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  saveExerciseBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
});
