import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import { todayLocalISO } from '../utils/streak';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeekStripProps {
  onDayPress?: (date: string) => void;
  selectedDate?: string | null;
}

interface PillData {
  dayLabel: string;
  dateNumber: string;
  date: string;
  isToday: boolean;
}

export function WeekStrip({ onDayPress, selectedDate }: WeekStripProps) {
  const theme = useTheme();
  const today = todayLocalISO();
  const pills = useMemo<PillData[]>(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(end);
      d.setDate(end.getDate() - (6 - i));
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        dayLabel: DAY_LABELS[d.getDay()] ?? '',
        dateNumber: String(d.getDate()),
        date,
        isToday: date === today,
      };
    });
  }, [today]);

  return (
    <View style={[styles.row, { gap: 6 }]}>
      {pills.map((p) => (
        <WeekPill
          key={p.date}
          dayLabel={p.dayLabel}
          dateNumber={p.dateNumber}
          isToday={p.isToday}
          isSelected={p.date === selectedDate}
          onPress={() => onDayPress?.(p.date)}
          successColor={theme.colors.success}
          theme={theme}
        />
      ))}
    </View>
  );
}

function WeekPill({ dayLabel, dateNumber, isToday, isSelected, onPress, successColor, theme }: any) {
  const bg = isSelected ? successColor : isToday ? theme.colors.accent : theme.colors.surface;
  const dayColor = isSelected || isToday ? theme.colors.bg : theme.colors.muted;
  const dateColor = isSelected || isToday ? theme.colors.bg : theme.colors.text;
  return (
    <Pressable onPress={onPress} style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.dayLabel, { color: dayColor }]}>{dayLabel}</Text>
      <Text style={[styles.dateNumber, { color: dateColor }]}>{dateNumber}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  pill: { flex: 1, minHeight: 68, borderRadius: 16, padding: 10, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  dateNumber: { fontSize: 18, fontWeight: '700', marginTop: 4 },
});
