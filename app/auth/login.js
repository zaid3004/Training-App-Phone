import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";

import { useAuth } from "../../lib/auth/auth-context";
import { useRouter } from "expo-router";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState(""); // email or username
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert("Error", "Fields cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      await login(identifier, password);
      router.replace("/(tabs)/home");
    } catch (error) {
      setLoading(false);
      Alert.alert("Login Failed", error.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email or Username"
        placeholderTextColor="#999"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
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
        onPress={() => router.replace("/auth/register")}
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
