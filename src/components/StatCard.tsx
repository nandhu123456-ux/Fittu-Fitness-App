import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  subtitle?: string;
  subtitleColor?: string;
  onPress?: () => void;
}

export function StatCard({
  icon,
  iconColor,
  label,
  value,
  subtitle,
  subtitleColor,
  onPress,
}: StatCardProps) {
  const theme = useTheme();
  const isPressable = onPress !== undefined && onPress !== null;

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: 16,
          padding: 12,
          minHeight: 96,
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        },
        icon: {
          fontSize: 22,
          color: iconColor,
          marginBottom: 6,
        },
        value: {
          fontSize: 20,
          fontWeight: '700',
          color: theme.colors.text,
        },
        label: {
          fontSize: 11,
          fontWeight: '600',
          color: theme.colors.muted,
          letterSpacing: 0.8,
          marginTop: 2,
          textTransform: 'uppercase',
        },
        subtitle: {
          fontSize: 11,
          color: subtitleColor ?? theme.colors.muted,
          marginTop: 4,
        },
      }),
    [theme, iconColor, subtitleColor],
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        themedStyles.container,
        isPressable ? { opacity: pressed ? 0.7 : 1 } : undefined,
      ]}
    >
      <Ionicons name={icon} size={22} color={iconColor} />
      <Text style={themedStyles.value}>{value}</Text>
      <Text style={themedStyles.label}>{label}</Text>
      {subtitle ? <Text style={themedStyles.subtitle}>{subtitle}</Text> : null}
    </Pressable>
  );
}
