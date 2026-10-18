import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface Props {
  steps: number;
  goal?: number;
  onPress?: () => void;
}

export function StepsCard({ steps, goal = 10000, onPress }: Props) {
  const theme = useTheme();
  const pct = Math.min(100, (steps / goal) * 100);

  // Fake mini bar chart data to match the design
  const bars = [40, 30, 50, 80, 60, 45, 70];

  const themed = useMemo(() => StyleSheet.create({
    card: { backgroundColor: theme.colors.surface, marginTop: 12, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16 },
    topRow: { flexDirection: 'row', alignItems: 'center' },
    iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.success + '25', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    textCol: { flex: 1 },
    label: { fontSize: 13, color: theme.colors.muted, fontWeight: '500' },
    value: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginTop: 2 },
    unit: { fontSize: 13, fontWeight: '500', color: theme.colors.muted },
    barTrack: { height: 6, borderRadius: 3, backgroundColor: theme.colors.border, marginTop: 16, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3, backgroundColor: theme.colors.success },
    chartWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 40, gap: 4, marginTop: 16 },
    miniBar: { width: 6, borderRadius: 3, backgroundColor: theme.colors.border },
    miniBarActive: { backgroundColor: theme.colors.success },
  }), [theme]);

  return (
    <Pressable onPress={onPress} style={themed.card}>
      <View style={themed.topRow}>
        <View style={themed.iconWrap}>
          <Ionicons name="footsteps" size={22} color={theme.colors.success} />
        </View>
        <View style={themed.textCol}>
          <Text style={themed.label}>Steps</Text>
          <Text style={themed.value}>
            {steps.toLocaleString()} <Text style={themed.unit}>/ {goal.toLocaleString()} steps</Text>
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.success }}>{Math.round(pct)}%</Text>
          <View style={themed.chartWrap}>
            {bars.map((val, i) => (
              <View 
                key={i} 
                style={[
                  themed.miniBar, 
                  { height: (val / 100) * 40 }, 
                  i === 3 && themed.miniBarActive // Highlight today (index 3)
                ]} 
              />
            ))}
          </View>
        </View>
      </View>
      <View style={themed.barTrack}>
        <View style={[themed.barFill, { width: `${pct}%` }]} />
      </View>
    </Pressable>
  );
}