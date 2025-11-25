// app/(tabs)/index.js
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../../lib/auth/auth-context";
import { useRouter } from "expo-router";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  return (
    <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#111'}}>
      <Text style={{color:'#fff',fontSize:28, fontWeight:'700'}}>PRVault</Text>
      <Text style={{color:'#ccc', marginTop:8}}>Welcome, {user?.username}</Text>
      <TouchableOpacity onPress={() => router.push('/workouts')} style={{marginTop:20, padding:12, backgroundColor:'#222', borderRadius:8}}>
        <Text style={{color:'#fff'}}>Open Workouts</Text>
      </TouchableOpacity>
    </View>
  );
}
