export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  // Safety checks: If profile isn't complete, return 0
  if (!weightKg || !heightCm || !age || weightKg <= 0 || heightCm <= 0) {
    return 0;
  }

  // Mifflin-St Jeor Equation
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  
  if (gender === 'male') {
    return Math.round(base + 5);
  } else {
    // Female or Other (defaults to female formula for safety)
    return Math.round(base - 161);
  }
}