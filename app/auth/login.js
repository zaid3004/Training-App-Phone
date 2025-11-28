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
import { useAuth } from "../../lib/auth/auth-context";
import { useRouter } from "expo-router";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { getFirstAsync } = useSQLite(); // FIXED NAME

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setErr("Fields cannot be empty.");
      return;
    }

    try {
      setErr("");
      setLoading(true);

      const passwordHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );

      const user = await getFirstAsync(
        "SELECT * FROM users WHERE username = ? AND password_hash = ?",
        [username, passwordHash]
      );

      if (!user) {
        setErr("Invalid username or password.");
        setLoading(false);
        return;
      }

      // 🧨 IMPORTANT FIX — store only id & username, guaranteed
      login({
        id: user.id,
        username: user.username,
      });

      router.replace("/(tabs)");
    } catch (e) {
      console.log("LOGIN ERROR:", e);
      setErr("Login failed. Try again.");
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

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
        style={styles.loginBtn}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="black" />
        ) : (
          <Text style={styles.loginText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/auth/register")}
        style={{ marginTop: 20 }}
      >
        <Text style={styles.switchText}>No account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

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
    color: "#fff",
    marginBottom: 40,
  },
  error: {
    color: "#fff",
    marginBottom: 15,
    fontSize: 14,
  },
  input: {
    backgroundColor: "#111",
    borderColor: "#fff",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    color: "white",
    marginBottom: 18,
    fontSize: 16,
  },
  loginBtn: {
    backgroundColor: "#2EF0BA",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  loginText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  switchText: {
    color: "#fff",
    fontSize: 15,
    textAlign: "center",
  },
});
