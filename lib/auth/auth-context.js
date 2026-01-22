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
    let firebaseUser = null;

    try {
      console.log("Starting registration for:", email);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = userCredential.user;
      console.log("User created:", firebaseUser.uid);

      await updateProfile(firebaseUser, { displayName: username });
      console.log("Profile updated");

      // Store in Firestore with retry + timeout
      await setUserDocWithRetry(db, firebaseUser.uid, {
        email,
        username,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("Firestore doc created");

      return { success: true, userId: firebaseUser.uid };
    } catch (error) {
      console.log("Registration error:", error);

      // Rollback: if Firestore fails, delete the auth user to prevent zombie accounts
      if (firebaseUser && (error?.message?.includes("Firestore") || error?.message?.includes("write timed out") || error?.code?.includes("firestore"))) {
        try {
          await deleteUser(firebaseUser);
          console.log("Rolled back auth user due to Firestore failure");
        } catch (delErr) {
          console.log("Failed to rollback auth user:", delErr);
        }
      }

      throw error;
    }
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