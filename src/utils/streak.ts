// ─────────────────────────────────────────────────────────────────────────────
// src/utils/streak.ts
// Pure streak math. No Firebase, no side effects — trivially testable.
// ─────────────────────────────────────────────────────────────────────────────

export interface StreakEntry {
  date: string; // 'YYYY-MM-DD'
}

/**
 * Calculates the current streak from a list of log entries.
 *
 * Rules:
 * - A day counts if it has >= 1 entry.
 * - Today counts only if a log exists for today.
 * - Yesterday always counts (grace period): if the user logged yesterday but not
 *   yet today, the streak is still "alive" and equals the count ending yesterday.
 * - If the user's last log is 2+ days ago, streak = 0.
 * - Multiple entries in one day count as 1 day.
 *
 * @param entries - Log entries with an ISO date string 'YYYY-MM-DD'
 * @param today - Today's date string 'YYYY-MM-DD' (injectable for testing)
 * @returns The current streak length in days
 */
export function calculateStreak(entries: StreakEntry[], today: string): number {
  if (!entries.length) return 0;

  const uniqueDays = new Set(entries.map((e) => e.date));
  if (!uniqueDays.size) return 0;

  // Check if the streak is "alive": today or yesterday has a log.
  const yesterday = shiftDate(today, -1);
  const hasToday = uniqueDays.has(today);
  const hasYesterday = uniqueDays.has(yesterday);

  if (!hasToday && !hasYesterday) return 0;

  // Walk backwards from the most recent logged day.
  let cursor = hasToday ? today : yesterday;
  let count = 0;

  while (uniqueDays.has(cursor)) {
    count += 1;
    cursor = shiftDate(cursor, -1);
  }

  return count;
}

/**
 * Shifts a YYYY-MM-DD string by N days (negative = past, positive = future).
 * Uses UTC math to avoid DST/timezone bugs.
 */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Returns today's date as 'YYYY-MM-DD' in the device's LOCAL timezone.
 */
export function todayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
