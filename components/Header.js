import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettings } from '../lib/settings-context';

export default function Header({ title, showBack = true, right }) {
  const router = useRouter();
  const { colors } = useSettings();

  return (
    <View style={[styles.header, { backgroundColor: colors.bg }]}> 
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.back}> 
          <Text style={{ color: colors.accent }}>Back</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  back: { padding: 6, borderRadius: 6 },
  spacer: { width: 48 },
  title: { fontSize: 18, fontWeight: '700' },
  right: { minWidth: 48 },
});
