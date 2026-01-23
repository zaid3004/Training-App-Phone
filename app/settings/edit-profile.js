import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '../../lib/auth/auth-context';
import { useProfile } from '../../lib/profile/profile-context';
import { useSettings } from '../../lib/settings-context';
import Header from '../../components/Header';



export default function EditProfile() {
  const { user } = useAuth();
  const { profile, setProfile } = useProfile();
  const { colors } = useSettings();
  const router = useRouter();

  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goalType, setGoalType] = useState('maintain');
  const [goalWeight, setGoalWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
      if (profile) {
        setAge(profile.age?.toString() || '');
        setHeight(profile.heightCm?.toString() || '');
        setWeight(profile.currentWeightKg?.toString() || '');
        setGoalType(profile.goalType || 'maintain');
        setGoalWeight(profile.goalWeightKg?.toString() || '');
      }
  }, [profile]);



  const saveProfile = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    console.log('User uid:', user.uid);
    setSaving(true);

    try {
    const updates = {
      updatedAt: new Date(),
      profileCompleted: true,
    };

      if (age) updates.age = parseInt(age, 10);
      if (height) updates.heightCm = parseFloat(height);
      if (weight) {
        updates.currentWeightKg = parseFloat(weight);
        // Simulate weight log (ignore Firestore)
      }
      updates.goalType = goalType;
      if (goalType !== 'maintain' && goalWeight) {
        updates.goalWeightKg = parseFloat(goalWeight);
      }

      // Simulate profile update (ignore Firestore write for now)
      setProfile(prev => ({ ...(prev || {}), ...updates, updatedAt: new Date() }));

      console.log('Updating profile with:', updates);
      console.log('Profile updated successfully');

      Alert.alert('Success', 'Profile saved successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.log('Save profile error:', error);
      if (error.message && error.message.includes('timed out')) {
        Alert.alert('Warning', 'Save timed out but may succeed. Check your profile later.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const saveProfileAndGoBack = async () => {
    await Promise.all([saveProfile(), router.back()]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Edit Profile" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { borderColor: colors.border }]}>
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
          onPress={saveProfileAndGoBack}
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