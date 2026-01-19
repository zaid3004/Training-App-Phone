import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useSQLite } from '../../../lib/sqlite-provider';
import { useAuth } from '../../../lib/auth/auth-context';
import { useSettings } from '../../../lib/settings-context';

export default function Settings() {
  const { user } = useAuth();
  const db = useSQLite();
  const { colors, theme, accent, updateTheme, updateAccent, ACCENTS, loading } = useSettings();
  const router = useRouter();

  const [name, setName] = useState('');
  const [bodyweight, setBodyweight] = useState('');

  // Load profile data from user_stats
  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      try {
        const row = await db.getFirstAsync('SELECT name, bodyweight FROM user_stats WHERE user_id = ?', [user.id]);
        if (row) {
          setName(row.name || '');
          setBodyweight(row.bodyweight ? String(row.bodyweight) : '');
        }
      } catch (e) {
        console.log('Settings load profile error', e);
      }
    }
    load();
  }, [db, user?.id]);

  async function saveProfile() {
    if (!user?.id) return;
    await db.runAsync('INSERT OR REPLACE INTO user_stats (user_id, name, bodyweight, bench, squat, deadlift, preferences) VALUES (?, ?, ?, ?, ?, ?, ?)', [user.id, name, parseFloat(bodyweight) || null, null, null, null, '{}']);
    // Theme settings persist globally via useSettings
    alert('Profile saved');
  }

  async function handleLogout() {
    // This will be provided via lib/auth/auth-context; reuse helper if exposed
    // For now, navigate to login as a placeholder until full auth flow wired
    router.replace('/auth/login');
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Display name</Text>
        <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.bg, borderColor: colors.border }]} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.muted} />
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Bodyweight</Text>
        <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.bg, borderColor: colors.border }]} value={bodyweight} onChangeText={setBodyweight} placeholder="e.g. 75" keyboardType="numeric" placeholderTextColor={colors.muted} />
      </View>
      <TouchableOpacity style={styles.btn} onPress={saveProfile}>
        <Text style={styles.btnText}>Save Profile</Text>
      </TouchableOpacity>
      <View style={styles.divider} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme</Text>
      <View style={styles.themeRow}>
        {[
          { key: 'light', label: 'Light' },
          { key: 'dark', label: 'Dark' },
        ].map(t => (
          <TouchableOpacity key={t.key} onPress={() => updateTheme(t.key)} style={[styles.themeOption, theme === t.key && styles.themeSelected]}>
            <Text style={{ color: colors.text }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Accent</Text>
      <View style={styles.themeRow}>
        {[
          { key: 'teal', label: 'Teal' },
          { key: 'blue', label: 'Blue' },
          { key: 'pink', label: 'Pink' },
          { key: 'red', label: 'Red' },
          { key: 'lime', label: 'Lime' },
        ].map(a => (
          <TouchableOpacity key={a.key} onPress={() => updateAccent(a.key)} style={[styles.themeOption, accent === a.key && styles.themeSelected]}>
            <Text style={{ color: colors.text }}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 40 }} />
      <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: colors.accent }]}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  label: { fontSize: 14, color: '#666', marginBottom: 6 },
  input: { height: 40, borderRadius: 6, paddingHorizontal: 8, borderWidth: 1 },
  btn: { padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#2a9d8f', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 6 },
  themeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
  themeOption: { padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ccc', marginRight: 8, marginBottom: 8 },
  themeSelected: { borderColor: '#000' },
  logoutBtn: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  logoutText: { color: '#fff', fontWeight: '700' },
});
