# CODEX_MASTER — Be_fit Project Roadmap

## Project state (as of now)

### Completed
- **Step 1:** Expo SDK 54 + TypeScript strict + React Navigation v7 with 4 tabs (Dashboard, Log, Progress, Coach)
- **Step 2:** Firebase Auth (email/password only) + 5-step onboarding + BMR/TDEE calculation + Firestore user profile

### What exists in the codebase
- `src/services/firebase.ts` — Firebase init with `memoryLocalCache()` deviation from context file (documented in comments)
- `src/services/auth.ts` — signUp, signIn, signOut, onAuthChange
- `src/services/user.ts` — createUserProfile, getUserProfile, updateUserProfile
- `src/store/authStore.ts` — Zustand: { user, profile, loading, error }
- `src/store/onboardingStore.ts` — Zustand: onboarding form state
- `src/screens/auth/*` — Welcome, SignIn, SignUp
- `src/screens/onboarding/*` — Gender, BodyStats, Activity, Goal, Summary + OnboardingNavigator
- `src/utils/nutrition.ts` — calculateBMR, calculateTDEE, calculateTargets (Mifflin-St Jeor)
- `src/types/user.ts` — User, UserProfile, UserGoal, Targets, Gender, ActivityLevel, GoalType
- `src/types/onboarding.ts` — OnboardingForm
- `src/navigation/RootNavigator.tsx` — 3-way auth switch (Welcome | Onboarding | Tabs)
- `src/navigation/TabNavigator.tsx` — 4 tabs, Dashboard default
- `src/screens/DashboardScreen.tsx` — placeholder (to be replaced in Task 1)
- `src/screens/LogScreen.tsx` — placeholder (to be replaced in Task 3)
- `src/screens/ProgressScreen.tsx` — placeholder (to be replaced in Task 1)
- `src/screens/CoachScreen.tsx` — placeholder (to be replaced in Task 4)

### Firestore collections in use
- `users/{uid}` — profile, goal, bmr, tdee, targets, onboardingComplete, streakDays?

### Firestore collections to add
- `users/{uid}/foodLogs/entries` — { date, mealType, items[], totals }
- `users/{uid}/weightLogs/entries` — { date, weight, note? }
- `users/{uid}/waterLogs/entries` — { date, ml }
- `users/{uid}/moodLogs/entries` — { date, mood }
- `users/{uid}/coachChats/messages` — { role, content, ts }
- `cachedFoods/{foodId}` — global cache of API results
- `customFoods/{uid}/foods` — user-created foods

### Installed packages (do not reinstall)
Expo SDK 54, TypeScript 5.9 strict, React Navigation v7, Zustand, react-native-svg 15.12.1, react-native-svg-charts, expo-camera 17.0.10, expo-image-picker, expo-image-manipulator, react-native-mmkv 4.3.2, firebase 12.19.0, @react-native-async-storage/async-storage, react-native-reanimated 4.1.1, react-native-gesture-handler.

### Design language (STRICT — applies to every screen)
- bg: #0A0A0F · surface: #16161C · surfaceHi: #1E1E26
- border: rgba(255,255,255,0.06) · text: #F5F5F7 · muted: #8A8A94
- accent: #2EE59D · accentAlt: #4CAF50
- protein: #FF6B6B · carbs: #4ECDC4 · fat: #FFD93D · water: #5EB8FF
- warn: #FFD93D · danger: #FF6B6B
- Cards: bg #16161C, radius 20, padding 20, subtle border
- NO rectangular progress bars. Rings, curves, pills, dots only.
- Animations: react-native Animated, springs for press, 900ms ease-out for mount
- Icons: @expo/vector-icons (Ionicons)

### Rules (non-negotiable)
1. Never rewrite files wholesale. Edit only the sections needed.
2. Never rename files, variables, collections, or exports unless explicitly asked.
3. Never install packages without asking. All needed packages are installed.
4. Preserve all existing comments, especially the memoryLocalCache deviation note.
5. Show a diff for every edit (old → new).
6. If unsure, ask ONE clarifying question rather than guessing.
7. Commit with explicit paths, never `git add .`.
8. Verify each task with `npx tsc --noEmit` and `npx expo export --platform android` before reporting done.
9. After each task, report: files created, files edited, files untouched, verification results.
10. Do not touch files in the Protected Set without asking.

