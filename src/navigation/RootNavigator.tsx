import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import OnboardingNavigator from '../screens/onboarding/OnboardingNavigator';
import TabNavigator from './TabNavigator';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import type { AuthStackParamList } from '../types/navigation';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export default function RootNavigator() {
  const { user, profile, loading } = useAuthStore();
  const theme = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg }}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
  );
}
