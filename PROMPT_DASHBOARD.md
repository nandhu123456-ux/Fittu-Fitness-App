# Task: Build a UNIQUE, premium DashboardScreen

Do NOT copy standard fitness-app layouts. This is the hero screen — visual quality, daily engagement, and emotional pull matter more than code brevity.

## Before writing code
Read these in order (do not modify them):
- CLINE_CONTEXT.md
- src/screens/DashboardScreen.tsx (current placeholder)
- src/store/authStore.ts
- src/services/firebase.ts
- src/types/user.ts
- src/navigation/TabNavigator.tsx
- src/types/navigation.ts
- src/constants/colors.ts

## Files to CREATE
- src/components/MomentumRing.tsx        → big SVG ring with gradient, shows momentum score (0-100) + label
- src/components/MacroRing.tsx           → small SVG ring for one metric: { label, current, target, color, unit }
- src/components/InsightCard.tsx         → soft-glowing card with icon + one-line text
- src/components/PrimaryCTA.tsx          → large pressable card, icon + title + subtitle, animated scale
- src/components/WeightCard.tsx          → sparkline + current + delta + prediction line
- src/components/MoodPicker.tsx          → 5 emoji row, single-select, saves on tap
- src/services/foodLogs.ts               → getTodaysTotals(uid) → {calories, protein, carbs, fat, perMeal} (zeros if empty, never throw)
- src/services/waterLogs.ts              → getTodaysWater(uid) → number (ml); addWater(uid, ml)
- src/services/weightLogs.ts             → getRecentWeights(uid, count) → {date, weight}[] (empty array if none, never throw)
- src/services/moodLogs.ts               → getTodayMood(uid) → string | null; setMood(uid, mood)
- src/utils/momentum.ts                  → calculateMomentum(...) → {score: 0-100, label: string}
- src/utils/predictWeight.ts             → predictGoalDate(...) → string | null

## Files to EDIT (only these)
- src/screens/DashboardScreen.tsx        → full premium implementation
- src/constants/colors.ts                → add new tokens, do NOT remove existing
- src/types/navigation.ts                → add Log route param type if missing
- src/types/user.ts                      → add optional `streakDays?: number` field

Do NOT create or edit any other file. No new packages.

## Design language (strict)

Colors — add to colors.ts if missing:
- bg:        '#0A0A0F'
- surface:   '#16161C'
- surfaceHi: '#1E1E26'
- border:    'rgba(255,255,255,0.06)'
- text:      '#F5F5F7'
- muted:     '#8A8A94'
- accent:    '#2EE59D'
- accentAlt: '#4CAF50'
- warn:      '#FFD93D'
- danger:    '#FF6B6B'
- protein:   '#FF6B6B'
- carbs:     '#4ECDC4'
- fat:       '#FFD93D'
- water:     '#5EB8FF'

Typography:
- greeting:      22px, weight 600, letterSpacing -0.3
- date:          13px, weight 400, muted
- big number:    44px, weight 700, letterSpacing -1
- big label:     12px, weight 500, muted, letterSpacing 1
- section title: 12px, weight 600, muted, letterSpacing 1.4, UPPERCASE
- card title:    16px, weight 600
- body:          14px, weight 400

Surfaces:
- Cards: bg #16161C, borderRadius 20, padding 20, border 1px rgba(255,255,255,0.06)
- Elevated: bg #1E1E26, iOS shadow {color:'#000', opacity:0.25, radius:16, offset:{0,6}}, Android elevation 6
- NO rectangular progress bars anywhere. Rings, pills, curves, dots ONLY.

Spacing: 20px horizontal, 16px between cards, 28px between sections.

Icons: @expo/vector-icons (bundled). Use Ionicons:
flame, sparkles, sunny-outline, restaurant-outline, moon-outline, nutrition-outline, trending-down, trending-up, water, menu-outline, checkmark-circle-outline

## Layout (top → bottom, ScrollView + RefreshControl)

### 1. HEADER (no card)
- Hamburger icon (Ionicons "menu-outline"), 28px, no-op on press
- "Tuesday, Oct 14 · 2:34 PM" — dynamic, updates every 60s
- "Good {morning|afternoon|evening}, {displayName ?? 'there'}" — <12 morning, <18 afternoon, else evening
- Right: streak pill (flame icon + count) ONLY if profile.streakDays exists. Do not fake it.

### 2. INSIGHT CARD
- Soft card with mint glow (border 1px rgba(46,229,157,0.15))
- Icon: sparkles (mint)
- Text (14px, weight 500): rotate a STATIC placeholder based on day-of-week hash:
  - "Small steps. Big change. Keep logging."
  - "Consistency beats perfection every time."
  - "Your future self is watching. Make them proud."
  - "Protein today = strong tomorrow."
  - "One meal at a time."
- Bottom-right tag "Powered by AI" — 10px, muted

### 3. MOMENTUM RING CARD
- Ring: outer 240px, stroke 16, rounded caps
- Track: rgba(255,255,255,0.05)
- Progress: LinearGradient #4CAF50 → #2EE59D (SVG Defs + LinearGradient + Stop)
- Behind ring: same gradient at 12% opacity, stroke 32px
- Center stacked: "MOMENTUM" (11px letterSpacing 2 muted) → score (44px weight 700) → label:
  - 0-39 → "Off track" (danger)
  - 40-69 → "Building" (warn)
  - 70-100 → "On track" (accent)
