# 🏋️ Fitness Tracker App - PRVault

A modern fitness tracking application built with **Expo (React Native)**, **Firebase**, and **SQLite**, focused on performance, reliability, and clean state management.

The app allows users to track workouts, bodyweight, and progress over time while keeping critical data fast and available offline.

---

## ✨ Features

### 🔐 Authentication

* Firebase Authentication (email/password)
* Secure login & registration
* Persistent auth state across app restarts

---

### 👤 Account & Profile

* User profile stored **server-side** in Firebase Firestore
* Account information visible under Settings
* Secure password change using Firebase re-authentication

---

### ⚡ Fast Home Screen

* Designed to load quickly even on slow networks
* No blocking UI during data fetches
* Uses local storage for performance-critical data
* Clean separation between UI rendering and routing logic

---

### ⚖️ Bodyweight Tracking

* Displays current bodyweight clearly
* Mini bar chart showing the **previous 10 bodyweight entries** for easy comparison
* Percentage change calculation between oldest and newest entries in the window
* List of recent bodyweight logs with dates
* Firestore profile weight used as a fallback if no local logs exist

---

### 📊 Progress & Activity

* Personal Records (PRs) summary
* Recent workouts overview
* Daily progress indicator
* Motivational quotes for engagement

---

## 🧠 Architecture Overview

### Data Sources

| Data            | Storage        |
| --------------- | -------------- |
| Authentication  | Firebase Auth  |
| User profile    | Firestore      |
| Bodyweight logs | SQLite (local) |
| Workouts & PRs  | SQLite         |

### Key Principles

* **Firestore is the source of truth** for user profile data
* **SQLite is used for speed and offline reliability**
* UI never assumes data exists unless validated
* Routing decisions are handled centrally, not inside screens

---

## 🛂 Routing & State Management

* Uses `expo-router`
* Authentication and profile state handled via Context Providers
* Global routing guard prevents invalid navigation states
* Screens never redirect based on partially loaded data

---

## 🛠 Tech Stack

* **Expo (React Native)**
* **expo-router**
* **Firebase Authentication**
* **Firebase Firestore**
* **SQLite (expo-sqlite)**
* **Context API**

---

## 🚀 Getting Started

### 1️⃣ Install dependencies

```bash
npm install
```

### 2️⃣ Configure Firebase

Create a Firebase project and enable:

* Authentication (Email / Password)
* Firestore Database

Add your Firebase config to the app initialization file.

> Firestore is initialized with React Native–safe settings to avoid network hangs.

---

### 3️⃣ Run the app

```bash
npx expo start
```

For native features or local builds:

```bash
npx expo run:android
```

---

## 📦 Building an Android APK

Using EAS:

```bash
npx eas build -p android
```

The build uses the exact source snapshot at build time.

---

## ❌ Common Issues This App Avoids

* Infinite loading screens
* UI blocking on network requests
* Data inconsistency between local and server storage
* Redirect loops on app reload
* Profile state desynchronization

---

## 🧩 Planned Improvements

* Advanced analytics & insights
* Goal-based progress projections
* Cloud sync enhancements
* Pro / premium feature tier
* Wearable integrations

---

## 📜 License

This project is currently private / personal.
All rights reserved unless stated otherwise.
