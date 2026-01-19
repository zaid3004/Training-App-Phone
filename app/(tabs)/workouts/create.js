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
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [setWeight, setSetWeight] = useState("");
  const [setReps, setSetReps] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveWorkout() {
    if (!workoutName.trim()) {
      Alert.alert("Required", "Please enter workout name");
      return;
    }
    if (!selectedExercise?.name) {
      Alert.alert("Required", "Please choose an exercise");
      return;
    }
    if (!user?.id) {
      Alert.alert("Error", "User not loaded");
      return;
    }

    try {
      setSaving(true);
      const id = Date.now().toString();
      const createdAt = new Date().toISOString();
      const exercisesArray = [ { name: selectedExercise.name, id: selectedExercise.id } ];
      const exercisesJson = JSON.stringify(exercisesArray).replace(/'/g, "''");

      await db.execAsync(
        `INSERT INTO workouts (id, user_id, name, description, exercises, created_at)
         VALUES ('${id}', '${user.id}', '${workoutName.replace(/'/g, "''")}','${description.replace(/'/g, "''")}','${exercisesJson}','${createdAt}')`
      );

      // PR Sync after workout is saved (incremental)
      const weightVal = Number(setWeight) || 0;
      const repsVal = Number(setReps) || null;
      const entries = [{ name: selectedExercise.name, weight: weightVal, reps: repsVal }];
      try {
        await updatePRsAfterWorkout(db, user.id, id, entries);
      } catch (e) {
        console.log('PR sync after workout failed', e);
      }

      Alert.alert("Saved", "Workout created successfully", [ { text: "OK", onPress: () => router.back() } ]);
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

        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Exercise</Text>
          <ExercisePicker value={selectedExercise} onChange={setSelectedExercise} placeholder="Choose exercise" />
        </View>

        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Set (weight in kg)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
            value={setWeight}
            onChangeText={setSetWeight}
            placeholder="Weight"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"/>
          <Text style={[styles.label, { color: colors.text }]}>Reps</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
            value={setReps}
            onChangeText={setSetReps}
            placeholder="Reps"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"/>
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={saveWorkout} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Create Workout'}</Text>
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
  saveBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#000', fontWeight: '700' },
});
