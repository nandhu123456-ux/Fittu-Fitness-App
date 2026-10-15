import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'intro' });

interface IntroStore {
  hasSeenIntro: boolean;
  markSeen: () => void;
}

const initial = storage.getBoolean('seen') ?? false;

export const useIntroStore = create<IntroStore>((set) => ({
  hasSeenIntro: initial,
  markSeen: () => {
    storage.set('seen', true);
    set({ hasSeenIntro: true });
  },
}));
