import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '../../lib/auth/auth-context';
import { useProfile } from '../../lib/profile/profile-context';
import { useSettings } from '../../lib/settings-context';
import Header from '../../components/Header';

export default function AccountInformation() {
  const { user } = useAuth();
  const { profile, profileLoading } = useProfile();
  const { colors } = useSettings();
  const router = useRouter();

  if (profileLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <Header title="Account Information" />
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Account Information" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Identity</Text>

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <Text style={[styles.value, { color: colors.text }]}>{user?.email || 'N/A'}</Text>
          </View>

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Username</Text>
            <Text style={[styles.value, { color: colors.text }]}>{profile?.username || 'N/A'}</Text>
          </View>
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile</Text>

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Age</Text>
             <Text style={[styles.value, { color: colors.text }]}>{profile?.age ? `${profile.age} years` : 'Not set'}</Text>
          </View>



          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Height</Text>
            <Text style={[styles.value, { color: colors.text }]}>{profile?.heightCm ? `${profile.heightCm} cm` : 'Not set'}</Text>
          </View>

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Current Weight</Text>
            <Text style={[styles.value, { color: colors.text }]}>{profile?.currentWeightKg ? `${profile.currentWeightKg} kg` : 'Not set'}</Text>
          </View>

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Goal Type</Text>
            <Text style={[styles.value, { color: colors.text }]}>{profile?.goalType ? profile.goalType.charAt(0).toUpperCase() + profile.goalType.slice(1) : 'Not set'}</Text>
          </View>

          {profile?.goalType !== 'maintain' && (
            <View style={[styles.infoRow, { borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.text }]}>Target Weight</Text>
              <Text style={[styles.value, { color: colors.text }]}>{profile?.goalWeightKg ? `${profile.goalWeightKg} kg` : 'Not set'}</Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>

          <TouchableOpacity
            onPress={() => router.push('/settings/edit-profile')}
            style={[styles.actionBtn, { borderColor: colors.accent }]}
          >
            <Text style={{ color: colors.accent, fontWeight: '600' }}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/settings/change-password')}
            style={[styles.actionBtn, { borderColor: colors.accent }]}
          >
            <Text style={{ color: colors.accent, fontWeight: '600' }}>Change Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  infoRow: { paddingVertical: 12, borderBottomWidth: 1 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  value: { fontSize: 16 },
  actionBtn: { padding: 12, borderWidth: 1, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
});