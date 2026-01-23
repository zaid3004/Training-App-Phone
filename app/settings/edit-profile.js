import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { useAuth } from '../../lib/auth/auth-context';
import { useSettings } from '../../lib/settings-context';
import { db } from '../../lib/firebase';
import Header from '../../components/Header';

export default function EditProfile() {
  const { user } = useAuth();
  const { colors } = useSettings();
  const router = useRouter();

  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goalType, setGoalType] = useState('maintain');
  const [goalWeight, setGoalWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrentProfile();
  }, [user?.uid]);

  const loadCurrentProfile = async () => {
    if (!user?.uid) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setAge(data.age?.toString() || '');
        setHeight(data.heightCm?.toString() || '');
        setWeight(data.currentWeightKg?.toString() || '');
        setGoalType(data.goalType || 'maintain');
        setGoalWeight(data.goalWeightKg?.toString() || '');
      }
    } catch (e) {
      console.log('Error loading profile:', e);
      Alert.alert('Error', 'Failed to load current profile.');
    }
  };

  const validateInputs = () => {
    const ageNum = parseInt(age, 10);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const goalWeightNum = goalType !== 'maintain' ? parseFloat(goalWeight) : null;

    if (age && (ageNum < 10 || ageNum > 90)) {
      Alert.alert('Invalid Age', 'Age must be between 10-90.');
      return false;
    }

    if (height && (heightNum < 120 || heightNum > 230)) {
      Alert.alert('Invalid Height', 'Height must be between 120-230 cm.');
      return false;
    }

    if (weight && (weightNum < 25 || weightNum > 250)) {
      Alert.alert('Invalid Weight', 'Weight must be between 25-250 kg.');
      return false;
    }

    if (goalType !== 'maintain' && goalWeight && (goalWeightNum < 25 || goalWeightNum > 250)) {
      Alert.alert('Invalid Goal Weight', 'Goal weight must be between 25-250 kg.');
      return false;
    }

    return true;
  };

  const saveProfile = async () => {
    if (!validateInputs()) return;

    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    setSaving(true);

    try {
      const updates = {
        updatedAt: serverTimestamp(),
      };

      if (age) updates.age = parseInt(age, 10);
      if (height) updates.heightCm = parseFloat(height);
      if (weight) {
        updates.currentWeightKg = parseFloat(weight);
        // Log new weight
        await setDoc(doc(db, 'users', user.uid, 'bodyweightLogs', `update-${Date.now()}`), {
          weightKg: parseFloat(weight),
          date: serverTimestamp(),
          source: 'profile_update',
        });
      }
      updates.goalType = goalType;
      if (goalType !== 'maintain' && goalWeight) {
        updates.goalWeightKg = parseFloat(goalWeight);
      }

      await setDoc(doc(db, 'users', user.uid), updates, { merge: true });

      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.log('Save profile error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Edit Profile" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Info</Text>

          <Text style={[styles.label, { color: colors.text }]}>Age (optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.accent, color: colors.text }]}
            value={age}
            onChangeText={setAge}
            placeholder="Your age"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
          />

          <Text style={[styles.label, { color: colors.text }]}>Height (cm, optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.accent, color: colors.text }]}
            value={height}
            onChangeText={setHeight}
            placeholder="Your height in cm"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
          />

          <Text style={[styles.label, { color: colors.text }]}>Current Weight (kg)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.accent, color: colors.text }]}
            value={weight}
            onChangeText={setWeight}
            placeholder="Your current weight"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fitness Goals</Text>

          <Text style={[styles.label, { color: colors.text }]}>Goal Type</Text>
          <View style={styles.goalButtons}>
            {[
              { key: 'cut', label: 'Lose Weight' },
              { key: 'maintain', label: 'Maintain Weight' },
              { key: 'bulk', label: 'Gain Weight' },
            ].map((goal) => (
              <TouchableOpacity
                key={goal.key}
                onPress={() => setGoalType(goal.key)}
                style={[
                  styles.goalButton,
                  { borderColor: colors.accent, backgroundColor: goalType === goal.key ? colors.accent : colors.cardBg },
                ]}
              >
                <Text style={{ color: goalType === goal.key ? colors.bg : colors.text }}>
                  {goal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {goalType !== 'maintain' && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>
                Target Weight (kg)
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.accent, color: colors.text }]}
                value={goalWeight}
                onChangeText={setGoalWeight}
                placeholder={`Target weight in kg`}
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
              />
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.accent }]}
          onPress={saveProfile}
          disabled={saving}
        >
          <Text style={[styles.saveText, { color: colors.bg }]}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  section: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { height: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 16 },
  goalButtons: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  goalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  saveBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveText: { fontSize: 16, fontWeight: '700' },
});