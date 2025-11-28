// app/auth/register.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import * as Crypto from "expo-crypto";
import { useSQLite } from "../../lib/sqlite-provider";
import { useRouter } from "expo-router";

export default function Register() {
  const router = useRouter();
  const { runAsync } = useSQLite(); // UPDATED 🔥

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function generateId() {
    // 🔥 SAFEST UUID FALLBACK
    return Crypto.randomUUID
      ? Crypto.randomUUID()
      : String(Date.now()) + Math.random().toString(16).slice(2);
  }

  async function handleRegister() {
    if (!username.trim() || !password.trim()) {
      setErr("Fields cannot be empty.");
      return;
    }

    try {
      setErr("");
      setLoading(true);

      // hash password
      const passwordHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );

      const id = generateId(); // UPDATED 🔥

      // insert into users
      await runAsync(
        "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
        [id, username, passwordHash, new Date().toISOString()]
      );

      // create empty stats row
      await runAsync(
        "INSERT INTO user_stats (user_id, name, bodyweight, bench, squat, deadlift, preferences) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, "", 0, 0, 0, 0, "{}"]
      );

      setLoading(false);
      router.replace("/auth/login");
    } catch (e) {
      console.log("REGISTER ERROR:", e);
      setErr("Username already exists or database error.");
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {err ? <Text style={styles.error}>{err}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#999"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.registerBtn}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="black" />
        ) : (
          <Text style={styles.registerText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/auth/login")}
        style={{ marginTop: 20 }}
      >
        <Text style={styles.switchText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

// ======================
//      STYLES (UNCHANGED)
// ======================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 25,
    paddingTop: 120,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 40,
  },

  error: {
    color: "#FFF",
    marginBottom: 15,
    fontSize: 14,
  },

  input: {
    backgroundColor: "#111",
    borderColor: "#FFF",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    color: "white",
    marginBottom: 18,
    fontSize: 16,
  },

  registerBtn: {
    backgroundColor: "#2EF0BA",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },

  registerText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },

  switchText: {
    color: "#FFF",
    fontSize: 15,
    textAlign: "center",
  },
});
