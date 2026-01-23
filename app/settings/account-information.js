import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';

import { useAuth } from '../../lib/auth/auth-context';
import { useSettings } from '../../lib/settings-context';
import { db } from '../../lib/firebase';
import Header from '../../components/Header';

export default function AccountInformation() {
  const { user } = useAuth();
  const { colors } = useSettings();
  const router = useRouter();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, [user?.uid]);

  const loadProfileData = async () => {
    if (!user?.uid) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setProfileData(userDoc.data());
      }
    } catch (e) {
      console.log('Error loading profile data:', e);
      Alert.alert('Error', 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
            <Text style={[styles.value, { color: colors.text }]}>{profileData?.username || 'N/A'}</Text>
          </View>
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile</Text>

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Age</Text>
            <Text style={[styles.value, { color: colors.text }]}>{profileData?.age ? `${profileData.age} years` : 'Not set'}</Text>
          </View>

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Height</Text>
            <Text style={[styles.value, { color: colors.text }]}>{profileData?.heightCm ? `${profileData.heightCm} cm` : 'Not set'}</Text>
          </View>

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Current Weight</Text>
            <Text style={[styles.value, { color: colors.text }]}>{profileData?.currentWeightKg ? `${profileData.currentWeightKg} kg` : 'Not set'}</Text>
          </View>

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Goal Type</Text>
            <Text style={[styles.value, { color: colors.text }]}>{profileData?.goalType ? profileData.goalType.charAt(0).toUpperCase() + profileData.goalType.slice(1) : 'Not set'}</Text>
          </View>

          {profileData?.goalType !== 'maintain' && (
            <View style={[styles.infoRow, { borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.text }]}>Target Weight</Text>
              <Text style={[styles.value, { color: colors.text }]}>{profileData?.goalWeightKg ? `${profileData.goalWeightKg} kg` : 'Not set'}</Text>
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