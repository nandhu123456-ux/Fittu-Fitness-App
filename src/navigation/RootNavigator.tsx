import { NavigationContainer, DarkTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import OnboardingNavigator from '../screens/onboarding/OnboardingNavigator';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import type { AuthStackParamList } from '../types/navigation';
import TabNavigator from './TabNavigator';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export default function RootNavigator() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const navTheme: Theme = useMemo(() => ({
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: theme.colors.accent,
      background: theme.colors.bg,
      card: theme.colors.bg,
      text: theme.colors.text,
      border: theme.colors.bg,
    },
  }), [theme]);
  const themedStyles = useMemo(() => StyleSheet.create({
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg },
  }), [theme]);

  // Auth-state switch: no partial render while the first onAuthChange fires.
  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={themedStyles.loader}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        {user === null ? (
          <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
            <AuthStack.Screen name="SignIn" component={SignInScreen} />
            <AuthStack.Screen name="SignUp" component={SignUpScreen} />
          </AuthStack.Navigator>
        ) : profile?.onboardingComplete !== true ? (
          <OnboardingNavigator />
        ) : (
          <TabNavigator />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

