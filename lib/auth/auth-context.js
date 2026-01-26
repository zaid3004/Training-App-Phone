// lib/auth/auth-context.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth";
import { deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
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

      // Store in Firestore with retry + timeout (best-effort, non-blocking)
      setUserDocWithRetry(db, firebaseUser.uid, {
        email,
        username,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
        .then(() => console.log("Firestore doc created (background)"))
        .catch((e) =>
          console.log("Firestore write failed (background):", e?.code, e?.message)
        );

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

  // 7) Delete account (best-effort with best-practices: re-auth, best-effort Firestore delete, local wipe, auth delete)
  const deleteAccount = async (password, dbLocal) => {
    const current = auth.currentUser;
    if (!current?.email) throw new Error("User not loaded.");

    // 1) Re-auth (required by Firebase for sensitive ops)
    const cred = EmailAuthProvider.credential(current.email, password);
    await reauthenticateWithCredential(current, cred);

    // 2) Firestore delete (best-effort, non-blocking on failure)
    try {
      await deleteDoc(doc(db, "users", current.uid));
      console.log("Firestore user doc deleted (best-effort)");
    } catch (e) {
      console.log("Firestore delete failed (best-effort):", e?.code, e?.message);
    }

    // 3) Wipe local SQLite data
    if (dbLocal) {
      try {
        await dbLocal.execAsync("DELETE FROM user_stats WHERE user_id = ?", [current.uid]);
        await dbLocal.execAsync("DELETE FROM bodyweight_logs WHERE user_id = ?", [current.uid]);
        await dbLocal.execAsync("DELETE FROM user_settings WHERE user_id = ?", [current.uid]);
        await dbLocal.execAsync("DELETE FROM user_prs WHERE user_id = ?", [current.uid]);

        const logs = await dbLocal.getAllAsync("SELECT id FROM workout_logs WHERE user_id = ?", [current.uid]);
        for (const l of logs) {
          await dbLocal.execAsync("DELETE FROM workout_sets WHERE workout_log_id = ?", [l.id]);
        }
        await dbLocal.execAsync("DELETE FROM workout_logs WHERE user_id = ?", [current.uid]);
        await dbLocal.execAsync("DELETE FROM workouts WHERE user_id = ?", [current.uid]);
      } catch (e) {
        console.log("SQLite wipe error:", e);
      }
    }

    // 4) Firebase Auth user deletion
    try {
      await deleteUser(current);
      console.log("Firebase Auth user deleted");
    } catch (e) {
      // If user already deleted or other error, log but don't block flow
      console.log("Firebase user delete failed:", e?.code, e?.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
