
// app/(tabs)/profile/index.js
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { useAuth } from "../../../lib/auth/auth-context";
import { useSQLite } from "../../../lib/sqlite-provider";

export default function ProfileScreen() {
  const { user } = useAuth();
  const db = useSQLite();

  const [name, setName] = useState("");

  // Create table + load profile
  useEffect(() => {
    async function load() {
      try {
        await db.runAsync(
          `CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY NOT NULL,
            name TEXT
          );`
        );

        const row = await db.getFirstAsync(
          "SELECT name FROM profile WHERE id = 1;"
        );

        if (row?.name) {
          setName(row.name);
        }
      } catch (e) {
        console.log("Profile load error:", e);
      }
    }

    load();
  }, []);

  // Save profile
  async function saveName() {
    try {
      await db.runAsync("DELETE FROM profile WHERE id = 1;");
      await db.runAsync("INSERT INTO profile (id, name) VALUES (1, ?);", [
        name,
      ]);

      alert("Saved!");
    } catch (e) {
      console.log("Save error:", e);
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Profile</Text>

      {user && (
        <Text style={{ marginTop: 10, fontSize: 16 }}>
          Logged in as: {user.email}
        </Text>
      )}

      <Text style={{ marginTop: 20 }}>Your Name:</Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Enter name"
        style={{
          padding: 10,
          borderWidth: 1,
          borderRadius: 6,
          marginTop: 5,
        }}
      />

      <Button title="Save" onPress={saveName} />
    </View>
  );
}
