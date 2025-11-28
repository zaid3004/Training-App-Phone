// app/(tabs)/profile/index.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "../../../lib/auth/auth-context";
import { router } from "expo-router";
import { useSQLite } from "../../../lib/sqlite-provider";
import * as ImagePicker from "expo-image-picker";
import { useSettings } from "../../../lib/settings-context";

export default function Profile() {
  const { user, logout } = useAuth();
  const db = useSQLite();
  const { colors } = useSettings();

  const [editableName, setEditableName] = useState("");
  const [bodyweight, setBodyweight] = useState("");
  const [pr, setPr] = useState({ bench: "", squat: "", deadlift: "" });
  const [weightHistory, setWeightHistory] = useState([]);
  const [photoUri, setPhotoUri] = useState(null);
  const [saving, setSaving] = useState(false);

  // 🔥 STOPPAGE FOR CRASHES — user.id must exist
  if (!user || !user.id) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#fff" }}>Loading profile…</Text>
      </View>
    );
  }

  useEffect(() => {
    async function loadData() {
      try {
        // Create tables (safe if they already exist)
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS user_stats (
            user_id TEXT PRIMARY KEY NOT NULL,
            name TEXT,
            bodyweight REAL,
            bench REAL,
            squat REAL,
            deadlift REAL,
            preferences TEXT
          );
        `);

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS bodyweight_logs (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            ts TEXT NOT NULL,
            weight REAL
          );
        `);

        // Load stats
        const row = await db.getFirstAsync(
          "SELECT * FROM user_stats WHERE user_id = ?",
          [user.id]
        );

        if (row) {
          setEditableName(row.name || "");
          setBodyweight(row.bodyweight ? String(row.bodyweight) : "");

          setPr({
            bench: row.bench ? String(row.bench) : "",
            squat: row.squat ? String(row.squat) : "",
            deadlift: row.deadlift ? String(row.deadlift) : "",
          });
        }

        // Load weight history
        const logs = await db.getAllAsync(
          "SELECT ts, weight FROM bodyweight_logs WHERE user_id = ? ORDER BY ts DESC LIMIT 12",
          [user.id]
        );

        setWeightHistory(logs || []);
      } catch (err) {
        console.log("PROFILE LOAD ERROR:", err);
      }
    }

    loadData();
  }, [db, user.id]);

  async function saveProfile() {
    if (!user?.id) {
      console.log("NO USER ID — cannot save");
      Alert.alert("Error", "User not loaded.");
      return;
    }

    console.log("Saving profile for user:", user.id, user.username);

    // Validate inputs
    const benchVal = parseFloat(pr.bench) || 0;
    const squatVal = parseFloat(pr.squat) || 0;
    const deadliftVal = parseFloat(pr.deadlift) || 0;
    const bodyweightVal = parseFloat(bodyweight) || 0;

    if (benchVal < 0 || squatVal < 0 || deadliftVal < 0 || bodyweightVal < 0) {
      Alert.alert("Invalid Input", "Please enter positive numbers only");
      return;
    }

    try {
      setSaving(true);

      console.log("Updating user_stats...");
      // Use runAsync for parameterized queries
      await db.runAsync(
        `INSERT OR REPLACE INTO user_stats 
        (user_id, name, bodyweight, bench, squat, deadlift, preferences)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        user.id,
        editableName,
        bodyweightVal || null,
        benchVal || null,
        squatVal || null,
        deadliftVal || null,
        "{}"
      );

      console.log("user_stats updated successfully");

      // Weight log - only if bodyweight changed
      if (bodyweightVal > 0) {
        const logId = String(Date.now()) + Math.random().toString(16).slice(2);
        const today = new Date().toISOString().slice(0, 10);
        
        console.log("Inserting bodyweight log:", { 
          id: logId, 
          user_id: user.id, 
          ts: today, 
          weight: bodyweightVal 
        });
        
        // Use execAsync with string interpolation for inserts (runAsync has binding issues)
        await db.execAsync(
          `INSERT INTO bodyweight_logs (id, user_id, ts, weight) 
           VALUES ('${logId}', '${user.id}', '${today}', ${bodyweightVal})`
        );

        console.log("Bodyweight log inserted successfully");

        // Reload weight history
        const logs = await db.getAllAsync(
          "SELECT ts, weight FROM bodyweight_logs WHERE user_id = ? ORDER BY ts DESC LIMIT 12",
          [user.id]
        );
        setWeightHistory(logs || []);
      }

      setSaving(false);
      Alert.alert("Saved 💪", "Profile updated successfully!");
    } catch (e) {
      console.log("SAVE PROFILE ERR:", e);
      console.log("Error details:", e.message);
      setSaving(false);
      Alert.alert("Error", "Could not save profile. Check console for details.");
    }
  }

  async function pickImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Enable media permissions to upload a picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log("IMG PICK ERROR:", err);
      Alert.alert("Error", "Could not pick image.");
    }
  }

  async function handleLogout() {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace("/auth/login");
            } catch (error) {
              console.log("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ]
    );
  }

  function renderWeightItem({ item }) {
    return (
      <View style={[styles.weightRow, { borderColor: colors.border }]}>
        <Text style={[styles.weightDate, { color: colors.muted }]}>{item.ts}</Text>
        <Text style={[styles.weightVal, { color: colors.accent }]}>{item.weight} kg</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.scrollContent}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={
              photoUri
                ? { uri: photoUri }
                : require("../../../assets/default-avatar.png")
            }
            style={styles.avatar}
          />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.username, { color: colors.accent }]}>
            {editableName || user?.username || "Athlete"}
          </Text>
          <Text style={[styles.small, { color: colors.muted }]}>@{user?.username}</Text>
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.accent }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* EDIT PROFILE */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.accent }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Edit Profile</Text>

        <Text style={[styles.label, { color: colors.text }]}>Display name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
          value={editableName}
          onChangeText={setEditableName}
          placeholder="Your name"
          placeholderTextColor={colors.muted}
        />

        <Text style={[styles.label, { color: colors.text }]}>Bodyweight (kg)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
          value={bodyweight}
          onChangeText={setBodyweight}
          placeholder="e.g. 72.5"
          placeholderTextColor={colors.muted}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: colors.text }]}>PRs (kg)</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
            value={pr.bench}
            onChangeText={(t) => setPr((s) => ({ ...s, bench: t }))}
            placeholder="Bench"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
            value={pr.squat}
            onChangeText={(t) => setPr((s) => ({ ...s, squat: t }))}
            placeholder="Squat"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
            value={pr.deadlift}
            onChangeText={(t) => setPr((s) => ({ ...s, deadlift: t }))}
            placeholder="Deadlift"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={saveProfile} disabled={saving}>
          <Text style={styles.saveText}>
            {saving ? "Saving..." : "Save Profile"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODYWEIGHT HISTORY */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.accent }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Bodyweight History</Text>
        {weightHistory.length === 0 ? (
          <Text style={[styles.sub, { color: colors.muted }]}>No logs yet. Save your bodyweight above to start tracking!</Text>
        ) : (
          <FlatList
            data={weightHistory}
            keyExtractor={(i, idx) => i.ts + idx}
            renderItem={renderWeightItem}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 18 
  },
  avatar: { 
    width: 84, 
    height: 84, 
    borderRadius: 12, 
    backgroundColor: "#111" 
  },
  username: { 
    fontWeight: "700", 
    fontSize: 18 
  },
  small: { 
    fontSize: 14,
    marginTop: 2,
  },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutText: { 
    color: "#000", 
    fontWeight: "700" 
  },

  card: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardTitle: {
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 16,
  },
  label: { 
    marginTop: 8, 
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  saveBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  saveText: { 
    color: "#000", 
    textAlign: "center", 
    fontWeight: "700" 
  },

  sub: { 
    fontSize: 14,
    fontStyle: "italic",
  },

  weightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  weightDate: { 
    fontSize: 14,
  },
  weightVal: { 
    fontWeight: "700",
    fontSize: 14,
  },
});