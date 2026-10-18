import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatCalories, formatGrams } from '../utils/format';
import { useTheme } from '../theme';

interface Props {
  remaining: number;
  target: number;
  eaten: number;
  protein: number;
  targetProtein: number;
}

/** Derives a useful, honest insight from real data — never claims AI when it is not. */
export function InsightCard({ remaining, target, eaten, protein, targetProtein }: Props) {
  const theme = useTheme();
  const message = useMemo(() => {
    if (target <= 0) return 'Set your daily targets to get personalised insights.';
    if (eaten <= 0) return null;
    if (remaining <= 0) return `You've hit your ${formatCalories(target)} kcal target. Great work.`;
    if (protein >= targetProtein && targetProtein > 0) return `Protein target met. ${formatCalories(remaining)} kcal remaining — keep it balanced.`;
    if (protein < targetProtein * 0.5 && targetProtein > 0) return `${formatGrams(targetProtein - protein)}g protein to go. A protein-rich dinner will help.`;
    return `${formatCalories(remaining)} kcal remaining. You're on track.`;
  }, [remaining, target, eaten, protein, targetProtein]);

  if (message === null) return null;

  const themedStyles = useMemo(() => StyleSheet.create({
    card: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, flexDirection: 'row', padding: 20 },
    text: { color: theme.colors.text, fontSize: 14, fontWeight: '500', lineHeight: 20 },
    tag: { alignSelf: 'flex-end', color: theme.colors.muted, fontSize: 10, marginTop: 8 },
  }), [theme]);
  return <View style={themedStyles.card}><Ionicons name="sparkles" size={22} color={theme.colors.accent} /><View style={styles.copy}><Text style={themedStyles.text}>{message}</Text><Text style={themedStyles.tag}>Fittu insight</Text></View></View>;
}

const styles = StyleSheet.create({
  copy: { flex: 1, marginLeft: 12 },
});
