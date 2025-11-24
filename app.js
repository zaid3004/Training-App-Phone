import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('program');
  const [currentWeek, setCurrentWeek] = useState(1);
  
  // User stats
  const [userStats, setUserStats] = useState({
    name: '',
    bodyweight: '',
    bench_1rm: '',
    deadlift_1rm: '',
    squat_1rm: '',
  });

  // Theme colors
  const theme = {
    bg: darkMode ? '#0a0a0a' : '#f5f5f5',
    cardBg: darkMode ? '#1a1a1a' : '#ffffff',
    text: darkMode ? '#e0e0e0' : '#1a1a1a',
    textSecondary: darkMode ? '#b0b0b0' : '#666666',
    primary: '#ff6b35',
    secondary: '#4a90e2',
    border: darkMode ? '#3a3a3a' : '#e0e0e0',
    inputBg: darkMode ? '#2a2a2a' : '#f9f9f9',
  };

  // Load data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const stats = await AsyncStorage.getItem('userStats');
      const mode = await AsyncStorage.getItem('darkMode');
      
      if (stats) {
        setUserStats(JSON.parse(stats));
        setIsSetupComplete(true);
      }
      if (mode !== null) {
        setDarkMode(mode === 'true');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveUserStats = async (stats) => {
    try {
      await AsyncStorage.setItem('userStats', JSON.stringify(stats));
      setUserStats(stats);
      setIsSetupComplete(true);
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    await AsyncStorage.setItem('darkMode', String(newMode));
  };

  // Calculate weights
  const roundPlate = (x) => Math.round(x / 1.25) * 1.25;
  const pct = (orm, p) => roundPlate(orm * p);

  const deadliftWeekWeight = (week, dl1rm) => {
    if (week <= 1) return { label: 'RDL 3x10', weight: roundPlate(dl1rm * 0.25) };
    if (week === 2) return { label: 'DL 4x5 light', weight: roundPlate(dl1rm * 0.35) };
    if (week === 3) return { label: 'DL 3x3', weight: roundPlate(dl1rm * 0.55) };
    if (week === 4) return { label: 'DL 3x2', weight: roundPlate(dl1rm * 0.75) };
    if (week === 5) return { label: 'DL 3x3 heavier', weight: roundPlate(dl1rm * 0.65) };
    if (week === 6) return { label: 'DL 3x2 heavier', weight: roundPlate(dl1rm * 0.8) };
    return { label: 'DL 1-3RM test day', weight: roundPlate(dl1rm * 0.9) };
  };

  const generateProgram = () => {
    const bench = parseFloat(userStats.bench_1rm);
    const deadlift = parseFloat(userStats.deadlift_1rm);
    const squat = parseFloat(userStats.squat_1rm);
    const dlWeek = deadliftWeekWeight(currentWeek, deadlift);

    return [
      {
        title: 'Day 1 - Push (Heavy Chest)',
        exercises: [
          { name: 'Bench Press (wide) - heavy', sets: '5x3-5', weight: pct(bench, 0.82) },
          { name: 'Incline DB Press', sets: '4x8', weight: 16.0 },
          { name: 'Weighted Dips', sets: '3x5-8', weight: null },
          { name: 'Machine Chest Press', sets: '3x10', weight: null },
          { name: 'Cable Flyes', sets: '3x12', weight: null },
          { name: 'Tricep Pushdown', sets: '2x15', weight: 20.0 },
        ],
      },
      {
        title: 'Day 2 - Pull (Strength + DL)',
        exercises: [
          { name: dlWeek.label, sets: '', weight: dlWeek.weight },
          { name: 'Bent Over Row', sets: '4x6', weight: pct(deadlift, 0.45) },
          { name: 'Weighted Pull-Ups', sets: '4x5', weight: null },
          { name: 'Lat Pulldown', sets: '3x8', weight: null },
          { name: 'Cable Row', sets: '3x10', weight: null },
          { name: 'Face Pulls', sets: '3x15', weight: null },
          { name: 'Hammer Curls', sets: '3x10', weight: 16.0 },
        ],
      },
      {
        title: 'Day 3 - Legs (Power)',
        exercises: [
          { name: 'Squat', sets: '5x5', weight: pct(squat, 0.75) },
          { name: 'Leg Press', sets: '4x10', weight: 95.0 },
          { name: 'RDL (light)', sets: '3x8-10', weight: pct(deadlift, 0.35) },
          { name: 'Leg Extension', sets: '3x12', weight: null },
          { name: 'Hamstring Curl', sets: '3x12', weight: null },
          { name: 'Calves', sets: '3x15-20', weight: null },
        ],
      },
      {
        title: 'Day 4 - Push (Volume)',
        exercises: [
          { name: 'Bench Press - volume', sets: '4x8', weight: pct(bench, 0.62) },
          { name: 'Incline Smith Press', sets: '4x10', weight: null },
          { name: 'Chest Dips (bw)', sets: '3x10-12', weight: null },
          { name: 'Lateral Raises', sets: '4x15', weight: null },
          { name: 'Overhead Press', sets: '3x6', weight: pct(bench, 0.4) },
          { name: 'Cable Flyes', sets: '3x12', weight: null },
          { name: 'Rope Tricep Ext', sets: '3x12', weight: null },
        ],
      },
      {
        title: 'Day 5 - Pull (Volume)',
        exercises: [
          { name: 'Pull-Ups (strict)', sets: '3x8', weight: null },
          { name: 'Seated Row', sets: '4x12', weight: null },
          { name: 'Single Arm Lat Pulldown', sets: '3x10', weight: null },
          { name: 'DB Row', sets: '3x12', weight: null },
          { name: 'Rear Delt Machine', sets: '3x15', weight: null },
          { name: 'Barbell Curls', sets: '3x10', weight: null },
          { name: 'Concentration Curls', sets: '2x12', weight: null },
        ],
      },
    ];
  };

  // Setup Screen
  if (!isSetupComplete) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
        <ScrollView contentContainerStyle={styles.setupContainer}>
          <View style={styles.themeToggleContainer}>
            <Text style={[styles.themeText, { color: theme.text }]}>
              {darkMode ? '🌙 Dark' : '☀️ Light'}
            </Text>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={darkMode ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>

          <Text style={[styles.setupTitle, { color: theme.primary }]}>
            💪 Welcome to PRVault
          </Text>
          <Text style={[styles.setupSubtitle, { color: theme.textSecondary }]}>
            Set up your profile to get started
          </Text>

          <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.cardTitle, { color: theme.secondary }]}>Your Stats</Text>
            
            <Text style={[styles.label, { color: theme.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={userStats.name}
              onChangeText={(text) => setUserStats({ ...userStats, name: text })}
              placeholder="Enter your name"
              placeholderTextColor={theme.textSecondary}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Bodyweight (kg)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={userStats.bodyweight}
              onChangeText={(text) => setUserStats({ ...userStats, bodyweight: text })}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Bench Press 1RM (kg)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={userStats.bench_1rm}
              onChangeText={(text) => setUserStats({ ...userStats, bench_1rm: text })}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Deadlift 1RM (kg)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={userStats.deadlift_1rm}
              onChangeText={(text) => setUserStats({ ...userStats, deadlift_1rm: text })}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Squat 1RM (kg)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={userStats.squat_1rm}
              onChangeText={(text) => setUserStats({ ...userStats, squat_1rm: text })}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => {
                if (userStats.name && userStats.bodyweight && userStats.bench_1rm && 
                    userStats.deadlift_1rm && userStats.squat_1rm) {
                  saveUserStats(userStats);
                } else {
                  Alert.alert('Error', 'Please fill in all fields');
                }
              }}
            >
              <Text style={styles.submitButtonText}>Start Training</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main App
  const program = generateProgram();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>💪 GYM TRACKER</Text>
        <View style={styles.themeToggleSmall}>
          <Text style={[styles.themeTextSmall, { color: theme.text }]}>
            {darkMode ? '🌙' : '☀️'}
          </Text>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767577', true: theme.primary }}
            thumbColor={darkMode ? '#f4f3f4' : '#f4f3f4'}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </View>

      {/* User Info */}
      <View style={[styles.userInfo, { backgroundColor: theme.cardBg, borderLeftColor: theme.primary }]}>
        <Text style={[styles.userInfoText, { color: theme.text }]}>
          <Text style={{ fontWeight: 'bold' }}>{userStats.name}</Text> | BW: {userStats.bodyweight}kg | 
          Bench: {userStats.bench_1rm}kg | DL: {userStats.deadlift_1rm}kg | Squat: {userStats.squat_1rm}kg
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: theme.bg }]}>
        <TouchableOpacity
          style={[styles.tab, currentScreen === 'program' && { backgroundColor: theme.primary }]}
          onPress={() => setCurrentScreen('program')}
        >
          <Text style={[styles.tabText, { color: currentScreen === 'program' ? '#fff' : theme.text }]}>
            Program
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentScreen === 'stats' && { backgroundColor: theme.primary }]}
          onPress={() => setCurrentScreen('stats')}
        >
          <Text style={[styles.tabText, { color: currentScreen === 'stats' ? '#fff' : theme.text }]}>
            Stats
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {currentScreen === 'program' && (
          <>
            {/* Week Selector */}
            <View style={styles.weekSelector}>
              <TouchableOpacity
                style={[styles.weekButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                onPress={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
              >
                <Text style={[styles.weekButtonText, { color: theme.text }]}>← Prev</Text>
              </TouchableOpacity>
              <Text style={[styles.weekText, { color: theme.primary }]}>Week {currentWeek}</Text>
              <TouchableOpacity
                style={[styles.weekButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                onPress={() => setCurrentWeek(Math.min(8, currentWeek + 1))}
              >
                <Text style={[styles.weekButtonText, { color: theme.text }]}>Next →</Text>
              </TouchableOpacity>
            </View>

            {/* Program Days */}
            {program.map((day, dayIndex) => (
              <View key={dayIndex} style={[styles.dayCard, { backgroundColor: theme.cardBg, borderLeftColor: theme.secondary }]}>
                <Text style={[styles.dayTitle, { color: theme.secondary }]}>{day.title}</Text>
                {day.exercises.map((ex, exIndex) => (
                  <View key={exIndex} style={[styles.exercise, { backgroundColor: theme.inputBg }]}>
                    <Text style={[styles.exerciseName, { color: theme.text }]}>{ex.name}</Text>
                    <View style={styles.exerciseDetails}>
                      {ex.sets && <Text style={[styles.exerciseText, { color: theme.primary }]}>{ex.sets}</Text>}
                      {ex.weight && <Text style={[styles.exerciseText, { color: theme.primary }]}>{ex.weight} kg</Text>}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {currentScreen === 'stats' && (
          <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.cardTitle, { color: theme.secondary }]}>Update Your Stats</Text>
            
            <Text style={[styles.label, { color: theme.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={userStats.name}
              onChangeText={(text) => setUserStats({ ...userStats, name: text })}
              placeholderTextColor={theme.textSecondary}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Bodyweight (kg)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={userStats.bodyweight}
              onChangeText={(text) => setUserStats({ ...userStats, bodyweight: text })}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.textSecondary}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Bench 1RM (kg)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={userStats.bench_1rm}
              onChangeText={(text) => setUserStats({ ...userStats, bench_1rm: text })}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.textSecondary}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Deadlift 1RM (kg)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={userStats.deadlift_1rm}
              onChangeText={(text) => setUserStats({ ...userStats, deadlift_1rm: text })}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.textSecondary}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Squat 1RM (kg)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={userStats.squat_1rm}
              onChangeText={(text) => setUserStats({ ...userStats, squat_1rm: text })}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.textSecondary}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => {
                saveUserStats(userStats);
                Alert.alert('Success', 'Stats updated!');
              }}
            >
              <Text style={styles.submitButtonText}>Update Stats</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  setupContainer: {
    padding: 20,
    paddingTop: 40,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  themeText: {
    fontSize: 16,
    marginRight: 10,
    fontWeight: '600',
  },
  setupTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  setupSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  themeToggleSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeTextSmall: {
    fontSize: 18,
    marginRight: 5,
  },
  userInfo: {
    padding: 15,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  userInfoText: {
    fontSize: 13,
  },
  tabs: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  weekSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  weekButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  weekButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  weekText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dayCard: {
    padding: 20,
    marginBottom: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  exercise: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    flex: 1,
    fontSize: 14,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: 15,
  },
  exerciseText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    padding: 12,
    borderRadius: 4,
    fontSize: 14,
    borderWidth: 1,
  },
  submitButton: {
    backgroundColor: '#ff6b35',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});