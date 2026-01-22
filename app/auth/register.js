// app/auth/register.js
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

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);



  async function handleRegister() {

    if ( loading ) return;

    if (!email.trim() || !username.trim() || !password.trim()) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    setLoading(true);

    try {
      console.log('Calling register');
      await register(email.trim(), username.trim(), password);
      console.log('Register successful, navigating to home');
      router.replace("/home");
    } catch (error) {
      console.log('Register failed:', error);
      Alert.alert(
        "Registration Failed", 
        error?.message || "An error occurred during registration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#999"
        value={username}
        onChangeText={setUsername}
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