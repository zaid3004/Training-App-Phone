import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';

import { useSQLite } from '../../../lib/sqlite-provider';
import { useAuth } from '../../../lib/auth/auth-context';
import { useSettings } from '../../../lib/settings-context';
import Header from '../../../components/Header';

export default function Settings() {
  const { user } = useAuth();
  const db = useSQLite();
  const { colors, theme, accent, updateTheme, updateAccent, logout } = useSettings();
  const router = useRouter();

  // Logout only button and color/theme selectors

  async function handleLogout() {
    if (logout) {
      await logout();
    }
    router.replace('/auth/login');
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>

      {/* Theme */}
      <View style={[styles.section, { borderColor: colors.muted }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme</Text>
        <View style={styles.themeRow}>
          {[
            { key: 'light', label: 'Light' },
            { key: 'dark', label: 'Dark' },
          ].map(t => (
            <TouchableOpacity key={t.key} onPress={() => updateTheme(t.key)} style={[styles.themeOption, { borderColor: colors.muted }, theme === t.key && { borderColor: colors.accent }]}>
              <Text style={{ color: colors.text }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
       </View>
        {/* Accent */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Accent Color</Text>
          <View style={styles.themeRow}>
            {[
              { key: 'teal', label: 'Teal' },
              { key: 'blue', label: 'Blue' },
              { key: 'pink', label: 'Pink' },
              { key: 'red', label: 'Red' },
              { key: 'lime', label: 'Lime' },
            ].map(a => (
              <TouchableOpacity key={a.key} onPress={() => updateAccent(a.key)} style={[styles.themeOption, { borderColor: colors.muted }, accent === a.key && { borderColor: colors.accent }]}>
                <Text style={{ color: colors.text }}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
       </View>

       {/* Feedback */}
       <View style={[styles.section, { borderColor: colors.border }]}>
         <Text style={[styles.sectionTitle, { color: colors.text }]}>Feedback</Text>
         <TouchableOpacity onPress={() => Linking.openURL('mailto:prvault1@gmail.com')} style={[styles.feedbackBtn, { borderColor: colors.accent }]}>
           <Text style={{ color: colors.text }}>Email: prvault1@gmail.com</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => Linking.openURL('tel:+971545900728')} style={[styles.feedbackBtn, { borderColor: colors.accent }]}>
           <Text style={{ color: colors.text }}> Phone: +971 54 590 0728</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com/pr_vault')} style={[styles.feedbackBtn, { borderColor: colors.accent }]}>
           <Text style={{ color: colors.text }}>Instagram: @pr_vault</Text>
         </TouchableOpacity>
       </View>

       {/* Logout */}
       <TouchableOpacity style={[styles.logoutBtn, { borderColor: '#000', backgroundColor: colors.accent }]} onPress={handleLogout}>
         <Text style={[styles.logoutText]}>Logout</Text>
       </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  section: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  themeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  themeOption: { padding: 8, borderRadius: 6, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  feedbackBtn: { padding: 10, borderRadius: 6, borderWidth: 1, marginBottom: 8 },
  logoutBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 16, backgroundColor: '#ff4d4d' },
  logoutText: { color: '#000', fontWeight: '700', textAlign: 'center', justifyContent: 'center', alignItems: 'center' },
});
