import { NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import OnboardingNavigator from '../screens/onboarding/OnboardingNavigator';
import TabNavigator from './TabNavigator';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import { useUserDoc } from '../hooks/useRealtime';
import type { AuthStackParamList } from '../types/navigation';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// Exported so App.tsx (and anything else) can navigate without
// receiving the navigation prop directly.
export const navigationRef = createNavigationContainerRef();

export default function RootNavigator() {
  const { user, profile, loading } = useAuthStore();
  const theme = useTheme();
  useUserDoc(user?.uid);

  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme.colors.bg,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.accent,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg }}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      {user === null ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
          <AuthStack.Screen name="SignIn" component={SignInScreen} />
          <AuthStack.Screen name="SignUp" component={SignUpScreen} />
          <AuthStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
          <AuthStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        </AuthStack.Navigator>
      ) : profile?.onboardingComplete !== true ? (
        <OnboardingNavigator />
      ) : (
        <TabNavigator />
      )}
    </NavigationContainer>
  );
}