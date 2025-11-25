// app/(tabs)/workouts/index.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useAuth } from "../../../lib/auth/auth-context";
import { useSQLite } from "../../../lib/sqlite-provider";
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_SPLIT = [
  { day: 'Push Heavy', exercises:[{name:'Bench Press',percent:85,sets:5,reps:5}] },
  { day: 'Pull Heavy', exercises:[{name:'Deadlift',percent:85,sets:5,reps:5}] },
  { day: 'Leg Power', exercises:[{name:'Back Squat',percent:85,sets:5,reps:5}] },
  { day: 'Push Volume', exercises:[{name:'Incline DB Press',percent:70,sets:4,reps:10}] },
  { day: 'Pull Volume', exercises:[{name:'Pull-up',percent:60,sets:4,reps:8}] }
];

export default function Workouts({ navigation }) {
  const db = useSQLite();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);

  useEffect(()=>{
    (async ()=>{
      try {
        const res = await db.execSqlAsync('SELECT id, data, name FROM workout_plans WHERE user_id = ?', [user.id]);
        if (res.rows.length === 0) {
          const id = uuidv4();
          await db.execSqlAsync('INSERT INTO workout_plans (id, user_id, name, data, created_at) VALUES (?, ?, ?, ?, ?)', [id, user.id, 'Default 5-day', JSON.stringify(DEFAULT_SPLIT), new Date().toISOString()]);
          setPlans([{id, name:'Default 5-day', data: DEFAULT_SPLIT }]);
        } else {
          const arr=[];
          for(let i=0;i<res.rows.length;i++) arr.push(res.rows.item(i));
          setPlans(arr);
        }
      } catch(e) { console.warn(e); }
    })();
  },[]);

  return (
    <View style={{flex:1, padding:12, backgroundColor:'#111'}}>
      <Text style={{color:'#fff',fontSize:20, marginBottom:12}}>Workout Plans</Text>
      <FlatList data={plans} keyExtractor={i => i.id} renderItem={({item})=>(
        <TouchableOpacity style={{padding:12, backgroundColor:'#222', borderRadius:8, marginBottom:8}}>
          <Text style={{color:'#fff', fontWeight:'700'}}>{item.name}</Text>
        </TouchableOpacity>
      )} />
    </View>
  );
}
