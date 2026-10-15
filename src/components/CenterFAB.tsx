import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

import { useTheme } from '../theme';

type CenterFABProps = Omit<BottomTabBarButtonProps, 'onPress'> & {
  onPress: () => void;
};

export function CenterFAB({ onPress, ref: _ref, ...rest }: CenterFABProps) {
  const theme = useTheme();

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        fab: {
          alignItems: 'center',
          backgroundColor: theme.colors.accent,
          borderColor: theme.colors.bg,
          borderRadius: 30,
          borderWidth: 4,
          elevation: 8,
          height: 60,
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          transform: [{ translateY: -20 }],
          width: 60,
        },
      }),
    [theme],
  );

  return (
    <Pressable
      {...rest}
      accessibilityLabel="Quick log"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [themedStyles.fab, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Ionicons name="add" size={32} color={theme.colors.bg} />
    </Pressable>
  );
}
