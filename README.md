
<h1 align="center">🦅 Fittu - Eat Better. Live Stronger.</h1>
<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="#"><img src="https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React Native"></a>
  <a href="#"><img src="https://img.shields.io/badge/Expo-1B1F23?style=flat&logo=expo&logoColor=white" alt="Expo"></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="#"><img src="https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black" alt="Firebase"></a>
</p>

<p align="center">
  <b>Fittu</b> is a premium, dark-mode fitness and nutrition tracking mobile application built with React Native and Expo. It goes beyond basic step counting by syncing natively with Android Health Connect, calculating exact daily calorie deficits, and estimating actual fat loss.
</p>

## 📱 Screenshots

| App Logo | Dashboard | Food Log |
| :---: | :---: | :---: |
| <img src="https://github.com/user-attachments/assets/9dd850d4-b76d-4a88-88be-31d76470f052" width="180"/> | <img src="https://github.com/user-attachments/assets/4f5b5bd3-2bdf-499b-bc9f-379ab6748742" width="180"/> | <img src="https://github.com/user-attachments/assets/89c97bfc-5a1b-49c1-85c5-0d38d45b4a1f" width="180"/> |
| **Progress** | **Stats & Graphs** | **AI Coach** |
| <img src="https://github.com/user-attachments/assets/354ce066-57a4-47db-8d4d-b17f3326d5e0" width="180"/> | <img src="https://github.com/user-attachments/assets/7d2b5f2f-5f32-440b-9675-d9bead006457" width="180"/> | <img src="https://github.com/user-attachments/assets/3a299228-18e2-43c3-89d2-8f3d5a8a4573" width="180"/> |

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

## 🏗️ App Architecture

```mermaid
graph TD
    A[User opens Fittu App] --> B{Login / Sign Up};
    B --> C[Dashboard];
    C --> D[View Macros & Stats];
    C --> E[Log Food];
    C --> F[Log Water & Sleep];
    C --> G[Chat with AI Coach];

    D --> H[Syncs with Health Connect];
    H --> I[Calculates Fat Loss];

    E --> J[AI Search & Custom Food DB];
    F --> K[Sets Reminders];

    subgraph "Backend (Firebase)"
        L[Firestore DB]
        M[Authentication]
    end

    C -.-> L;
    B -.-> M;
