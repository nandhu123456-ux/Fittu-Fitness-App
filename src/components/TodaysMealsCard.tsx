import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface TodaysMealsCardProps {
  perMeal: Record<string, { cal: number; count: number }>;
  onMealPress: (mealType: MealType) => void;
}

const MEALS: { type: MealType; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'breakfast', icon: 'cafe-outline' },
  { type: 'lunch', icon: 'restaurant-outline' },
  { type: 'dinner', icon: 'moon-outline' },
  { type: 'snack', icon: 'nutrition-outline' },
];

export function TodaysMealsCard({ perMeal, onMealPress }: TodaysMealsCardProps) {
  const theme = useTheme();

  const loggedCount = Object.values(perMeal).filter((meal) => meal?.count > 0).length;

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: theme.colors.surface,
          borderRadius: 20,
          padding: 16,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        headerTitle: {
          fontSize: 11,
          fontWeight: '600',
          color: theme.colors.muted,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        },
        count: {
          fontSize: 11,
          color: theme.colors.muted,
        },
        chevron: {
          fontSize: 16,
          color: theme.colors.muted,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          height: 44,
        },
        thumbnail: {
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: theme.colors.surfaceHi,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        },
        thumbnailIcon: {
          fontSize: 18,
          color: theme.colors.muted,
        },
        middle: {
          flex: 1,
          marginRight: 12,
        },
        name: {
          fontSize: 13,
          fontWeight: '600',
          color: theme.colors.text,
        },
        cal: {
          fontSize: 11,
          color: theme.colors.muted,
        },
        status: {
          alignItems: 'flex-end',
          justifyContent: 'center',
        },
        statusFilled: {
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: theme.colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        },
        statusOutlined: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        statusIcon: {
          fontSize: 14,
          color: theme.colors.accentText,
        },
        statusPlus: {
          fontSize: 14,
          color: theme.colors.muted,
        },
      }),
    [theme],
  );

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.header}>
        <Text style={themedStyles.headerTitle}>TODAY'S MEALS</Text>
        <Text style={themedStyles.count}>
          {loggedCount} of 4 logged
        </Text>
        <Ionicons name="chevron-forward-outline" size={16} color={theme.colors.muted} />
      </View>
      {MEALS.map(({ type, icon }) => {
        const meal = perMeal[type];
        const count = meal?.count ?? 0;
        const cal = meal?.cal ?? 0;
        return (
          <Pressable
            key={type}
            onPress={() => onMealPress(type)}
            style={({ pressed }) => [styles.wrapper, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={themedStyles.thumbnail}>
              <Ionicons name={icon} size={18} color={theme.colors.muted} />
            </View>
            <View style={themedStyles.middle}>
              <Text style={themedStyles.name}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
              <Text style={themedStyles.cal}>{cal} kcal</Text>
            </View>
            <View style={themedStyles.status}>
              {count > 0 ? (
                <View style={themedStyles.statusFilled}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={theme.colors.accentText}
                  />
                </View>
              ) : (
                <View style={themedStyles.statusOutlined}>
                  <Text style={themedStyles.statusPlus}>+</Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  middle: {
    flex: 1,
    marginRight: 12,
  },
});
