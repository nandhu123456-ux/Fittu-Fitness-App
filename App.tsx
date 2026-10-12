import { useEffect } from 'react';

import RootNavigator from './src/navigation/RootNavigator';
import { onAuthChange } from './src/services/auth';
import { getUserProfile } from './src/services/user';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  useEffect(() => {
    // Firebase init happens at module load of src/services/firebase.ts (imported here).
    const unsubscribe = onAuthChange(async (user) => {
      const store = useAuthStore.getState();
      if (user === null) {
        store.setUser(null);
        store.setProfile(null);
        store.setLoading(false); // must clear loading even on the no-user branch
        return;
      }
      store.setUser(user);
      try {
        const profile = await getUserProfile(user.uid);
        store.setProfile(profile);
      } catch {
        // error already recorded in authStore by getUserProfile
        store.setProfile(null);
      } finally {
        store.setLoading(false);
      }
    });
    return unsubscribe; // clean up auth subscription on unmount
  }, []);

  return <RootNavigator />;
}


