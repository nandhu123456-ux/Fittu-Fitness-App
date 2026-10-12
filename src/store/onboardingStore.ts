import { create } from 'zustand';

import type { OnboardingForm } from '../types/onboarding';

const initialForm: OnboardingForm = {
  gender: null,
  age: 25,
  heightCm: 170,
  weightKg: 70,
  activityLevel: null,
  goalType: null,
  targetWeightKg: 70,
  weeklyRateKg: 0.5,
};

interface OnboardingState {
  form: OnboardingForm;
  setForm: (patch: Partial<OnboardingForm>) => void;
  resetForm: () => void;
}

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  form: initialForm,
  setForm: (patch) => set((state) => ({ form: { ...state.form, ...patch } })),
  resetForm: () => set({ form: initialForm }),
}));
