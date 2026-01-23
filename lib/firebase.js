// lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAqDdLX2Sefve2rdFfJrLr8CQUA9MHUxDk",
  authDomain: "prvault-ec7a6.firebaseapp.com",
  projectId: "prvault-ec7a6",
  storageBucket: "prvault-ec7a6.appspot.com",
  messagingSenderId: "617750639295",
  appId: "1:617750639295:android:c98523685135d5ee2ecc0a"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);