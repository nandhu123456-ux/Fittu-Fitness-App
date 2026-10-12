import type { ActivityLevel, Gender, GoalType, Targets } from '../types/user';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Mifflin-St Jeor BMR (kcal/day). */
export function calculateBMR(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

interface TargetsInput {
  tdee: number;
  bmr: number;
  goalType: GoalType;
  weightKg: number;
}

/** Goal calories (lose −20%, maintain 0%, gain +10%; never below BMR) + macro split. */
export function calculateTargets({ tdee, bmr, goalType, weightKg }: TargetsInput): Targets {
  let calories: number;
  if (goalType === 'lose') {
    calories = Math.max(Math.round(tdee * 0.8), bmr);
  } else if (goalType === 'gain') {
    calories = Math.round(tdee * 1.1);
  } else {
    calories = tdee;
  }

  const proteinPerKg = goalType === 'lose' ? 2.0 : goalType === 'gain' ? 1.8 : 1.6;
  const fatRatio = goalType === 'lose' ? 0.25 : goalType === 'gain' ? 0.3 : 0.28;

  const protein = Math.round(weightKg * proteinPerKg);
  const fat = Math.round((calories * fatRatio) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  return { calories, protein, carbs, fat };
}