- Below ring: "{eaten} eaten · {remaining} left · {target} goal" (12px, muted)
- Animate strokeDashoffset on mount, 900ms, Easing.out(Easing.cubic)
- Momentum formula (implement in utils/momentum.ts):
  - calorieScore = 100 - min(100, |eaten - target| / target * 200)
  - proteinScore = min(100, (protein / targetProtein) * 100)
  - streakScore  = min(100, streakDays * 8)
  - trendScore   = desired ? 100 : flat ? 60 : 20
  - score = round(calorieScore*0.35 + proteinScore*0.25 + streakScore*0.20 + trendScore*0.20)
  - clamp 0-100

### 4. MACRO RINGS ROW (4 cards, equal width, gap 12)
- Each: 64px ring, stroke 6, rounded caps
- Protein #FF6B6B, Carbs #4ECDC4, Fat #FFD93D, Water #5EB8FF
- Inside ring: value + unit (12px weight 700, e.g. "62g", "1.2L")
- Below: label (11px muted uppercase letterSpacing 0.8)
- If current > target: cap ring at 100%, value shows overage in warn color
- Water target: 2.5L default — add to src/constants/config.ts, do not modify other constants

### 5. PRIMARY CTA (single, time-aware)
Determine by hour + what's already logged:
- <10 and breakfast not logged → "Log breakfast", sunny-outline, subtitle "~{round(target*0.25)} kcal to stay on track"
- <14 and lunch not logged → "Log lunch", restaurant-outline, subtitle "~{round(target*0.30)} kcal budget"
- <17 and snack not logged → "Log a snack", nutrition-outline, subtitle "Keep hunger down ~{round(target*0.10)} kcal"
- <21 and dinner not logged → "Log dinner", moon-outline, subtitle "~{remaining} kcal remaining"
- else → "Review today", checkmark-circle-outline, subtitle "See how you did"
Card: bg #1E1E26, radius 20, padding 20, flexDirection row, icon 32px accent, text stack, chevron right
Press: scale spring 0.97 → 1.0
On press: navigation.navigate('Log', { mealType })

### 6. WEIGHT CARD
- Title row: "WEIGHT JOURNEY" left, small edit icon right (no-op)
- Sparkline 140px tall, full width:
  - Smooth bezier curve, stroke 3px, gradient #4CAF50 → #2EE59D
  - Under-curve fill: vertical gradient rgba(46,229,157,0.25) → rgba(46,229,157,0)
  - No grid, no axes
- Below: left "{latest} kg" (22px weight 700); right delta vs previous "−0.8 kg ↓" — green if loss & goal=lose, red if gain, muted if zero
- Divider (1px rgba(255,255,255,0.04)), then prediction:
  - ≥3 entries and goal != maintain → "At this pace: {targetKg}kg by {Mar 15}"
  - else → "Log 3+ weights to see your forecast"
- Prediction: linear regression on last N points, extrapolate days until targetKg

### 7. MOOD PICKER
- Section title: "HOW DO YOU FEEL TODAY?"
- 5 emoji pressables (40px): 😞 😕 😐 🙂 😄
- If today's mood saved, highlight with mint border ring
- On tap: setMood(uid, mood), optimistic update, scale animation 0.9 → 1.1 → 1.0
- Save to users/{uid}/moodLogs/entries with { date: 'YYYY-MM-DD', mood }

### 8. SIGN OUT
- Centered text button "Sign out" (13px, muted, underline)
- Border top 1px rgba(255,255,255,0.04), paddingTop 20
- On press: signOut from src/services/auth.ts

## Data flow
On mount + pull-to-refresh:
Promise.allSettled([
  getTodaysTotals(uid),
  getTodaysWater(uid),
  getRecentWeights(uid, 14),
  getTodayMood(uid),
])
- Each failure logged but does NOT blank screen
- Failed sections show muted "—" instead of numbers
- All targets read from authStore.profile.targets — never re-fetch user doc

## Empty-data behavior (critical — current state)
- foodLogs empty → zeros, momentum computes low (~15-25), that's fine
- waterLogs empty → 0 shown
- weightLogs empty → hide sparkline, show "Log 3+ weights to see your forecast"
- moodLogs empty → no emoji highlighted
- streakDays missing → streak badge hidden
- Dashboard must look BEAUTIFUL in this state

## Animation rules
- Use Animated from react-native only. No reanimated hooks.
- Ring: mount animation 900ms Easing.out(Easing.cubic)
- CTA press: spring 0.97 → 1.0
- Mood tap: spring 0.9 → 1.1 → 1.0

## Component size limits
- Each component under 150 lines
- If MomentumRing exceeds, split calc into utils/momentum.ts

## Verification before reporting done
- npx tsc --noEmit → zero output, exit 0
- npx expo export --platform android → bundles clean, no unresolved-module errors

## Report format
1. Files created (tree)
2. Files edited (one-line diff summary each)
3. New color tokens added
4. Paste the 4-line momentum formula from momentum.ts
5. Confirm: zero rectangular progress bars — list every visual primitive used
6. Empty-state handling per service
7. Time-aware CTA decision table
8. tsc result
9. expo export result
10. Files NOT touched
11. Suggested commit message