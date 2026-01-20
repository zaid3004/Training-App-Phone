import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSettings } from '../lib/settings-context';
import { EXERCISES } from '../constants/exercises';

const OTHER_ITEM = { id: '__other__', name: 'Other' };

export default function ExercisePicker({ value, onChange, placeholder = 'Select exercise', style }) {
  const { colors } = useSettings();
  const [query, setQuery] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState('');
  const customInputRef = useRef(null);

  // initialize from value
  useEffect(() => {
    if (value?.source === 'custom') {
      setShowCustom(true);
      setCustom(value?.name ?? '');
    } else {
      setShowCustom(false);
      setCustom('');
    }
  }, [value]);

  const builtins = useMemo(() => EXERCISES ?? [], []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let res = q ? builtins.filter(e => e.name.toLowerCase().includes(q)) : builtins;
    return res.sort((a, b) => a.name.localeCompare(b.name));
  }, [query, builtins]);

  const results = useMemo(() => {
    const q = query.trim();
    let res = [];
    if (q) {
      const exists = builtins.some(e => e.name.toLowerCase() === q.toLowerCase());
      if (!exists) {
        res.push({ id: '__custom__', name: q, isCustom: true });
      }
    }
    res.push(...filtered, OTHER_ITEM);
    return res;
  }, [query, filtered, builtins]);

  function selectBuiltin(item) {
    onChange({ id: item.id, name: item.name, source: 'builtin' });
  }

  function selectCustom(item) {
    onChange({ id: 'custom-' + Date.now(), name: item.name, source: 'custom' });
  }

  function selectOther() {
    setShowCustom(true);
  }

  function submitCustom() {
    const name = custom.trim();
    if (!name) return;
    onChange({ id: 'custom-' + Date.now(), name, source: 'custom' });
  }

  useEffect(() => {
    if (showCustom && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [showCustom]);

  const styles = StyleSheet.create({
    container: { width: '100%' },
    search: { height: 40, borderColor: colors.border, borderWidth: 1, paddingHorizontal: 8, borderRadius: 6, marginVertical: 6, backgroundColor: colors.cardBg, color: colors.text },
    list: { maxHeight: 260 },
    item: { paddingVertical: 10, paddingHorizontal: 8 },
    itemText: { fontSize: 16, color: colors.text },
    customRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    customInput: { flex: 1, height: 40, borderColor: colors.border, borderWidth: 1, paddingHorizontal: 8, borderRadius: 6, backgroundColor: colors.cardBg, color: colors.text },
    applyBtn: { marginLeft: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.accent, borderRadius: 6 },
    applyText: { color: '#000' },
  });

  return (
    <View style={[styles.container, style]}>
      <TextInput
        placeholder={value?.name ? `Selected: ${value.name}` : placeholder}
        value={query}
        onChangeText={setQuery}
        style={styles.search}
        placeholderTextColor={colors.muted}
        accessibilityLabel="Exercise search"
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          item.id === '__other__' ? (
            <TouchableOpacity onPress={selectOther} style={styles.item}>
              <Text style={styles.itemText}>Other</Text>
            </TouchableOpacity>
          ) : item.isCustom ? (
            <TouchableOpacity onPress={() => selectCustom(item)} style={styles.item}>
              <Text style={styles.itemText}>{item.name} (Custom)</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => selectBuiltin(item)} style={styles.item}>
              <Text style={styles.itemText}>{item.name}</Text>
            </TouchableOpacity>
          )
        )}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
      />
      {showCustom && (
        <View style={styles.customRow}>
          <TextInput
            ref={customInputRef}
            placeholder="Type custom exercise"
            value={custom}
            onChangeText={setCustom}
            onSubmitEditing={submitCustom}
            style={styles.customInput}
            placeholderTextColor={colors.muted}
            accessibilityLabel="Custom exercise"
          />
          <TouchableOpacity onPress={submitCustom} style={styles.applyBtn}>
            <Text style={styles.applyText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
