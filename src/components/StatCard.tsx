import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
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
          borderRadius: 14, // slightly tighter radius
          paddingVertical: 10, // reduced from 12
          paddingHorizontal: 8,
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          // REMOVED the large minHeight: 96 to let it fit its content
        },
        value: {
          fontSize: 16, // reduced from 20
          fontWeight: '700',
          color: theme.colors.text,
          marginTop: 4,
        },
        label: {
          fontSize: 9, // reduced from 11
          fontWeight: '600',
          color: theme.colors.muted,
          letterSpacing: 0.5,
          marginTop: 2,
          textTransform: 'uppercase',
        },
        subtitle: {
          fontSize: 9, // reduced from 11
          color: subtitleColor ?? theme.colors.muted,
          marginTop: 2,
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
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text style={themedStyles.value}>{value}</Text>
      <Text style={themedStyles.label}>{label}</Text>
      {subtitle ? <Text style={themedStyles.subtitle}>{subtitle}</Text> : null}
    </Pressable>
  );
}