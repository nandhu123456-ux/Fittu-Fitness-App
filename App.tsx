import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { View } from 'react-native';

import RootNavigator, { navigationRef } from './src/navigation/RootNavigator';
import { useTheme } from './src/theme';
import { onAuthChange } from './src/services/auth';
import { getUserProfile } from './src/services/user';
import { useAuthStore } from './src/store/authStore';
import { useOnboardingStore } from './src/store/onboardingStore';
import AnimatedSplash from './src/components/AnimatedSplash';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

SplashScreen.preventAutoHideAsync().catch(() => {});

// Navigate to a screen from a notification tap, waiting briefly if the
// NavigationContainer hasn't mounted yet (cold start).
function navigateToScreen(screen: string, retries = 40): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate(screen as never);
    return;
  }
  if (retries > 0) {
    setTimeout(() => navigateToScreen(screen, retries - 1), 50);
  }
}

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

  // Navigate when the user taps a reminder (app open or backgrounded).
  useEffect(() => {
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { screen?: string } | undefined;
      if (data?.screen) navigateToScreen(data.screen);
    });

    // Navigate when the app was killed and the notification opened it.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        const data = response.notification.request.content.data as { screen?: string } | undefined;
        if (data?.screen) navigateToScreen(data.screen);
      })
      .catch(() => {});

    return () => responseSub.remove();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0F0D0C' }}>
      <KeyboardProvider>
        <View style={{ flex: 1, backgroundColor: '#0F0D0C' }}>
          <AppShell />
        </View>
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