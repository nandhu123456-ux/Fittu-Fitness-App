import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

import RootNavigator from './src/navigation/RootNavigator';
import { onAuthChange } from './src/services/auth';
import { getUserProfile } from './src/services/user';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      const store = useAuthStore.getState();
      if (user === null) {
        store.setUser(null);
        store.setProfile(null);
        store.setLoading(false);
        return;
      }
      store.setUser(user);
      try {
        const profile = await getUserProfile(user.uid);
        store.setProfile(profile);
      } catch {
        store.setProfile(null);
      } finally {
        store.setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootNavigator />
    </GestureHandlerRootView>
  );
}