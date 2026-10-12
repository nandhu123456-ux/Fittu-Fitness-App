# PROJECT CONTEXT — READ FIRST, DO NOT MODIFY

## What we're building
A weight-loss mobile app: food logging, weight tracking, AI coach, AI photo food recognition.

## Stack (DO NOT CHANGE)
- React Native + Expo SDK 54
- TypeScript 5.9 (strict mode)
- Firebase: Auth (email + Google), Firestore (offline persistence), Cloud Functions, Storage
- React Navigation v7 (bottom tabs + native stack)
- State: Zustand
- Charts: react-native-svg-charts
- Camera/Barcode: expo-camera + expo-barcode-scanner
- Local cache: react-native-mmkv
- i18n: English only for now

## Folder structure (DO NOT reorganize)
```
src/
  screens/
  components/
  navigation/
  services/       # api calls, firebase wrappers
  store/          # zustand stores
  utils/          # helpers (bmr, formatting)
  types/          # shared TS types
  constants/      # colors, strings, config
functions/        # firebase cloud functions
assets/
  data/           # local JSON (indian foods, etc)
```

## Firestore collections (DO NOT rename)
- `users/{uid}`               → profile, goal, bmr, tdee, targets
- `weightLogs/{uid}/entries`  → { date, weight, note }
- `foodLogs/{uid}/entries`    → { date, mealType, items[], totalCal, totalP, totalC, totalF }
- `savedMeals/{uid}/meals`    → { name, items[] }
- `customFoods/{uid}/foods`   → { name, cal, p, c, f, serving }
- `cachedFoods/{foodId}`      → cached API results (global)
- `coachChats/{uid}/messages` → { role, content, ts }

## External APIs (fallback order — DO NOT change)
1. Local `assets/data/indianFoods.json` (search first)
2. `cachedFoods` collection (Firestore)
3. OpenFoodFacts: `https://world.openfoodfacts.org/cgi/search.pl?...&lc=en`
4. USDA FoodData Central
5. AI estimate via Cloud Function `estimateNutrition`

## AI features (via Cloud Functions ONLY — never call from app)
- `analyzeMeal(imageUrl)` → Gemini Vision → {name, cal, p, c, f}
- `coachChat(userId, message)` → GPT-4o-mini → reply string
- `estimateNutrition(foodName, portion)` → text nutrition estimate

## Coding rules — STRICT
1. NEVER rewrite existing files wholesale. Only edit the specific section needed.
2. NEVER rename files, folders, variables, or collections unless I explicitly ask.
3. NEVER install new dependencies without asking me first. Ask: "May I add X?"
4. NEVER delete code unless it's dead code you're replacing and you say so.
5. NEVER touch `package.json`, `app.json`, `firebase.json`, `tsconfig.json` unless asked.
6. Always read the target file before editing it. Use the read tool first.
7. Always show a diff-style change (what was there → what it becomes) for edits.
8. One task per response. Don't jump ahead to next feature.
9. Keep files under 250 lines. If longer, suggest splitting.
10. Use existing components/utils — check `src/components` and `src/utils` before creating new ones.
11. Use TypeScript strict mode. No `any`. Define types in `src/types/`.
12. All Firebase calls go through `src/services/` — never call Firebase directly from a screen.
13. No inline styles longer than 3 lines — use `StyleSheet.create` at bottom of file.
14. Handle loading, empty, and error states in every screen that fetches data.
15. If unsure, ASK before writing code. One clarifying question beats 200 wrong lines.

## Response format (always)
1. Files I will touch: [list]
2. Read first: [list]
3. Plan: [1–3 bullets]
4. Code: [only the changed sections]
5. What I did NOT change: [list, to reassure]
6. Next step suggestion: [1 line]

## Mode commands
- When I say "PLAN" → output only the plan, no code.
- When I say "ACT"  → output only code changes for the task.
- When I say "FIX"  → smallest possible change to fix the stated bug.