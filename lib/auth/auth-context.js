// lib/auth/auth-context.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { router } from "expo-router";
import { auth } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setProfileLoading(false);
      setProfileCompleted(false);
      return;
    }

    setProfileLoading(true);
    try {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        console.log("PROFILE STATE", {
          uid: user.uid,
          exists: snap?.exists?.(),
          data: snap?.data?.(),
        });
        setProfileLoading(false);
        setProfileCompleted(snap.exists() && snap.data()?.profileCompleted === true);
      }, (error) => {
        console.log('Profile snapshot error:', error);
        setProfileLoading(false);
        setProfileCompleted(false);
      });

      return unsubscribe;
    } catch (e) {
      console.log('onSnapshot setup error:', e);
      setProfileLoading(false);
      setProfileCompleted(false);
    }
  }, [user?.uid]);

  const login = async (identifier, password) => {
    try {
      let email = identifier;
      if (!identifier.includes('@')) {
        // It's a username, find email
        const q = query(collection(db, 'users'), where('username', '==', identifier));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          throw new Error('Username not found');
        }
        const userDoc = querySnapshot.docs[0];
        email = userDoc.data().email;
      }

      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, username, password) => {
    console.log("Starting registration for:", email);

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    console.log("User created:", firebaseUser.uid);

     await updateProfile(firebaseUser, { displayName: username });
     console.log("Profile updated");

     // Simulate user doc creation (ignore Firestore write for now)
     console.log("User registration completed");

    return { success: true, userId: firebaseUser.uid };
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth/login");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, profileCompleted, profileLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}