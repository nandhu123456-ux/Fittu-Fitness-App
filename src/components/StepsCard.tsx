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
  
  const safeSteps = Number(steps) || 0;
  const safeGoal = Number(goal) || 10000;
  const pct = Math.min(100, (safeSteps / safeGoal) * 100);

  const bars = [40, 30, 50, 80, 60, 45, 70];

  const themed = useMemo(() => StyleSheet.create({
    card: { backgroundColor: theme.colors.surface, marginTop: 8, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 16 },
    topRow: { flexDirection: 'row', alignItems: 'center' },
    iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.success + '25', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    textCol: { flex: 1 },
    label: { fontSize: 13, color: theme.colors.muted, fontWeight: '600' },
    value: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginTop: 2 },
    unit: { fontSize: 12, fontWeight: '500', color: theme.colors.muted },
    barTrack: { height: 6, borderRadius: 3, backgroundColor: theme.colors.border, marginTop: 12, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3, backgroundColor: theme.colors.success },
    chartWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 32, gap: 4, marginTop: 8 },
    miniBar: { width: 5, borderRadius: 2, backgroundColor: theme.colors.border },
    miniBarActive: { backgroundColor: theme.colors.success },
  }), [theme]);

  return (
    <Pressable onPress={onPress} style={themed.card}>
      <View style={themed.topRow}>
        <View style={themed.iconWrap}>
          <Ionicons name="footsteps" size={20} color={theme.colors.success} />
        </View>
        <View style={themed.textCol}>
          <Text style={themed.label}>Steps</Text>
          <Text style={themed.value}>
            {safeSteps.toLocaleString()} <Text style={themed.unit}>/ {safeGoal.toLocaleString()}</Text>
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: theme.colors.success }}>{Math.round(pct)}%</Text>
          <View style={themed.chartWrap}>
            {bars.map((val, i) => (
              <View 
                key={i} 
                style={[
                  themed.miniBar, 
                  { height: (val / 100) * 32 }, 
                  i === 3 && themed.miniBarActive 
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