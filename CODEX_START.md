# Kickoff — Execute CODEX_MASTER.md

Read these files in order, do not modify them:
1. AGENTS.md
2. CLINE_CONTEXT.md
3. CODEX_MASTER.md
4. PROMPT_DASHBOARD.md (reference for Task 1.1 — CODEX_MASTER supersedes if conflict)

Then begin executing CODEX_MASTER.md from TASK 1.

## Rules for this session
- Work task by task, in the order given.
- Commit after each sub-task using the exact commit message in CODEX_MASTER.md.
- Use `git add <explicit paths>` — NEVER `git add .`.
- Run `npx tsc --noEmit` and `npx expo export --platform android` before each commit. If either fails, fix before proceeding.
- Report after each sub-task in the format specified at the bottom of CODEX_MASTER.md.
- ASK before: installing any package, touching the Protected Set, or running any `eas`/`firebase deploy` command.
- STOP and ask before TASK 4.6 (offline migration) and TASK 4.7 (notifications) — those need explicit approval.
- If a task fails twice, stop and report the blocker with the exact error. Do not loop.
- Preserve all existing comments and code not explicitly changed.
- If CODEX_MASTER.md is ambiguous, ask ONE question rather than guessing.

## Current state reminder
Steps 1 and 2 are complete. Auth + onboarding + BMR/TDEE work end-to-end. Firestore has users/{uid} with onboardingComplete: true. Dashboard, Log, Progress, Coach are placeholders.

## Goal for this session
Complete TASKS 1, 2, 3 and as much of TASK 4 as you can without needing my approval. When you hit a point that requires approval (install, deploy, native changes), stop and ask.

Begin now. First output: your plan for TASK 1.1 (which files you'll create/edit, in what order), then wait 5 seconds and proceed unless I interrupt.