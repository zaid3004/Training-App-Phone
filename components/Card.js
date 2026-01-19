import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSettings } from '../lib/settings-context';

export default function Card({ children, style }) {
  const { colors } = useSettings();
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    // Subtle elevation to give a bubbly floating feel on both platforms
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
});
