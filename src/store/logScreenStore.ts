import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'logScreen' });

interface LogScreenStore {
  showRecents: boolean;
  toggleRecents: () => void;
}

const initial = storage.getBoolean('showRecents') ?? true;

export const useLogScreenStore = create<LogScreenStore>((set) => ({
  showRecents: initial,
  toggleRecents: () => {
    const next = !storage.getBoolean('showRecents');
    storage.set('showRecents', next);
    set({ showRecents: next });
  },
}));