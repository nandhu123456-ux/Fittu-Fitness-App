import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

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
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return Array.from({ length: 31 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() - 15 + i);
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {pills.map((p) => (
        <WeekPill
          key={p.date}
          dayLabel={p.dayLabel}
          dateNumber={p.dateNumber}
          isToday={p.isToday}
          isSelected={p.date === selectedDate}
          onPress={() => onDayPress?.(p.date)}
          theme={theme}
        />
      ))}
    </ScrollView>
  );
}

function WeekPill({ dayLabel, dateNumber, isToday, isSelected, onPress, theme }: any) {
  const bg = isSelected ? theme.colors.accent : isToday ? theme.colors.accent + '55' : theme.colors.surface;
  const dayColor = isSelected ? theme.colors.bg : theme.colors.muted;
  const dateColor = isSelected ? theme.colors.bg : theme.colors.text;
  
  return (
    <Pressable onPress={onPress} style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.dayLabel, { color: dayColor }]}>{dayLabel}</Text>
      <Text style={[styles.dateNumber, { color: dateColor }]}>{dateNumber}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Reduced margins and gap
  row: { flexDirection: 'row', gap: 4, marginTop: 8, paddingHorizontal: 2 },
  // Drastically reduced width, height, and radius
  pill: { width: 38, minHeight: 50, borderRadius: 12, padding: 6, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateNumber: { fontSize: 14, fontWeight: '700', marginTop: 2 },
});