import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

import { useAuth } from '../../lib/auth/auth-context';
import { useSettings } from '../../lib/settings-context';
import Header from '../../components/Header';

export default function ChangePassword() {
  const { user } = useAuth();
  const { colors } = useSettings();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const validateInputs = () => {
    if (!currentPassword.trim()) {
      Alert.alert('Missing Current Password', 'Please enter your current password.');
      return false;
    }

    if (!newPassword.trim() || newPassword.length < 8) {
      Alert.alert('Invalid New Password', 'New password must be at least 8 characters long.');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match.');
      return false;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Same Password', 'New password must be different from current password.');
      return false;
    }

    return true;
  };

  const changePassword = async () => {
    if (!validateInputs()) return;

    if (!user?.email) {
      Alert.alert('Error', 'User email not available.');
      return;
    }

    setChanging(true);

    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      Alert.alert('Success', 'Password changed successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.log('Change password error:', error);

      let errorMessage = 'Failed to change password. Please try again.';

      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please log out and log back in before changing your password.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setChanging(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="Change Password" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.description, { color: colors.muted }]}>
          For security, you&apos;ll need to enter your current password to change it.
        </Text>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Change Password</Text>

          <Text style={[styles.label, { color: colors.text }]}>Current Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.accent, color: colors.text }]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.accent, color: colors.text }]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password (min 8 characters)"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.text }]}>Confirm New Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.accent, color: colors.text }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.changeBtn, { backgroundColor: colors.accent }]}
          onPress={changePassword}
          disabled={changing}
        >
          <Text style={[styles.changeText, { color: colors.bg }]}>
            {changing ? 'Changing...' : 'Change Password'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  description: { fontSize: 14, marginBottom: 24, textAlign: 'center' },
  section: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { height: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 16 },
  changeBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  changeText: { fontSize: 16, fontWeight: '700' },
});