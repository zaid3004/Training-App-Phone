import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSQLite } from '../../../lib/sqlite-provider';
import { computePRsForUser, updatePRsAfterWorkout } from '../../../lib/prs-utils';
import Header from '../../../components/Header';
import { useAuth } from '../../../lib/auth/auth-context';
import { useSettings } from '../../../lib/settings-context';

export default function PRsScreen() {
  const { db } = useSQLite();
  const { colors } = useSettings();
  const { user } = useAuth();
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!db) return;
      const userId = user?.id || null;
      try {
        if (userId) {
          const data = await computePRsForUser(db, userId);
          if (mounted) setPrs(data);
        }
      } catch (e) {
        console.error('Failed to load PRs', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [db, user?.id]);

  const renderItem = ({ item }) => (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.exercise, { color: colors.text }]}>{item.exercise}</Text>
      <Text style={[styles.weight, { color: colors.text }]}>{item.max_weight ?? '-'}</Text>
      <Text style={[styles.date, { color: colors.muted }]}>{item.date ?? ''}</Text>
      <Text style={[styles.reps, { color: colors.text }]}>{item.reps != null ? item.reps : '-'}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Header title="PRs" showBack={true} />
      {loading ? (
        <Text style={[styles.loading, { color: colors.text }]}>Loading…</Text>
      ) : (
        <FlatList
          data={prs}
          keyExtractor={(it) => it.exercise}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>No PRs found yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 8 },
  loading: { textAlign: 'center', marginTop: 20 },
  empty: { textAlign: 'center', marginTop: 20 },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1 },
  exercise: { flex: 2 },
  weight: { flex: 1, textAlign: 'center' },
  date: { flex: 2, textAlign: 'center' },
  reps: { flex: 1, textAlign: 'center' },
});