### Protected Set
package.json, app.json, tsconfig.json, package-lock.json,
.clineignore, .gitignore, .env, .env.example,
CLINE_CONTEXT.md, AGENTS.md, CODEX_MASTER.md,
src/services/firebase.ts, src/services/auth.ts, src/services/user.ts (except as specified),
src/utils/nutrition.ts, src/store/authStore.ts, src/store/onboardingStore.ts,
src/screens/auth/*, src/screens/onboarding/*

---

# TASK 1 — Premium Dashboard & Weight Tracking

## 1.1 — Build premium DashboardScreen + supporting components/services

Create these files:
- `src/components/MomentumRing.tsx` — large SVG ring with LinearGradient stroke + centered score
- `src/components/MacroRing.tsx` — small SVG ring per metric: {label, current, target, color, unit}
- `src/components/InsightCard.tsx` — soft-glow card, icon + one-line text + "Powered by AI" tag
- `src/components/PrimaryCTA.tsx` — time-aware large pressable card with icon + title + subtitle
- `src/components/WeightCard.tsx` — sparkline + current kg + delta + prediction line
- `src/components/MoodPicker.tsx` — 5 emoji row, single-select, saves on tap
- `src/services/foodLogs.ts` — getTodaysTotals(uid) → {calories, protein, carbs, fat, perMeal}; returns zeros if empty, never throws
- `src/services/waterLogs.ts` — getTodaysWater(uid) → number; addWater(uid, ml)
- `src/services/weightLogs.ts` — getRecentWeights(uid, count) → {date, weight}[]; addWeight(uid, weight, note?); returns [] if empty
- `src/services/moodLogs.ts` — getTodayMood(uid) → string|null; setMood(uid, mood)
- `src/utils/momentum.ts` — calculateMomentum({calories, targetCalories, protein, targetProtein, streakDays, weightTrend, goal}) → {score: 0-100, label}
- `src/utils/predictWeight.ts` — predictGoalDate({currentKg, targetKg, history}) → string|null

Edit these files (only what's specified):
- `src/screens/DashboardScreen.tsx` — full premium implementation
- `src/constants/colors.ts` — add new tokens, do NOT remove existing
- `src/types/navigation.ts` — add Log route param type if missing
- `src/types/user.ts` — add optional `streakDays?: number`

### Dashboard layout (top → bottom, ScrollView + RefreshControl)
1. HEADER — time-aware greeting + date, streak pill (only if streakDays exists), avatar circle
2. INSIGHT CARD — mint glow, sparkles icon, rotating static placeholder text by day-of-week hash, "Powered by AI" tag
3. MOMENTUM RING CARD — 240px ring, stroke 16, gradient #4CAF50 → #2EE59D via SVG Defs+LinearGradient+Stop. Behind ring: same gradient 12% opacity, stroke 32px. Center: "MOMENTUM" label + score + status label (0-39 Off track danger, 40-69 Building warn, 70-100 On track accent). Below: "{eaten} eaten · {remaining} left · {target} goal". Mount animation 900ms ease-out on strokeDashoffset.
4. MACRO RINGS ROW — 4 rings (Protein #FF6B6B, Carbs #4ECDC4, Fat #FFD93D, Water #5EB8FF), 64px each, stroke 6, cap at 100% if over target
5. PRIMARY CTA — single time-aware card:
   - <10 & breakfast not logged → "Log breakfast" sunny-outline "~{target*0.25} kcal to stay on track"
   - <14 & lunch not logged → "Log lunch" restaurant-outline
   - <17 & snack not logged → "Log a snack" nutrition-outline
   - <21 & dinner not logged → "Log dinner" moon-outline "~{remaining} kcal remaining"
   - else → "Review today" checkmark-circle-outline
   - On press: navigate('Log', {mealType})
6. WEIGHT CARD — sparkline 140px, smooth bezier, gradient stroke, under-fill gradient to transparent. Below: latest weight + delta arrow. Divider, then prediction line ("At this pace: {target}kg by {date}" if ≥3 entries)
7. MOOD PICKER — "HOW DO YOU FEEL TODAY?" + 5 emojis 😞😕😐🙂😄. Highlight today's saved mood. Save to users/{uid}/moodLogs/entries.
8. SIGN OUT — centered text button, danger-muted color, calls signOut

### Momentum formula (exact)
calorieScore = 100 - min(100, |eaten - target| / target * 200)
proteinScore = min(100, (protein / targetProtein) * 100)
streakScore = min(100, streakDays * 8)
trendScore = desired ? 100 : flat ? 60 : 20
score = round(calorieScore0.35 + proteinScore0.25 + streakScore0.20 + trendScore0.20)
clamp 0-100

text
Label: 0-39 "Off track" (danger), 40-69 "Building" (warn), 70-100 "On track" (accent)

### Data flow
Promise.allSettled([getTodaysTotals, getTodaysWater, getRecentWeights, getTodayMood]). Failed sections show muted "—", not blank screen. All targets from authStore.profile.targets.

### Empty-data behavior (current state — critical)
foodLogs empty → zeros, momentum ~15-25, that's honest. waterLogs empty → 0. weightLogs empty → hide sparkline, "Log 3+ weights to see your forecast". moodLogs empty → no highlight. Dashboard must look BEAUTIFUL in this state.

### Component size limits
Each under 150 lines. If MomentumRing exceeds, split calc into utils/momentum.ts.

### Verification
- npx tsc --noEmit → exit 0
- npx expo export --platform android → clean bundle

### Commit
git add src/ App.tsx
git commit -m "feat: premium dashboard with momentum, macro rings, CTA, mood"

## 1.2 — Weight tracking screen (Progress tab)

Create: `src/screens/WeightScreen.tsx` — list of weight entries (newest first), FAB to add weight (modal with weight input + optional note), line chart of last 30 entries, swipe-to-delete, empty state if <2 entries.

Edit: `src/screens/ProgressScreen.tsx` — replace with WeightScreen content OR make ProgressScreen render WeightScreen.

Extend `src/services/weightLogs.ts` with getWeightHistory(uid, count), deleteWeight(uid, entryId).

Edit `src/types/navigation.ts` for any new routes.

### Commit
git add src/screens/WeightScreen.tsx src/screens/ProgressScreen.tsx src/services/weightLogs.ts src/navigation/ src/types/
git commit -m "feat: weight tracking screen with chart and add entry"

---

# TASK 2 — Firebase Cloud Functions

Work only in `functions/`. Do not touch `src/`.

Create:
- `functions/package.json` — firebase-functions v2, firebase-admin, @google/generative-ai, openai
- `functions/tsconfig.json`
- `functions/.env.example` — GEMINI_API_KEY, OPENAI_API_KEY, USDA_API_KEY
- `functions/src/index.ts` — export analyzeMeal, coachChat, estimateNutrition
- `functions/src/analyzeMeal.ts` — callable, accepts {imageUrl}, calls Gemini Vision, returns {name, cal, p, c, f}
- `functions/src/coachChat.ts` — callable, accepts {message}, reads user's last 3 days foodLogs + profile.targets, calls GPT-4o-mini, returns reply string
- `functions/src/estimateNutrition.ts` — callable, accepts {foodName, portion}, calls GPT-4o-mini, returns {name, cal, p, c, f}
- `functions/src/utils/` — shared helpers (error handling, context fetching)
- `functions/src/types.ts` — shared types

Requirements:
- Use `firebase-functions/v2` callable
- API keys from `process.env` — never hardcode
- Strict typed JSON responses
- 10s timeout, proper HttpsError codes (invalid-argument, unauthenticated, internal)
- Authenticate all calls (verify Firebase Auth token)
- Deploy: `firebase deploy --only functions`

### Commit
git add functions/
git commit -m "feat: cloud functions for analyzeMeal, coachChat, estimateNutrition"

---

# TASK 3 — Food Logging

## 3.1 — Food search service with fallback chain

Create:
- `src/services/foodSearch.ts` — searchFood(query) implements fallback: local JSON → cachedFoods (Firestore) → OpenFoodFacts (`https://world.openfoodfacts.org/cgi/search.pl?search_terms=...&search_simple=1&action=process&json=1&lc=en`) → USDA → estimateNutrition cloud function. Cache every API result to cachedFoods/{id}.
- `src/services/customFoods.ts` — getUserCustomFoods(uid), saveCustomFood(uid, food)
- `assets/data/indianFoods.json` — 80+ common Indian dishes with {id, name, aliases[], serving, cal, protein, carbs, fat}

## 3.2 — Log screen

Edit `src/screens/LogScreen.tsx` — full implementation:
- Receives mealType from route params
- Search input with 300ms debounce
- Results list (name, kcal, P/C/F per item)
- Tap result → PortionModal → confirm → save to foodLogs
- Buttons: "Scan barcode", "Snap meal"
- Loading/empty/error states

Create: `src/components/PortionModal.tsx` — portion picker (servings/grams/units), confirm button.

## 3.3 — Barcode scanner

Create: `src/screens/BarcodeScreen.tsx` using expo-camera CameraView with `barcodeScannerSettings={{barcodeTypes: ['ean13','ean8','upc_a','upc_e']}}`. On scan → fetch OFF product API → open PortionModal. Handle permissions. Set `scanned` flag after first read.

## 3.4 — Photo recognition

Create: `src/screens/PhotoLogScreen.tsx` — take photo → upload to Firebase Storage `mealPhotos/{uid}/{ts}.jpg` → call analyzeMeal → editable FoodResultCard → confirm → save to foodLogs.

Create: `src/components/FoodResultCard.tsx` — editable nutrition card with {name, cal, p, c, f} fields.

## Commit points
git add src/services/foodSearch.ts src/services/customFoods.ts assets/data/
git commit -m "feat: food search with local + OFF + USDA + AI fallback"

git add src/screens/LogScreen.tsx src/screens/BarcodeScreen.tsx src/screens/PhotoLogScreen.tsx src/components/PortionModal.tsx src/components/FoodResultCard.tsx src/navigation/
git commit -m "feat: food logging with search, barcode, photo"

---

# TASK 4 — Coach, Settings, Analytics, Ship

## 4.1 — AI Coach chat

Edit `src/screens/CoachScreen.tsx` — inverted FlatList chat UI, input at bottom, send → call coachChat cloud function, save messages to users/{uid}/coachChats/messages, loading bubble.

Create: `src/services/coachChat.ts` — sendMessage(uid, message), getChatHistory(uid, limit).

## 4.2 — Real AI insight on dashboard

Edit `src/components/InsightCard.tsx` — replace rotating placeholder with call to dailyInsight cloud function (add function in Task 2 if missing — coordinate: add a `dailyInsight` callable to functions/src/index.ts that reads user's last 7 days and returns one sentence). Cache per day.

Create: `src/services/dailyInsight.ts` — getDailyInsight(uid) with 1-day cache in AsyncStorage.

## 4.3 — Streak logic

Create: `src/utils/streak.ts` — calculateStreak(foodLogs, weightLogs) → number of consecutive days with at least one log.
Edit: `src/services/user.ts` — add updateStreak(uid) that reads logs and writes profile.streakDays.

## 4.4 — Water deep-link + Settings

Edit `src/screens/DashboardScreen.tsx` — tap water ring → WaterModal.
Create: `src/components/WaterModal.tsx` — quick +250/+500ml buttons.

Create: `src/screens/SettingsScreen.tsx` — edit targets, change units (kg/lb), delete account (calls Firebase deleteUser), sign out.
Wire into navigation (either 5th tab or modal from Dashboard menu).

## 4.5 — Analytics + Crash reporting

Create: `src/services/analytics.ts` — wraps Firebase Analytics with logEvent helpers (screen_view, food_logged, weight_logged, coach_message_sent).
Create: `src/services/crashReporting.ts` — wraps @react-native-firebase/crashlytics if you can confirm compatibility with SDK 54; else use Sentry. ASK before installing.

## 4.6 — Offline persistence migration

ASK before starting. This is a big structural change (JS Firebase SDK → @react-native-firebase/*). Do not proceed without explicit approval.

## 4.7 — Notification system

ASK before starting. Requires expo-notifications + native config + permission handling.

## 4.8 — Submission build

Update `app.json` — app name "Be_fit", slug, version 1.0.0, splash, adaptive icon, scheme.
Update `assets/` — replace placeholder icon/splash.
Create `eas.json` with build profiles.
Run: `eas build --platform all` (ask before running).

### Commit points per sub-task
git add src/screens/CoachScreen.tsx src/services/coachChat.ts
git commit -m "feat: AI coach chat with cloud function integration"

git add src/components/InsightCard.tsx src/services/dailyInsight.ts functions/src/
git commit -m "feat: real AI daily insight on dashboard"

git add src/utils/streak.ts src/services/user.ts
git commit -m "feat: streak logic and profile update"

git add src/components/WaterModal.tsx src/screens/SettingsScreen.tsx src/navigation/
git commit -m "feat: water modal and settings screen"

git add src/services/analytics.ts app.json assets/ eas.json
git commit -m "chore: analytics, icons, submission config"

---

# EXECUTION ORDER

1. Read CODEX_MASTER.md, AGENTS.md, CLINE_CONTEXT.md fully.
2. Read the existing files in src/ that will be edited (DashboardScreen, colors.ts, types/, etc.) before editing.
3. Execute TASK 1.1 → commit → TASK 1.2 → commit.
4. Execute TASK 2 → commit.
5. Execute TASK 3.1 → commit → TASK 3.2–3.4 → commit.
6. Execute TASK 4.1 → commit → 4.2 → commit → 4.3 → commit → 4.4 → commit → 4.5 → commit.
7. STOP and ASK before 4.6 (offline migration), 4.7 (notifications), 4.8 (build).

Between each commit, run `npx tsc --noEmit` and `npx expo export --platform android`. If either fails, fix before moving on. Do NOT skip verification.

Between each task, output a short report:
- Task completed
- Files created (paths)
- Files edited (paths + 1-line diff summary)
- Verification: tsc result, expo export result
- Commit hash
- Next task

If any task is ambiguous, ask ONE question. Do not guess.

If you cannot complete a task after 2 attempts, stop and report the blocker with the exact error. Do not loop.