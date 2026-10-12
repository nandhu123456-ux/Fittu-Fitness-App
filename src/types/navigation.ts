export type RootTabParamList = {
  Dashboard: undefined;
  Log: { mealType?: 'breakfast' | 'lunch' | 'snack' | 'dinner' } | undefined;
  Progress: undefined;
  Coach: undefined;
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
};

export type AuthStackParamList = Pick<RootStackParamList, 'Welcome' | 'SignIn' | 'SignUp'>;

export type OnboardingStackParamList = Pick<
  RootStackParamList,
  'Gender' | 'BodyStats' | 'Activity' | 'Goal' | 'Summary'
>;

