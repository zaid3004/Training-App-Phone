// app/(tabs)/settings/index.js
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../../../lib/auth/auth-context";

export default function Settings() {
  const { user, logout } = useAuth();
  return (
    <View style={{flex:1,padding:12,backgroundColor:'#111'}}>
      <Text style={{color:'#fff', fontSize:20}}>Account</Text>
      <Text style={{color:'#ccc', marginTop:8}}>Signed in: {user?.username}</Text>
      <TouchableOpacity onPress={() => logout()} style={{marginTop:20, padding:12, backgroundColor:'#ff4444', borderRadius:8}}>
        <Text style={{color:'#fff'}}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
