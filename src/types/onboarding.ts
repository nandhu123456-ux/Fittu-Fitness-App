import type { ActivityLevel, Gender, GoalType } from './user';

export interface OnboardingForm {
  gender: Gender | null;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel | null;
  goalType: GoalType | null;
  targetWeightKg: number;
  weeklyRateKg: number;
}
