import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '../../../lib/settings-context';

export default function Profile() {
  const { colors } = useSettings();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>Use Settings to edit your profile (name, weight) and PRs.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
});
