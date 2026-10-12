interface WeightPoint {
  date: string;
  weight: number;
}

interface PredictionInput {
  currentKg: number;
  targetKg: number;
  history: WeightPoint[];
}

export function predictGoalDate({ currentKg, targetKg, history }: PredictionInput): string | null {
  if (history.length < 3 || currentKg === targetKg) return null;
  const ordered = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const xs = ordered.map((entry) => new Date(`${entry.date}T00:00:00`).getTime() / 86_400_000);
  const ys = ordered.map((entry) => entry.weight);
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
  const denominator = xs.reduce((sum, value) => sum + (value - meanX) ** 2, 0);
  if (denominator === 0) return null;
  const slope = xs.reduce((sum, value, index) => sum + (value - meanX) * (ys[index] - meanY), 0) / denominator;
  if (slope === 0 || (targetKg - currentKg) / slope <= 0) return null;
  const goalDate = new Date(Date.now() + ((targetKg - currentKg) / slope) * 86_400_000);
  return goalDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
