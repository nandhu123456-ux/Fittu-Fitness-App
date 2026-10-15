import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';
import { calculateBodyStats } from '../utils/bodyStats';

interface BodyStatsCardProps {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: 'male' | 'female';
}

export function BodyStatsCard({
  weightKg,
  heightCm,
  age,
  gender,
}: BodyStatsCardProps) {
  const theme = useTheme();

  // Same math as before, now shared with ProgressScreen.
  const stats = calculateBodyStats({ weightKg, heightCm, age, gender });

  const valueBmi = stats ? stats.bmi.toFixed(1) : '—';
  const valueBodyFat = stats ? `${stats.bodyFatPct}%` : '—';
  const valueLeanMass = stats ? `${stats.leanMassKg} kg` : '—';

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
        chevron: {
          fontSize: 16,
          color: theme.colors.muted,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          height: 44,
        },
        icon: {
          fontSize: 18,
          color: theme.colors.accent,
        },
        label: {
          fontSize: 13,
          fontWeight: '500',
          color: theme.colors.text,
          marginLeft: 12,
        },
        value: {
          fontSize: 15,
          fontWeight: '700',
          color: theme.colors.text,
        },
        footnote: {
          fontSize: 10,
          fontStyle: 'italic',
          color: theme.colors.muted,
          marginTop: 8,
        },
      }),
    [theme],
  );

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.header}>
        <Text style={themedStyles.headerTitle}>BODY STATS</Text>
        <Ionicons name="chevron-forward-outline" size={16} color={theme.colors.muted} />
      </View>
      <View style={themedStyles.row}>
        <Ionicons name="person-outline" size={18} color={theme.colors.accent} />
        <Text style={themedStyles.label}>BMI</Text>
        <Text style={themedStyles.value}>{valueBmi}</Text>
      </View>
      <View style={themedStyles.row}>
        <Ionicons name="flame-outline" size={18} color={theme.colors.warn} />
        <Text style={themedStyles.label}>Body Fat</Text>
        <Text style={themedStyles.value}>{valueBodyFat}</Text>
      </View>
      <View style={themedStyles.row}>
        <Ionicons name="barbell-outline" size={18} color={theme.colors.info} />
        <Text style={themedStyles.label}>Lean Mass</Text>
        <Text style={themedStyles.value}>{valueLeanMass}</Text>
      </View>
      <Text style={themedStyles.footnote}>Estimated</Text>
    </View>
  );
}
