import type { MealType } from '../services/foodLogs';

export type RootTabParamList = {
  Dashboard: undefined;
  Log: { mealType?: 'breakfast' | 'lunch' | 'snack' | 'dinner' } | undefined;
  Barcode: { mealType?: MealType } | undefined;
  PhotoLog: { mealType?: MealType } | undefined;
  VoiceLog: { mealType?: MealType } | undefined;
  AddCustomFood: { prefillQuery?: string; mealType?: MealType } | undefined;
  MenuScan: { mealType?: MealType } | undefined;
  Settings: undefined;
  Progress: undefined;
  Coach: undefined;
  LogMenu: undefined;
};

/** Auth + onboarding routes; the root renders one of three navigators from these. */
export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Gender: undefined;
  BodyStats: undefined;
  Activity: undefined;
  Goal: undefined;
  Summary: undefined;
  /** Visual-only intro slides, shown before Gender the first time. */
  Intro1: undefined;
  Intro2: undefined;
};

export type AuthStackParamList = Pick<RootStackParamList, 'Welcome' | 'SignIn' | 'SignUp'>;

export type OnboardingStackParamList = Pick<
  RootStackParamList,
  'Gender' | 'BodyStats' | 'Activity' | 'Goal' | 'Summary' | 'Intro1' | 'Intro2'
>;

