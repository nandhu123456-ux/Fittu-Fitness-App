# Agent Rules — Be_fit project

Read CLINE_CONTEXT.md first for full project context. Do not modify it.

## Hard rules
1. Never rewrite files wholesale. Edit only the specific section needed.
2. Never rename files, variables, collections, or exports unless I explicitly ask.
3. Never install packages without asking.
4. Preserve all existing code comments — especially the memoryLocalCache deviation note in src/services/firebase.ts.
5. Show a diff for every edit (old → new).
6. If unsure, ask ONE clarifying question rather than guessing.
7. Report files touched + files NOT touched at the end.
8. If a task will take more than 3 tool calls, outline the plan first and wait for approval.

## Protected set — do NOT touch
package.json, app.json, tsconfig.json, package-lock.json,
.clineignore, .gitignore, .env, .env.example,
functions/, CLINE_CONTEXT.md,
src/screens/auth/*, src/screens/onboarding/*,
src/services/firebase.ts, src/services/auth.ts, src/services/user.ts,
src/utils/nutrition.ts, src/store/*,
src/navigation/TabNavigator.tsx (except reading),
LogScreen.tsx, ProgressScreen.tsx, CoachScreen.tsx (leave as placeholders)