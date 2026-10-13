// ─────────────────────────────────────────────────────────────────────────────
// src/services/streakService.ts
// Reads recent food logs via the Firebase SDK, computes the streak, and
// persists `streakDays` (+ `streakUpdatedAt`) to users/{uid} only when it
// changes. Never throws to the caller — the streak is a non-critical signal.
// ─────────────────────────────────────────────────────────────────────────────

import { collection, doc, getDoc, getDocs, limit, orderBy, query, updateDoc } from 'firebase/firestore';

import { db } from './firebase';
import { calculateStreak, todayLocalISO } from '../utils/streak';

const MAX_ENTRIES = 300; // ~3 months of moderate logging, plenty for a streak window.

/**
 * Recomputes the user's streak from their recent food logs and writes it to the
 * user doc when the value changes.
 *
 * Edge cases (all handled): fetch failure -> returns 0, missing user doc ->
 * skips the write, Firestore write failure -> logged, never thrown.
 *
 * @returns The current streak length in days.
 */
export async function refreshStreak(uid: string): Promise<number> {
  const today = todayLocalISO();

  let entries: { date: string }[] = [];
  try {
    const snap = await getDocs(
      query(collection(db, 'foodLogs', uid, 'entries'), orderBy('date', 'desc'), limit(MAX_ENTRIES)),
    );
    entries = snap.docs
      .map((d) => d.data().date)
      .filter((v): v is string => typeof v === 'string')
      .map((date) => ({ date }));
  } catch (e) {
    console.warn('[streak] fetch failed', e);
    return 0;
  }

  const streak = calculateStreak(entries, today);

  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return streak; // user doc missing -> skip write, don't crash
    const existing = userSnap.data()?.streakDays as number | undefined;
    if (existing !== streak) {
      await updateDoc(userRef, {
        streakDays: streak,
        streakUpdatedAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn('[streak] write failed', e);
  }

  return streak;
}
