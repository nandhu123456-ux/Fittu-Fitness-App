import type { GoalType } from '../types/user';

interface MomentumInput {
  calories: number;
  targetCalories: number;
  protein: number;
  targetProtein: number;
  streakDays: number;
  weightTrend: 'desired' | 'flat' | 'opposite';
  goal: GoalType;
}

export function calculateMomentum(input: MomentumInput): { score: number; label: string } {
  const calorieScore = 100 - Math.min(100, (Math.abs(input.calories - input.targetCalories) / Math.max(input.targetCalories, 1)) * 200);
  const proteinScore = Math.min(100, (input.protein / Math.max(input.targetProtein, 1)) * 100);
  const streakScore = Math.min(100, input.streakDays * 8);
  const trendScore = input.weightTrend === 'desired' ? 100 : input.weightTrend === 'flat' ? 60 : 20;
  const score = Math.round(calorieScore * 0.35 + proteinScore * 0.25 + streakScore * 0.2 + trendScore * 0.2);
  const clamped = Math.max(0, Math.min(100, score));
  const label = clamped < 40 ? 'Off track' : clamped < 70 ? 'Building' : 'On track';
  return { score: clamped, label };
}
