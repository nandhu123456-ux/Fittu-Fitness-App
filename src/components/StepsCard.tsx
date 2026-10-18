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
    // Reduced padding and margin
    card: { backgroundColor: theme.colors.surface, marginTop: 8, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12 },
    topRow: { flexDirection: 'row', alignItems: 'center' },
    
    // Smaller icon
    iconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.success + '25', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    
    textCol: { flex: 1 },
    label: { fontSize: 11, color: theme.colors.muted, fontWeight: '500' },
    value: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginTop: 1 },
    unit: { fontSize: 10, fontWeight: '500', color: theme.colors.muted },
    
    // Smaller progress bar
    barTrack: { height: 4, borderRadius: 2, backgroundColor: theme.colors.border, marginTop: 8, overflow: 'hidden' },
    barFill: { height: 4, borderRadius: 2, backgroundColor: theme.colors.success },
    
    // Smaller mini bar chart
    chartWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 24, gap: 3, marginTop: 6 },
    miniBar: { width: 4, borderRadius: 2, backgroundColor: theme.colors.border },
    miniBarActive: { backgroundColor: theme.colors.success },
  }), [theme]);

  return (
    <Pressable onPress={onPress} style={themed.card}>
      <View style={themed.topRow}>
        <View style={themed.iconWrap}>
          <Ionicons name="footsteps" size={16} color={theme.colors.success} />
        </View>
        <View style={themed.textCol}>
          <Text style={themed.label}>Steps</Text>
          <Text style={themed.value}>
            {steps.toLocaleString()} <Text style={themed.unit}>/ {goal.toLocaleString()}</Text>
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.colors.success }}>{Math.round(pct)}%</Text>
          <View style={themed.chartWrap}>
            {bars.map((val, i) => (
              <View 
                key={i} 
                style={[
                  themed.miniBar, 
                  { height: (val / 100) * 24 }, 
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