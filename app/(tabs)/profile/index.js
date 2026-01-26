//profiles/index.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { publishProfileUpdate } from '../../../lib/event-bus';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useSettings } from '../../../lib/settings-context';
import { useAuth } from '../../../lib/auth/auth-context';
import { useSQLite } from '../../../lib/sqlite-provider';

export default function Profile() {
  const router = useRouter();
  const { colors } = useSettings();
  const { user } = useAuth();
  const db = useSQLite();

  const [name, setName] = useState('');
  const [bodyweight, setBodyweight] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [prs, setPrs] = useState({ bench: '', squat: '', deadlift: '' });

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  async function loadProfile() {
    if (!user?.uid) return;

    try {
      const stats = await db.getFirstAsync('SELECT name, bodyweight, bench, squat, deadlift FROM user_stats WHERE user_id = ?', [user.uid]);
      if (stats) {
        setName(stats.name || '');
        setBodyweight(stats.bodyweight?.toString() || '');
        setPrs({
          bench: stats.bench?.toString() || '',
          squat: stats.squat?.toString() || '',
          deadlift: stats.deadlift?.toString() || '',
        });
      }

      const pic = await AsyncStorage.getItem(`profilePic_${user.uid}`);
      setProfilePic(pic);
    } catch (e) {
      console.log('Load profile error:', e);
    }
  }

  async function saveProfile() {
    if (!user?.uid) return;

    try {
      await db.execAsync(
        `INSERT OR REPLACE INTO user_stats (user_id, name, bodyweight, bench, squat, deadlift) VALUES ('${user.uid.replace(/'/g, "''")}', '${name.replace(/'/g, "''")}', ${bodyweight || null}, ${prs.bench || null}, ${prs.squat || null}, ${prs.deadlift || null})`
      );

      // Update user_prs for manual PRs
      const date = new Date().toISOString();
      if (prs.bench) {
        await db.execAsync(
          `INSERT OR REPLACE INTO user_prs (user_id, exercise, max_weight, date, reps) VALUES ('${user.uid}', 'bench', ${prs.bench}, '${date}', 1)`
        );
      }
      if (prs.squat) {
        await db.execAsync(
          `INSERT OR REPLACE INTO user_prs (user_id, exercise, max_weight, date, reps) VALUES ('${user.uid}', 'squat', ${prs.squat}, '${date}', 1)`
        );
      }
      if (prs.deadlift) {
        await db.execAsync(
          `INSERT OR REPLACE INTO user_prs (user_id, exercise, max_weight, date, reps) VALUES ('${user.uid}', 'deadlift', ${prs.deadlift}, '${date}', 1)`
        );
      }

      // Notify Home about the profile updates for instant refresh
      publishProfileUpdate({ bodyweight, bench: prs.bench, squat: prs.squat, deadlift: prs.deadlift });
      Alert.alert('Profile Updated', 'Your profile has been successfully updated.', [
        { text: 'OK', onPress: () => router.push('/(tabs)/home?refresh=' + Date.now()) }
      ]);
    } catch (e) {
      console.log('Save profile error:', e);
      Alert.alert('Error', 'Could not save profile');
    }
  }

  async function logBodyweight() {
    if (!user?.uid) return;

    try {
      const stats = await db.getFirstAsync('SELECT bodyweight FROM user_stats WHERE user_id = ?', [user.uid]);
      if (stats?.bodyweight) {
        const today = new Date().toISOString().slice(0, 10);
        await db.execAsync(
          `INSERT OR REPLACE INTO bodyweight_logs (id, user_id, ts, weight) VALUES ('${Date.now()}', '${user.uid}', '${today}', ${stats.bodyweight})`
        );
        // Also publish update so Home can reflect instantly
        publishProfileUpdate({ bodyweight: stats.bodyweight });
        Alert.alert('Logged', 'Bodyweight logged for today');
      } else {
        Alert.alert('No bodyweight', 'Set your bodyweight first');
      }
    } catch (e) {
      console.log('Log bodyweight error:', e);
      Alert.alert('Error', 'Could not log bodyweight');
    }
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Media library access is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfilePic(uri);
      await AsyncStorage.setItem(`profilePic_${user.uid}`, uri);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>

        {/* Profile Picture */}
        <TouchableOpacity onPress={pickImage} style={styles.picContainer}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.profilePic} />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: colors.cardBg }]}>
              <Text style={{ color: colors.muted, textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Name */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Display Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={colors.muted}
          />
        </View>

        {/* Bodyweight */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Bodyweight (kg)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
            value={bodyweight}
            onChangeText={setBodyweight}
            placeholder="Enter weight"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
          />
        </View>

        {/* PRs */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Records (kg)</Text>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Bench Press</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
            value={prs.bench}
            onChangeText={(value) => setPrs({ ...prs, bench: value })}
            placeholder="Enter bench PR"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Squat</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
            value={prs.squat}
            onChangeText={(value) => setPrs({ ...prs, squat: value })}
            placeholder="Enter squat PR"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Deadlift</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
            value={prs.deadlift}
            onChangeText={(value) => setPrs({ ...prs, deadlift: value })}
            placeholder="Enter deadlift PR"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={saveProfile} >
          <Text style={styles.saveText}>Save Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.logBtn, { borderColor: colors.border }]} onPress={logBodyweight}>
          <Text style={{ color: colors.text }}>Log Current Bodyweight</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 20 },
  picContainer: { alignItems: 'center', marginBottom: 20 },
  profilePic: { width: 100, height: 100, borderRadius: 50 },
  placeholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ccc' },
  field: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
  saveBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#000', fontWeight: '700' },
  logBtn: { paddingVertical: 10, borderRadius: 6, borderWidth: 1, alignItems: 'center', marginTop: 12 },
});
