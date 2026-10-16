import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  data: number[];
  labels: string[];
  color: string;
  target?: number;
  height?: number;
}

export default function BarChart7Day({ data, labels, color, target, height = 120 }: Props) {
  const theme = useTheme();
  const maxValue = Math.max(...data, target ?? 0, 1);
  const barHeight = height * 0.85;

  return (
    <View style={[styles.container, { height }]}>
      {data.map((value, i) => {
        const h = (value / maxValue) * barHeight;
        return (
          <View key={i} style={styles.barColumn}>
            <View style={[styles.bar, { backgroundColor: color, height: h }]} />
            {value > 0 ? (
              <Text style={[styles.valueLabel, { color: theme.colors.muted }]}>{Math.round(value)}</Text>
            ) : null}
            <Text style={[styles.dayLabel, { color: theme.colors.muted }]}>{labels[i]}</Text>
          </View>
        );
      })}
      {target !== undefined && (
        <View style={[styles.targetLine, { borderTopColor: theme.colors.muted, top: height - (target / maxValue) * height }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  barColumn: { alignItems: 'center' },
  bar: { flex: 1, borderRadius: 4 },
  valueLabel: { fontSize: 10, marginTop: 4 },
  dayLabel: { fontSize: 10, marginTop: 2 },
  targetLine: { position: 'absolute', left: 0, right: 0, height: 1, borderTopWidth: 1, borderStyle: 'dashed' },
});
