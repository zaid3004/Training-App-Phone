// app/(tabs)/settings/index.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useSQLite } from "../../../lib/sqlite-provider";
import { useAuth } from "../../../lib/auth/auth-context";
import { useSettings } from "../../../lib/settings-context";

export default function Settings() {
  const { user, logout } = useAuth();
  const db = useSQLite();
  const { theme, accent, colors, updateTheme, updateAccent, ACCENTS } = useSettings();

  // Delete account state
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("Logging out...");
            await logout();
            console.log("Logout successful, navigating to login...");
            // Use push with reset to clear the navigation stack
            router.push("/auth/login");
          } catch (error) {
            console.log("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  }

  async function handleDeleteAccount() {
    const expectedInput = `sudo delete: ${user.username}`;

    if (deleteInput.trim() !== expectedInput) {
      Alert.alert(
        "Incorrect Command ❌",
        `You must type exactly:\n\nsudo delete: ${user.username}`,
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "⚠️ FINAL WARNING",
      "This will permanently delete your account and ALL your data. This cannot be undone.\n\nAre you absolutely sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            setDeleteInput("");
            setShowDeleteSection(false);
          },
        },
        {
          text: "DELETE FOREVER",
          style: "destructive",
          onPress: executeAccountDeletion,
        },
      ]
    );
  }

  async function executeAccountDeletion() {
    try {
      setDeleting(true);
      console.log("Deleting account for user:", user.id);

      await db.execAsync(`DELETE FROM user_settings WHERE user_id = '${user.id}'`);
      await db.execAsync(`DELETE FROM bodyweight_logs WHERE user_id = '${user.id}'`);
      await db.execAsync(`DELETE FROM user_stats WHERE user_id = '${user.id}'`);

      try {
        await db.execAsync(`DELETE FROM workout_logs WHERE user_id = '${user.id}'`);
      } catch (e) {}

      try {
        await db.execAsync(`DELETE FROM workouts WHERE user_id = '${user.id}'`);
      } catch (e) {}

      try {
        await db.execAsync(
          `DELETE FROM workout_sets WHERE workout_id IN (SELECT id FROM workouts WHERE user_id = '${user.id}')`
        );
      } catch (e) {}

      await db.execAsync(`DELETE FROM users WHERE id = '${user.id}'`);
      console.log("Deleted user account");

      await logout();
      router.replace("/auth/login");
      Alert.alert("Account Deleted", "Your account has been permanently deleted.");
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert("Error", "Failed to delete account. " + error.message);
      setDeleting(false);
    }
  }

  function AccentButton({ keyName, colorHex }) {
    const selected = accent === keyName;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => updateAccent(keyName)}
        style={[
          styles.accentBtn,
          { borderColor: selected ? colors.accent : "transparent" },
        ]}
      >
        <View style={[styles.accentCircle, { backgroundColor: colorHex }]} />
        {selected && (
          <Ionicons name="checkmark" size={16} color="#000" style={styles.accentCheck} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* APPEARANCE */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>

          <View style={styles.row}>
            <View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Theme</Text>
              <Text style={[styles.rowSubtitle, { color: colors.muted }]}>
                Full UI theme (backgrounds, text, cards)
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.smallLabel, { color: colors.text }]}>
                {theme === "dark" ? "Dark" : "Light"}
              </Text>
              <Switch
                value={theme === "dark"}
                onValueChange={(v) => updateTheme(v ? "dark" : "light")}
                trackColor={{ false: colors.muted, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={[styles.row, { paddingVertical: 16 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Accent color</Text>
              <Text style={[styles.rowSubtitle, { color: colors.muted }]}>
                Brand color applied across UI
              </Text>

              <View style={styles.accentRow}>
                <AccentButton keyName="original" colorHex={ACCENTS.original} />
                <AccentButton keyName="darkblue" colorHex={ACCENTS.darkblue} />
                <AccentButton keyName="pink" colorHex={ACCENTS.pink} />
                <AccentButton keyName="bloodred" colorHex={ACCENTS.bloodred} />
                <AccentButton keyName="lime" colorHex={ACCENTS.lime} />
              </View>
            </View>
          </View>
        </View>

        {/* ACCOUNT */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>

          <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="log-out-outline"
                size={18}
                color={colors.text}
                style={{ marginRight: 12 }}
              />
              <Text style={[styles.actionText, { color: colors.text }]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { marginTop: 8 }]}
            onPress={() => setShowDeleteSection(!showDeleteSection)}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="trash-outline"
                size={18}
                color="#ff6a6a"
                style={{ marginRight: 12 }}
              />
              <Text style={[styles.actionText, { color: "#ff6a6a" }]}>Delete account</Text>
            </View>
            <Ionicons
              name={showDeleteSection ? "chevron-down" : "chevron-forward"}
              size={18}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>

        {/* DELETE ACCOUNT SECTION */}
        {showDeleteSection && (
          <View style={[styles.section, styles.dangerSection]}>
            <View style={styles.dangerCard}>
              <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>

              <Text style={styles.deleteWarning}>
                This action is irreversible. All your workouts, PRs, bodyweight logs,
                and account data will be permanently deleted.
              </Text>

              <Text style={styles.deleteInstruction}>
                Type the following command to confirm deletion:
              </Text>

              <View style={styles.commandBox}>
                <Text style={[styles.deleteCommand, { color: colors.accent }]}>
                  sudo delete: {user?.username}
                </Text>
              </View>

              <TextInput
                style={styles.deleteInput}
                value={deleteInput}
                onChangeText={setDeleteInput}
                placeholder="Type command here..."
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.deleteButtonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setDeleteInput("");
                    setShowDeleteSection(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    deleting && styles.deleteButtonDisabled,
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={deleting}
                >
                  <Text style={styles.deleteButtonText}>
                    {deleting ? "Deleting..." : "Delete Forever"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>What will be deleted:</Text>
                <Text style={styles.infoItem}>• Your account credentials</Text>
                <Text style={styles.infoItem}>• All workout logs</Text>
                <Text style={styles.infoItem}>• All bodyweight history</Text>
                <Text style={styles.infoItem}>• All personal records (PRs)</Text>
                <Text style={styles.infoItem}>• All settings & preferences</Text>
                <Text style={styles.infoNote}>
                  This data cannot be recovered after deletion.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  rowTitle: {
    fontWeight: "700",
    fontSize: 15,
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  rowRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  smallLabel: {
    marginBottom: 6,
    fontSize: 12,
  },
  accentRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
  },
  accentBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    overflow: "hidden",
    marginRight: 10,
  },
  accentCircle: {
    width: 36,
    height: 36,
    borderRadius: 9,
  },
  accentCheck: {
    position: "absolute",
  },
  actionRow: {
    paddingVertical: 14,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionText: {
    fontSize: 15,
    fontWeight: "700",
  },
  dangerSection: {
    backgroundColor: "#0a0000",
    borderTopWidth: 2,
    borderTopColor: "#ff4444",
  },
  dangerCard: {
    backgroundColor: "#1a0000",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ff4444",
  },
  dangerTitle: {
    color: "#ff4444",
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 12,
  },
  deleteWarning: {
    color: "#ff6666",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteInstruction: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 8,
  },
  commandBox: {
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  deleteCommand: {
    fontFamily: "monospace",
    fontSize: 14,
  },
  deleteInput: {
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#ff4444",
    fontFamily: "monospace",
    fontSize: 14,
    marginBottom: 16,
  },
  deleteButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#222",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#ff4444",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: "#0a0a0a",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  infoTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  infoItem: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 4,
  },
  infoNote: {
    color: "#ff6666",
    fontSize: 11,
    marginTop: 8,
    fontStyle: "italic",
  },
});