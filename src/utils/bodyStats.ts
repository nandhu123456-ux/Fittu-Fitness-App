/**
 * Estimated body-composition math shared by BodyStatsCard and ProgressScreen.
 * Kept in one place so every surface shows identical values.
 */

export interface BodyStatsInput {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: 'male' | 'female';
}

export interface BodyStats {
  bmi: number;
  bodyFatPct: number;
  leanMassKg: number;
}

/** Rounds to one decimal place. */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Derives BMI, body-fat percentage, and lean mass from profile values.
 * Returns null when the inputs cannot produce a real result (missing height,
 * age, or an out-of-range weight), so callers can show "—" instead of garbage.
 */
export function calculateBodyStats({ weightKg, heightCm, age, gender }: BodyStatsInput): BodyStats | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  if (!Number.isFinite(heightCm) || heightCm <= 0) return null;
  if (!Number.isFinite(age) || age <= 0) return null;

  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  const genderFactor = gender === 'male' ? 1 : 0;
  const bodyFatPct = 1.2 * bmi + 0.23 * age - 10.8 * genderFactor - 5.4;
  const leanMassKg = weightKg * (1 - bodyFatPct / 100);

  const stats: BodyStats = {
    bmi: round1(bmi),
    bodyFatPct: round1(bodyFatPct),
    leanMassKg: round1(leanMassKg),
  };

  // Mirrors the original inline validity check: any non-positive or NaN result
  // is treated as "no data", not as a real measurement.
  if (
    Number.isNaN(stats.bmi) || stats.bmi <= 0 ||
    Number.isNaN(stats.bodyFatPct) || stats.bodyFatPct <= 0 ||
    Number.isNaN(stats.leanMassKg) || stats.leanMassKg <= 0
  ) {
    return null;
  }

  return stats;
}
