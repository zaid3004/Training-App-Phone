// lib/profile/profile-context.js
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from "../firebase";
import { useAuth } from "../auth/auth-context";

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { user } = useAuth();

  const [profileLoading, setProfileLoading] = useState(true); // Start as loading
  const [profile, setProfile] = useState(null); // doc data
  const [profileExists, setProfileExists] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setProfileExists(false);
      setProfileLoading(false);
      return;
    }

    // Load cached profileCompleted
    const loadCachedProfile = async () => {
      try {
        const cached = await AsyncStorage.getItem(`profile_${user.uid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setProfile(parsed);
          setProfileExists(true);
          // Assume completed if cached
        }
      } catch (e) {
        console.log('Error loading cached profile:', e);
      }
    };

    loadCachedProfile();

    setProfileLoading(true);

    const ref = doc(db, "users", user.uid);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : null;
        setProfileExists(snap.exists());
        setProfile(data);
        setProfileLoading(false);
        // Cache the profile
        if (data) {
          AsyncStorage.setItem(`profile_${user.uid}`, JSON.stringify(data)).catch(e => console.log('Cache error:', e));
        }
      },
      (err) => {
        console.log("Profile snapshot error:", err);
        setProfileLoading(false);
      }
    );

    return unsub;
  }, [user?.uid]);

  const value = useMemo(() => ({
    profileLoading,
    profile,
    profileExists,
    setProfile, // used for immediate UI update after onboarding
  }), [profileLoading, profile, profileExists]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  return useContext(ProfileContext);
}