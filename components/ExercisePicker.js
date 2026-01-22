import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, TextInput, ScrollView, Text, TouchableOpacity, StyleSheet, LayoutAnimation } from 'react-native';
import { useSettings } from '../lib/settings-context';
import { EXERCISES } from '../constants/exercises';

const OTHER_ITEM = { id: '__other__', name: 'Other' };

export default function ExercisePicker({ value, onChange, placeholder = 'Select exercise', style }) {
  const { colors } = useSettings();
  const [open, setOpen] = useState(!value);
  const [query, setQuery] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState('');
  const customInputRef = useRef(null);

  // Auto-collapse when value changes, auto-expand when cleared
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (value?.name) {
      setOpen(false);
      setQuery('');
      setShowCustom(false);
      setCustom('');
    } else {
      setOpen(true);
    }
    if (value?.source === 'custom') {
      setCustom(value?.name ?? '');
    }
  }, [value]);

  const builtins = useMemo(() => EXERCISES ?? [], []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const res = q ? builtins.filter(e => e.name.toLowerCase().includes(q)) : builtins;
    return res.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [query, builtins]);

  const results = useMemo(() => {
    const q = query.trim();
    const res = [];
    if (q) {
      const exists = builtins.some(e => e.name.toLowerCase() === q.toLowerCase());
      if (!exists) res.push({ id: '__custom__', name: q, isCustom: true });
    }
    res.push(...filtered, OTHER_ITEM);
    return res;
  }, [query, filtered, builtins]);

  function selectBuiltin(item) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange({ id: item.id, name: item.name, source: 'builtin' });
    setOpen(false);
  }

  function selectCustom(item) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange({ id: 'custom-' + Date.now(), name: item.name, source: 'custom' });
    setOpen(false);
  }

  function selectOther() {
    setShowCustom(true);
  }

  function submitCustom() {
    const name = custom.trim();
    if (!name) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange({ id: 'custom-' + Date.now(), name, source: 'custom' });
    setOpen(false);
  }

  function handleChangePress() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(true);
  }

  function handleClearPress() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange(null);
  }

  useEffect(() => {
    if (showCustom && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [showCustom]);

  const styles = StyleSheet.create({
    container: { width: '100%' },

    // Collapsed view (matches input style)
    collapsedRow: {
      height: 40,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 10,
      backgroundColor: colors.cardBg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 6,
    },
    collapsedText: { color: colors.text, fontSize: 15, fontWeight: '600', flex: 1 },
    collapsedActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    clearText: { color: colors.muted, fontSize: 16, fontWeight: '700' },
    changeText: { color: colors.accent, fontSize: 14, fontWeight: '700' },

    // Open view
    search: { height: 40, borderColor: colors.border, borderWidth: 1, paddingHorizontal: 8, borderRadius: 6, marginVertical: 6, backgroundColor: colors.cardBg, color: colors.text },
    list: { maxHeight: 260 },
    item: { paddingVertical: 10, paddingHorizontal: 8 },
    itemText: { fontSize: 16, color: colors.text },
    customRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    customInput: { flex: 1, height: 40, borderColor: colors.border, borderWidth: 1, paddingHorizontal: 8, borderRadius: 6, backgroundColor: colors.cardBg, color: colors.text },
    applyBtn: { marginLeft: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.accent, borderRadius: 6 },
    applyText: { color: colors.bg, fontWeight: '700' },
  });

  // Collapsed: show selected exercise + Change + X
  if (!open && value?.name) {
    return (
      <View style={[styles.container, style]}>
        <TouchableOpacity style={styles.collapsedRow} onPress={handleChangePress} activeOpacity={0.85}>
          <Text style={styles.collapsedText} numberOfLines={1}>{value.name}</Text>
          <View style={styles.collapsedActions}>
            <TouchableOpacity onPress={handleClearPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleChangePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Open: show search + list
  return (
    <View style={[styles.container, style]}>
      <TextInput
        placeholder={placeholder}
        value={query}
        onChangeText={setQuery}
        style={styles.search}
        placeholderTextColor={colors.muted}
        accessibilityLabel="Exercise search"
      />
      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
        {results.map((item, index) => (
          <TouchableOpacity
            key={`${item.id}-${index}`}
            onPress={
              item.id === '__other__'
                ? selectOther
                : item.isCustom
                ? () => selectCustom(item)
                : () => selectBuiltin(item)
            }
            style={styles.item}
          >
            <Text style={styles.itemText}>
              {item.id === '__other__'
                ? 'Other'
                : item.isCustom
                ? `${item.name} (Custom)`
                : item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
