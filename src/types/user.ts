import type { Timestamp } from 'firebase/firestore';

export type Gender = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type GoalType = 'lose' | 'maintain' | 'gain';

export interface UserProfile {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
}

export interface UserGoal {
  type: GoalType;
  targetWeightKg: number;
  weeklyRateKg: number;
}

export interface Targets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  onboardingComplete: boolean;
  /** Set after onboarding completes. */
  profile?: UserProfile;
  /** Set after onboarding completes. */
  goal?: UserGoal;
  /** Set after onboarding completes. */
  bmr?: number;
  /** Set after onboarding completes. */
  tdee?: number;
  /** Set after onboarding completes. */
  targets?: Targets;
  streakDays?: number;
  units?: 'kg' | 'lb';
}
