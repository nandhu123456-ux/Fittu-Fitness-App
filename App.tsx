import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import RootNavigator from './src/navigation/RootNavigator';
import { useTheme } from './src/theme';
import { onAuthChange } from './src/services/auth';
import { getUserProfile } from './src/services/user';
import { useAuthStore } from './src/store/authStore';
import { useOnboardingStore } from './src/store/onboardingStore';
import AnimatedSplash from './src/components/AnimatedSplash';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      const store = useAuthStore.getState();
      if (user === null) {
        store.setUser(null);
        store.setProfile(null);
        store.setLoading(false);
        return;
      }
      store.setLoading(true);
      store.setUser(user);
      try {
        const profile = await getUserProfile(user.uid);
        store.setProfile(profile);
        if (profile?.onboardingComplete) {
          useOnboardingStore.getState().resetForm();
        }
      } catch {
        store.setProfile(null);
      } finally {
        store.setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <AppShell />
        {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}