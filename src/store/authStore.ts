import { create } from 'zustand';
import type { User as AuthUser } from 'firebase/auth';

import type { User } from '../types/user';

interface AuthState {
  user: AuthUser | null;
  profile: User | null;
  loading: boolean;
  error: string | null;
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
