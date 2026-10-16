import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

interface DashboardHeroProps {
  displayName: string;
  /** Omitted on layouts that show the streak as a stat card instead. */
  streakDays?: number;
  avatarLetter: string;
  onMenuPress?: () => void;
}

export function DashboardHero({
  displayName,
  streakDays,
  avatarLetter,
  onMenuPress,
}: DashboardHeroProps) {
  const theme = useTheme();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: 20,
          borderWidth: 1,
          padding: 20,
          paddingTop: 16,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        title: {
          fontSize: 20,
          fontWeight: '700',
          color: theme.colors.text,
        },
        subtitle: {
          fontSize: 11,
          color: theme.colors.muted,
          marginTop: 2,
        },
        pill: {
          backgroundColor: theme.colors.surfaceHi,
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 6,
          alignSelf: 'flex-start',
        },
        pillText: {
          fontSize: 13,
          fontWeight: '600',
          color: theme.colors.text,
        },
        avatar: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarLetter: {
          color: theme.colors.accentText,
          fontWeight: '700',
          fontSize: 14,
        },
        date: {
          fontSize: 13,
          color: theme.colors.muted,
          marginTop: 12,
        },
        greeting: {
          fontSize: 28,
          fontWeight: '700',
          color: theme.colors.text,
          marginTop: 8,
          letterSpacing: -0.5,
        },
      }),
    [theme],
  );

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.row}>
        <Pressable onPress={onMenuPress} hitSlop={8}>
          <Ionicons name="menu-outline" size={24} color={theme.colors.text} />
        </Pressable>
        <View style={styles.copy}>
          <Text style={themedStyles.title}>Fi</Text><Text style={[themedStyles.title, { color: theme.colors.accent }]}>ttu</Text>
          <Text style={themedStyles.subtitle}>Eat better. Live stronger.</Text>
        </View>
        {streakDays === undefined ? null : (
          <View style={themedStyles.pill}>
            <Ionicons name="flame" size={16} color={theme.colors.warn} />
            <Text style={themedStyles.pillText}>{streakDays} day streak</Text>
          </View>
        )}
        <View style={themedStyles.avatar}>
          <Text style={themedStyles.avatarLetter}>{avatarLetter}</Text>
        </View>
      </View>
      <Text style={themedStyles.date}>
        {new Date().toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })}
      </Text>
      <Text style={themedStyles.greeting}>Good {greeting}, {displayName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    marginLeft: 12,
  },
});