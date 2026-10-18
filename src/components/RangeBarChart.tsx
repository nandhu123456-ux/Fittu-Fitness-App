import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  data: number[];
  labels: string[];
  color: string;
  target?: number;
  height?: number;
}

export function RangeBarChart({ data = [], labels = [], color, target, height = 150 }: Props) {
  const theme = useTheme();

  // 1. Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];
  const safeLabels = Array.isArray(labels) ? labels : [];

  // 2. Define maxValue (Fixes the ReferenceError)
  const maxValue = Math.max(...safeData, target ?? 0, 1);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 6 }}>
        {safeData.map((value, index) => {
          const barHeight = Math.max(4, (value / maxValue) * (height - 40));
          
          return (
            <View key={index} style={{ alignItems: 'center', justifyContent: 'flex-end', minWidth: 24 }}>
              <Text style={{ color: theme.colors.muted, fontSize: 10, marginBottom: 4 }}>
                {value > 0 ? Math.round(value) : ''}
              </Text>
              <View style={{ width: 16, height: barHeight, backgroundColor: color, borderRadius: 4 }} />
              <Text style={{ color: theme.colors.muted, fontSize: 10, marginTop: 6 }}>
                {safeLabels[index] || ''}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}