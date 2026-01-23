import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

import { useAuth } from '../lib/auth/auth-context';
import { db } from '../lib/firebase';
import { useSettings } from '../lib/settings-context';
import Header from '../components/Header';

export default function Onboarding() {
  const { user, profileCompleted } = useAuth();
  const { colors } = useSettings();
  const router = useRouter();

  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goalType, setGoalType] = useState('maintain');
  const [goalWeight, setGoalWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profileCompleted) {
      router.replace('/(tabs)/home');
    }
  }, [profileCompleted, router]);

  const validateInputs = () => {
    const ageNum = parseInt(age, 10);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const goalWeightNum = goalType !== 'maintain' ? parseFloat(goalWeight) : null;

    if (!age || ageNum < 10 || ageNum > 90) {
      Alert.alert('Invalid Age', 'Please enter a valid age (10-90).');
      return false;
    }

    if (!height || heightNum < 120 || heightNum > 230) {
      Alert.alert('Invalid Height', 'Please enter height in cm (120-230).');
      return false;
    }

    if (!weight || weightNum < 25 || weightNum > 250) {
      Alert.alert('Invalid Weight', 'Please enter weight in kg (25-250).');
      return false;
    }

    if (goalType == 'bulk' && (!goalWeightNum || goalWeightNum < 25 || goalWeightNum > 250)) {
      Alert.alert('Invalid Goal Weight', `Please enter a valid goal weight (${weight}-250).`);
      return false;
    }
    if (goalType == 'cut' && (!goalWeightNum || goalWeightNum < 25 || goalWeightNum > weightNum)) {
      Alert.alert('Invalid Goal Weight', `Please enter a valid goal weight (25-${weight}).`);
      return false;
    }

    return { ageNum, heightNum, weightNum, goalWeightNum };
  };

  const completeOnboarding = async () => {
    const validated = validateInputs();
    if (!validated) return;

    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    setSaving(true);

    try {
      console.log('Submitting onboarding...');
      const { ageNum, heightNum, weightNum, goalWeightNum } = validated;

    // Update user doc
    await setDoc(doc(db, 'users', user.uid), {
      age: ageNum,
      heightCm: heightNum,
      currentWeightKg: weightNum,
      goalType,
      goalWeightKg: goalType !== 'maintain' ? goalWeightNum : null,
      profileCompleted: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log("ONBOARDING SUBMIT DONE, set profileCompleted true");
    console.log('User doc updated, checking result...');
      const snap = await getDoc(doc(db, 'users', user.uid));
      console.log('After write profileCompleted:', snap.data()?.profileCompleted);

      // Create first weight log (best-effort, don't block onboarding)
      setDoc(doc(db, 'users', user.uid, 'bodyweightLogs', `onboarding-${Date.now()}`), {
        weightKg: weightNum,
        date: serverTimestamp(),
        source: 'onboarding',
      }).catch(e => console.log('Weight log creation failed:', e?.message));

      console.log('Onboarding completed');
    } catch (error) {
      console.log('Onboarding error:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Complete Your Profile" showBack={false} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>
          Let&apos;s get to know you better!
        </Text>

        <Text style={[styles.subtitle, { color: colors.muted }]}>
          This helps us personalize your experience and track your progress.
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Info</Text>

          <Text style={[styles.label, { color: colors.text }]}>Age</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.accent, color: colors.text }]}
            value={age}
            onChangeText={setAge}
            placeholder="Your age"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
          />

          <Text style={[styles.label, { color: colors.text }]}>Height (cm)</Text>
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

        <View style={styles.section}>
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
                placeholder={`Target ${goalType === 'cut' ? 'weight' : 'weight'} in kg`}
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
              />
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.completeBtn, { backgroundColor: colors.accent }]}
          onPress={completeOnboarding}
          disabled={saving || profileCompleted}
        >
          <Text style={[styles.completeText, { color: colors.bg }]}>
            {saving ? 'Setting up...' : profileCompleted ? 'Setup Complete!' : 'Complete Setup'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 24, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { height: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 16 },
  goalButtons: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  goalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  completeBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  completeText: { fontSize: 16, fontWeight: '700' },
});