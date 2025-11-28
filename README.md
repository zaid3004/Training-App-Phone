# PR Vault – Mobile Fitness Tracker (Expo + SQLite)

PR Vault is a fully offline-capable fitness tracking app built with **Expo**, **expo-router**, and **SQLite**.  
It helps users log workouts, track bodyweight, maintain streaks, and visualize personal records — all with a clean, modern UI and customizable themes.

---

## ⭐ Key Features

### **🏠 Home Dashboard**
- Daily progress ring  
- Streak counter  
- PR summary (Bench, Squat, Deadlift)  
- Recent weight logs  
- Quick action buttons  
- Mini bodyweight chart  

---

### **👤 Profile**
- User details
- Editable information (WIP)
- Displays current theme + accent (automatic)

---

### **⚙️ Settings (Fully Functional + Persistent)**
The settings system stores all user preferences in **SQLite**, per user.

#### **Appearance**
- **Light / Dark theme**
- **Accent colors**  
  - Original (teal)  
  - Dark blue  
  - Baby pink  
  - Blood red  
  - Lime green  
- Updates are **instant**, no confirmation required  
- Settings persist across sessions using a per-user `user_settings` table

#### **Notifications**
- Toggle for app notifications (placeholder for now)
- Saves instantly to SQLite

#### **Account Management**
- **Logout** (via AuthContext)
- **Delete Account**  
  - Deletes user, stats, logs, workouts, sets, settings  
  - Logs out automatically  
  - Redirects to Register

---

### **🧩 Authentication**
Located in `app/auth/`:
- `login.js`
- `register.js`

App root (`app/index.js`) automatically:
- Redirects unauthenticated users → `/auth/login`
- Redirects logged-in users → `/ (tabs)/home`

---

### **📁 Directory Structure**

app
├── (tabs)
│ ├── _layout.js
│ ├── home/
│ ├── profile/
│ ├── settings/
│ └── workouts/
├── auth/
│ ├── login.js
│ └── register.js
├── _layout.js
└── index.js

yaml
Copy code

---

### **🗄 Database**
Using a custom `SQLiteProvider`.

Tables used:
- `users`
- `user_stats`
- `bodyweight_logs`
- `workouts`
- `workout_sets`
- `user_settings` ← stores theme/accent/notifications

---

## 📦 Tech Stack
- **Expo**
- **expo-router**
- **React Native**
- **SQLite (expo-sqlite)**
- **Context API**
- **Ionicons**
- **Shared layout components (SafeAreaView, ScrollView)**

---

## 🚧 Roadmap
- Splash animation with shrinking logo → login/register
- Full global theme provider using React Context
- Workout editing & detailed history
- Advanced charts (PR progress, volume tracking)
- Export data (optional future feature)

---

## 📝 Notes
PR Vault is designed to be **fast**, **simple**, and **offline-first**.  
All settings and logs persist locally without external servers.

---

Made by Zaid.