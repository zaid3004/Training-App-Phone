// app/(tabs)/profile/index.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// This Profile screen is moved to Settings. Keeping a minimal placeholder here
// to guide users and prevent broken navigation.
export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>Profile has been moved to Settings. Open Settings to edit your profile and PRs.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    paddingHorizontal: 20,
  },
});
