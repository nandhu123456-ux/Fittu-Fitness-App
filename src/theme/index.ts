// ─────────────────────────────────────────────────────────────────────────────
// src/theme/index.ts
// Single-file theme system: types, palettes, tokens, store, and hook.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useEffect } from 'react';
import { Appearance } from 'react-native';
import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';

// ── Types ────────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceHi: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  muted: string;
  textInverse: string;
  accent: string;
  accentAlt: string;
  accentText: string;
  accentGlow: string;
  success: string;
  warn: string;
  danger: string;
  info: string;
  protein: string;
  carbs: string;
  fat: string;
  water: string;
  overlay: string;
  overlayStrong: string;
  loadingOverlay: string;
  scrim: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  motion: typeof motion;
}

// ── Shared tokens ────────────────────────────────────────────────────────────

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;

export const typography = {
  greeting:     { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.3 },
  date:         { fontSize: 13, fontWeight: '400' as const },
  bigNumber:    { fontSize: 44, fontWeight: '700' as const, letterSpacing: -1 },
  sectionTitle: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 1.4 },
  cardTitle:    { fontSize: 16, fontWeight: '600' as const },
  body:         { fontSize: 14, fontWeight: '400' as const },
  small:        { fontSize: 13, fontWeight: '500' as const },
  tiny:         { fontSize: 11, fontWeight: '500' as const },
} as const;

export const motion = { fast: 150, normal: 250, slow: 400, ring: 900 } as const;

// ── Palettes ─────────────────────────────────────────────────────────────────

export const darkColors: ThemeColors = {
  bg:               '#0F0D0C',
  surface:          '#1A1716',
  surfaceHi:        '#231F1E',
  surfaceElevated:  '#2A2523',
  border:           'rgba(255,255,255,0.06)',
  borderStrong:     'rgba(255,255,255,0.12)',
  text:             '#F5F5F7',
  textSecondary:    '#C7C7CE',
  muted:            '#8A8A94',
  textInverse:      '#0A0A0F',
  accent:           '#D4A89A',
  accentAlt:        '#B88A7C',
  accentText:       '#0A0A0F',
  accentGlow:       'rgba(46,229,157,0.15)',
  success:          '#8FBC8F',
  warn:             '#E5C07B',
  danger:           '#E08A7A',
  info:             '#A8B8D4',
  protein:          '#E8A0A0',
  carbs:            '#8FC7C0',
  fat:              '#E5C07B',
  water:            '#A8B8D4',
  overlay:          'rgba(0,0,0,0.65)',
  overlayStrong:    'rgba(0,0,0,0.45)',
  loadingOverlay:   'rgba(0,0,0,0.6)',
  scrim:            'rgba(0,0,0,0.4)',
};

export const lightColors: ThemeColors = {
  bg:               '#F7F7FA',
  surface:          '#FFFFFF',
  surfaceHi:        '#EFEFF4',
  surfaceElevated:  '#FFFFFF',
  border:           'rgba(0,0,0,0.07)',
  borderStrong:     'rgba(0,0,0,0.14)',
  text:             '#0A0A0F',
  textSecondary:    '#3A3A45',
  muted:            '#6E6E78',
  textInverse:      '#FFFFFF',
  accent:           '#008A47',
  accentAlt:        '#00703A',
  accentText:       '#FFFFFF',
  accentGlow:       'rgba(0,138,71,0.12)',
  success:          '#008A47',
  warn:             '#8B6914',
  danger:           '#C62828',
  info:             '#1565C0',
  protein:          '#D32F2F',
  carbs:            '#00796B',
  fat:              '#946800',
  water:            '#1565C0',
  overlay:          'rgba(0,0,0,0.5)',
  overlayStrong:    'rgba(0,0,0,0.35)',
  loadingOverlay:   'rgba(0,0,0,0.45)',
  scrim:            'rgba(0,0,0,0.3)',
};

// ── Store ────────────────────────────────────────────────────────────────────

const storage = createMMKV({ id: 'theme' });

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

interface ThemeStore {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const initialMode = (storage.getString('mode') as ThemeMode | undefined) ?? 'dark';

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: initialMode,
  resolved: resolveMode(initialMode),
  setMode: (mode) => {
    storage.set('mode', mode);
    set({ mode, resolved: resolveMode(mode) });
  },
  toggle: () => {
    const next: ThemeMode = get().resolved === 'dark' ? 'light' : 'dark';
    storage.set('mode', next);
    set({ mode: next, resolved: next });
  },
}));

// Subscribe to system appearance changes — only affects 'system' mode
Appearance.addChangeListener(({ colorScheme }) => {
  const state = useThemeStore.getState();
  if (state.mode === 'system') {
    useThemeStore.setState({
      resolved: colorScheme === 'dark' ? 'dark' : 'light',
    });
  }
});

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): Theme & {
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
} {
  const resolved = useThemeStore((s) => s.resolved);
  const setMode = useThemeStore((s) => s.setMode);
  const toggle = useThemeStore((s) => s.toggle);

  return useMemo(
    () => ({
      mode: resolved,
      colors: resolved === 'dark' ? darkColors : lightColors,
      spacing,
      radius,
      typography,
      motion,
      setMode,
      toggle,
    }),
    [resolved, setMode, toggle]
  );
}
