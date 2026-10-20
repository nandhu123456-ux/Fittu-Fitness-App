# 🦅 Fittu - Eat Better. Live Stronger.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)]()
[![Expo](https://img.shields.io/badge/Expo-1B1F23?style=flat&logo=expo&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)]()
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)]()

**Fittu** is a premium, dark-mode fitness and nutrition tracking mobile application built with React Native and Expo. It goes beyond basic step counting by syncing natively with Android Health Connect, calculating exact daily calorie deficits, and estimating actual fat loss.

## 📱 Screenshots
*(Replace with your actual screenshot links once uploaded to GitHub)*
| Dashboard | Stats & Graphs | AI Coach |
| :---: | :---: | :---: |
| <img src="link_to_dashboard_image.png" width="250"/> | <img src="link_to_stats_image.png" width="250"/> | <img src="link_to_chat_image.png" width="250"/> |

## ✨ Key Features
*   **Native Health Connect Integration:** Syncs steps, active calories, distance, and resting BMR automatically from the device in real-time.
*   **Smart Deficit & Fat Loss Math:** Calculates `(Food Eaten) - (Active Burn + BMR + Manual Workout)` to provide users with an estimated fat loss metric in **KG**.
*   **Custom Workout Burn:** Allows users to manually add extra calories burned (e.g., from weightlifting) if their watch didn't track it, instantly recalculating the daily deficit.
*   **Custom Food Database:** Users can create, edit, and delete their own meals with a seamless toggle UI.
*   **AI Nutrition Coach:** A built-in chat assistant that knows your daily macros and logging streak to keep you motivated.
*   **Beautiful Data Visualization:** Custom `react-native-svg` bar charts with horizontal goal-lines and consistency scores for weekly tracking.
*   **Local Notifications:** Customizable reminders for meals, water, and sleep.

## 🛠️ Tech Stack
*   **Frontend:** React Native, Expo, TypeScript
*   **Backend / Database:** Firebase (Firestore, Auth)
*   **Native Android:** Health Connect (`react-native-health-connect`), Kotlin
*   **UI & Graphics:** `react-native-svg`, `react-native-svg-charts`
*   **State Management:** Zustand

## 🧠 Technical Challenges Overcome
1.  **Native Permission Delegates:** Successfully injected the Health Connect permission delegate into `MainActivity.kt` to handle Android 14+ permission flows correctly.
2.  **Release Build Optimization:** Configured custom Proguard rules (`extraProguardRules`) to prevent R8 from stripping critical Nitro/MMKV modules during minified release builds.
3.  **Local APK Generation:** Bypassed cloud build limits by generating a signed production `.apk` locally using Gradle and a custom release keystore.

## 🚀 Getting Started
To run this project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/your-repo.git
Install dependencies:

bash
npm install
Create a .env file in the root and add your Firebase config:

env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
...
Start the app:

bash
npx expo start
📲 Try the App (Android Only)
You can download the latest release APK and test it on your Android device:
👉 Download Fittu APK  --->//DRIVE LINK 

🔒 Security Note
This project uses Firebase client-side configurations. The exposed API keys are designed to be public and are protected by strict Firestore Security Rules (request.auth.uid == uid), ensuring users can only access their own health and nutrition data.

Developed by [NANDA VARDHAN REDDY]

LinkedIn//-->

GitHub//-->