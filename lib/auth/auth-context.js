// lib/auth/auth-context.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, deleteUser } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { router } from "expo-router";
import { auth, db } from "../firebase";

// Timeout wrapper for promises
const withTimeout = (promise, ms = 12000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firestore write timed out")), ms)
    ),
  ]);

// Sleep utility for retries
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Retry wrapper for setDoc with exponential backoff
export async function setUserDocWithRetry(db, uid, data) {
  const ref = doc(db, "users", uid);
  let lastErr = null;

  // Retry delays: immediate, 600ms, 1500ms
  const delays = [0, 600, 1500];

  for (const d of delays) {
    if (d) await sleep(d);
    try {
      await withTimeout(setDoc(ref, data, { merge: true }), 12000);
      return; // success
    } catch (e) {
      lastErr = e;
      console.log("Firestore setDoc attempt failed:", e?.message || e);
    }
  }

  throw lastErr;
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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

    // Firestore = best-effort background sync (DO NOT BLOCK REGISTRATION)
    setUserDocWithRetry(db, firebaseUser.uid, {
      email,
      username,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
      .then(() => console.log("Firestore doc created"))
      .catch((e) =>
        console.log("Firestore write failed (background):", {
          code: e?.code,
          message: e?.message,
          name: e?.name,
        })
      );

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
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}