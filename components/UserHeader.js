// components/UserHeader.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../lib/auth/auth-context";
import { useSettings } from "../lib/settings-context";

export default function UserHeader({ title, showSettings = false }) {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useSettings();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
      <View style={styles.leftSection}>
        {/* User Avatar */}
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Ionicons name="person" size={20} color="#000" />
        </View>
        
        {/* Username */}
        <Text style={[styles.username, { color: colors.text }]}>
          {user?.username || "User"}
        </Text>
      </View>

      {/* Page Title (centered) */}
      {title && (
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
      )}

      {/* Settings Icon */}
      {showSettings && (
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push("/settings")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      )}
      
      {!showSettings && <View style={{ width: 22 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    fontSize: 15,
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  settingsBtn: {
    padding: 4,
  },
});
