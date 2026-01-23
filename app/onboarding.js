import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';


import { useAuth } from '../lib/auth/auth-context';
import { useProfile } from '../lib/profile/profile-context';
import { useSettings } from '../lib/settings-context';
import Header from '../components/Header';



export default function Onboarding() {
  const { user } = useAuth();
  const { profileCompleted, setProfile } = useProfile();
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



  const completeOnboarding = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    setSaving(true);

    try {
      console.log('Submitting onboarding...');
      const ageNum = age ? parseInt(age, 10) : null;
      const heightNum = height ? parseFloat(height) : null;
      const weightNum = weight ? parseFloat(weight) : null;
      const goalWeightNum = goalType !== 'maintain' && goalWeight ? parseFloat(goalWeight) : null;

    // Simulate update user doc (ignore Firestore write for now)
    const payload = {
      age: ageNum,
      heightCm: heightNum,
      currentWeightKg: weightNum,
      goalType,
      goalWeightKg: goalType !== 'maintain' ? goalWeightNum : null,
      profileCompleted: true,
      updatedAt: new Date(),
    };

    // Optimistic update for immediate UI
    setProfile(prev => ({ ...(prev || {}), ...payload }));

    console.log("ONBOARDING SUBMIT DONE, set profileCompleted true");

    console.log('Onboarding completed');
    } catch (error) {
      console.log('Onboarding error:', error);
      if (error.message && error.message.includes('timed out')) {
        Alert.alert('Warning', 'Setup timed out but may succeed. Please wait or try again.', [
          { text: 'Retry', onPress: () => completeOnboarding() },
          { text: 'Continue', style: 'cancel' }
        ]);
      } else {
        Alert.alert('Error', 'Failed to complete setup. Please try again.');
      }
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
          onPress={() => {
            completeOnboarding();
            router.replace('/(tabs)/home');
          }}
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