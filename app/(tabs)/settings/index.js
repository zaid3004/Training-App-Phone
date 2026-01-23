import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuth } from '../../../lib/auth/auth-context';
import { useSettings } from '../../../lib/settings-context';
import { db } from '../../../lib/firebase';
import { MOTIVATIONAL_QUOTES } from '../../../constants/motivationalQuotes';
import Header from '../../../components/Header';
import { Ionicons } from '@expo/vector-icons';

export default function Settings() {
  const { user } = useAuth();
  const { colors, theme, accent, updateTheme, updateAccent, logout } = useSettings();
  const router = useRouter();
  const [username, setUsername] = useState('Loading...');

  // Notification states
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifTime, setNotifTime] = useState('20:00');
  const [scheduleId, setScheduleId] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    async function loadUsername() {
      if (!user?.uid) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username || 'N/A');
        } else {
          setUsername('N/A');
        }
      } catch (e) {
        console.log('Error loading username:', e);
        setUsername('Error');
      }
    }
    loadUsername();
  }, [user?.uid]);

  // Load notification settings
  useEffect(() => {
    async function loadNotifSettings() {
      try {
        const enabled = await AsyncStorage.getItem('@notif_enabled');
        const time = await AsyncStorage.getItem('@notif_time');
        const id = await AsyncStorage.getItem('@notif_schedule_id');

        setNotifEnabled(enabled === 'true');
        setNotifTime(time || '20:00'); // Default to 20:00 initially
        if (id) setScheduleId(id);
      } catch (e) {
        console.log('Error loading notif settings:', e);
        setNotifTime('20:00'); // Fallback time if user settings fail to load or user forgets to set a
      }
    }
    loadNotifSettings();
  }, []);

  // Logout only button and color/theme selectors

  async function handleLogout() {
    if (logout) {
      await logout();
    }
    router.replace('/auth/login');
  }

  // Notification functions
  async function requestNotifPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  async function ensureAndroidChannel() {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  async function scheduleDailyMotivation(timeString) {
    await ensureAndroidChannel();

    const parts = timeString.split(':');
    if (parts.length !== 2) throw new Error('Invalid time format');
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error('Invalid time values');
    }
    const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'PRVault',
        body: quote,
        data: { type: 'daily_motivation' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        repeats: true,
      },
    });

    await AsyncStorage.setItem('@notif_schedule_id', identifier);
    setScheduleId(identifier);
    return identifier;
  }

  async function cancelDailyMotivation() {
    if (scheduleId) {
      await Notifications.cancelScheduledNotificationAsync(scheduleId);
      await AsyncStorage.removeItem('@notif_schedule_id');
      setScheduleId(null);
    }
  }

  async function handleNotifToggle(value) {
    if (value) {
      const granted = await requestNotifPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Notifications are disabled. Enable them in system settings.');
        return;
      }
      await scheduleDailyMotivation(notifTime);
    } else {
      await cancelDailyMotivation();
    }
    setNotifEnabled(value);
    await AsyncStorage.setItem('@notif_enabled', value.toString());
  }

  async function handleTimeChange(event, selectedDate) {
    setShowTimePicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTime = `${hours}:${minutes}`;

      setNotifTime(newTime);
      await AsyncStorage.setItem('@notif_time', newTime);
      if (notifEnabled) {
        await cancelDailyMotivation();
        await scheduleDailyMotivation(newTime);
      }
    }
  }

  async function sendTestNotification() {
    const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'PRVault Test',
        body: quote,
        data: { type: 'test' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5
      },
    });

    Alert.alert('Test Sent', 'You should receive a test notification in 5 seconds.');
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>

      {/* Theme */}
      <View style={[styles.section, { borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme</Text>
        <View style={styles.themeRow}>
          {[
            { key: 'light', label: 'Light' },
            { key: 'dark', label: 'Dark' },
          ].map(t => (
            <TouchableOpacity key={t.key} onPress={() => updateTheme(t.key)} style={[styles.themeOption, { borderColor: colors.muted }, theme === t.key && { borderColor: colors.accent }]}>
              <Text style={{ color: colors.text }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
       </View>
        {/* Accent */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Accent Color</Text>
          <View style={styles.themeRow}>
            {[
              { key: 'teal', label: 'Teal' },
              { key: 'blue', label: 'Blue' },
              { key: 'pink', label: 'Pink' },
              { key: 'red', label: 'Red' },
              { key: 'lime', label: 'Lime' },
            ].map(a => (
              <TouchableOpacity key={a.key} onPress={() => updateAccent(a.key)} style={[styles.themeOption, { borderColor: colors.muted }, accent === a.key && { borderColor: colors.accent }]}>
                <Text style={{ color: colors.text }}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
       </View>
        <View style={[styles.section, { borderColor: colors.border }]}>
           <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
           <TouchableOpacity
             onPress={() => router.push('/settings/account-information')}
             style={[styles.accountBtn, { borderColor: colors.accent }]}
           >
             <Text style={{ color: colors.text }}>Account Information</Text>
             <Text style={{ color: colors.muted }}>View and edit your profile</Text>
           </TouchableOpacity>
         </View>

         {/* Notifications */}
         <View style={[styles.section, { borderColor: colors.border }]}>
           <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>

           <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
             <Text style={{ color: colors.text }}>Daily reminder</Text>
             <TouchableOpacity
               onPress={() => handleNotifToggle(!notifEnabled)}
               style={[styles.toggle, notifEnabled && { backgroundColor: colors.accent }]}
             >
               <View style={[styles.toggleKnob, notifEnabled && { transform: [{ translateX: 20 }] }]} />
             </TouchableOpacity>
           </View>

           {notifEnabled && (
             <>
               <Text style={[styles.label, { color: colors.text }]}>Reminder time</Text>
               <TouchableOpacity
                 style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.accent, borderWidth: 1, borderRadius: 6, padding: 8, marginTop: 4, justifyContent: 'center' }]}
                 onPress={() => setShowTimePicker(true)}
               >
                 <Text style={{ color: colors.text }}>{notifTime}</Text>
               </TouchableOpacity>

               {showTimePicker && (
                 <DateTimePicker
                   value={new Date(`1970-01-01T${notifTime}:00`)}
                   mode="time"
                   is24Hour={true}
                   display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                   onChange={handleTimeChange}
                 />
               )}

               <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                 Example: '{MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]}'
               </Text>

               <TouchableOpacity
                 onPress={sendTestNotification}
                 style={[styles.testBtn, { borderColor: colors.accent }]}
               >
                 <Text style={{ color: colors.accent, fontWeight: '600' }}>Send Test Notification</Text>
               </TouchableOpacity>
             </>
           )}
         </View>

        {/* Feedback */}
       <View style={[styles.section, { borderColor: colors.border }]}>
         <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Us</Text>
         <TouchableOpacity onPress={() => Linking.openURL('mailto:prvault1@gmail.com')} style={[styles.feedbackBtn, { borderColor: colors.accent }]}>
           
           <Text style={{ color: colors.text }}><Ionicons name="mail" size={20} color={colors.text} /> Email: prvault1@gmail.com</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => Linking.openURL('tel:+971545900728')} style={[styles.feedbackBtn, { borderColor: colors.accent }]}>
           
           <Text style={{ color: colors.text }}><Ionicons name="call" size={20} color={colors.text} /> Phone: +971 54 590 0728</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com/pr_vaul.t')} style={[styles.feedbackBtn, { borderColor: colors.accent }]}>
           <Text style={{ color: colors.text }}><Ionicons name="logo-instagram" size={20} color={colors.text} /> Instagram: @pr_vaul.t</Text>
         </TouchableOpacity>
       </View>

       {/* Logout */}
       <TouchableOpacity style={[styles.logoutBtn, { borderColor: '#000', backgroundColor: colors.accent }]} onPress={handleLogout}>
         <Text style={[styles.logoutText]}>Logout</Text>
       </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  section: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  themeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  themeOption: { padding: 8, borderRadius: 6, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  feedbackBtn: { padding: 10, borderRadius: 6, borderWidth: 1, marginBottom: 8 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#ccc', justifyContent: 'center' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', marginLeft: 2 },
  accountBtn: { padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 8 },
  testBtn: { padding: 10, borderRadius: 6, borderWidth: 1, marginTop: 12, alignItems: 'center' },
  logoutBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 16, backgroundColor: '#ff4d4d' },
  logoutText: { color: '#000', fontWeight: '700', textAlign: 'center', justifyContent: 'center', alignItems: 'center' },
});
