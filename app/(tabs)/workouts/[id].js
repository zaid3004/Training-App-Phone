// app/(tabs)/workouts/[id].js
import React from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
export default function Detail(){ const { id } = useLocalSearchParams(); return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Plan {id}</Text></View>; }
