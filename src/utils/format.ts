/**
 * Centralized number formatting for the Be_fit UI.
 *
 * Every screen/component should route numeric display through these helpers
 * so that values like `95.39999999999998` can never reach the user.
 *
 * Rules:
 * - Calories  → integer kcal, with thousands separator
 * - Grams     → whole grams (protein/carbs/fat)
 * - Weight    → one decimal place
 * - Water     → Litres when >= 1000 ml, otherwise millilitres
 * - Percent   → whole percent
 * - All inputs are sanitised: NaN / Infinity / negative → 0
 */

const ZERO = 0;

/** Returns a finite non-negative number, or 0 for anything invalid. */
export function safeNumber(value: unknown): number {
  if (typeof value !== 'number') return ZERO;
  if (!Number.isFinite(value)) return ZERO;
  if (value < 0) return ZERO;
  return value;
}

/** Calories as integer kcal, e.g. `formatCalories(1120)` → `"1,120"` */
export function formatCalories(value: unknown): string {
  return Math.round(safeNumber(value)).toLocaleString('en-US');
}

/** Grams as whole numbers, e.g. `formatGrams(95.39999999999998)` → `"96"` */
export function formatGrams(value: unknown): string {
  return String(Math.round(safeNumber(value)));
}

/** Weight in kg with one decimal, e.g. `formatWeight(70.5)` → `"70.5"` */
export function formatWeight(value: unknown): string {
  return safeNumber(value).toFixed(1);
}

/** Water in Litres (>= 1000 ml) or millilitres, e.g. `formatWater(1300)` → `"1.3 L"` */
export function formatWater(value: unknown): string {
  const ml = safeNumber(value);
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)} L`;
  return `${Math.round(ml)} ml`;
}

/** Percent as whole number, e.g. `formatPercent(65.4)` → `"65%"` */
export function formatPercent(value: unknown): string {
  return `${Math.round(safeNumber(value))}%`;
}

/** Compact delta display: `formatDelta(2.5)` → `"+2.5"`, `formatDelta(-1.2)` → `"-1.2"` */
export function formatDelta(value: unknown): string {
  const n = safeNumber(value);
  if (n === 0) return '0';
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}`;
}