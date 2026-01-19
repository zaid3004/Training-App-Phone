import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSQLite } from '../../../lib/sqlite-provider';
import { computePRsForUser } from '../../../lib/prs-utils';

// Simple PRs screen showing PRs per exercise.
// Note: This phase uses a placeholder userId. Later wired to a proper auth context.

export default function PRsScreen() {
  const { db } = useSQLite();
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!db) return;
      // Replace with real user id once auth is wired
      const userId = 'placeholder-user';
      try {
        const data = await computePRsForUser(db, userId);
        if (mounted) {
          setPrs(data);
        }
      } catch (e) {
        console.error('Failed to load PRs', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [db]);

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.exercise}>{item.exercise}</Text>
      <Text style={styles.weight}>{item.max_weight ?? '-'}</Text>
      <Text style={styles.date}>{item.date ?? ''}</Text>
      <Text style={styles.reps}>{item.reps != null ? item.reps : '-'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personal Records</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={prs}
          keyExtractor={(it) => it.exercise}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No PRs found yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
  exercise: { flex: 2, fontSize: 16 },
  weight: { flex: 1, textAlign: 'center' },
  date: { flex: 2, textAlign: 'center' },
  reps: { flex: 1, textAlign: 'center' },
  empty: { marginTop: 20, textAlign: 'center', color: '#666' },
});
