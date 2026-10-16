import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import { todayLocalISO } from '../utils/streak';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/** Returns the Monday of the week containing `date` (local). */
function startOfWeek(date: Date): Date {
  const day = date.getDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  const monday = new Date(date);
  monday.setDate(date.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

interface PillProps {
  dayLabel: string;
  dateNumber: string;
  isToday: boolean;
}

function WeekPill({ dayLabel, dateNumber, isToday }: PillProps) {
  const theme = useTheme();
  const bg = isToday ? theme.colors.accent : theme.colors.surface;
  const dayColor = isToday ? theme.colors.bg : theme.colors.muted;
  const dateColor = isToday ? theme.colors.bg : theme.colors.text;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.dayLabel, { color: dayColor }]}>{dayLabel}</Text>
      <Text style={[styles.dateNumber, { color: dateColor }]}>{dateNumber}</Text>
    </View>
  );
}

export function WeekStrip() {
  const theme = useTheme();
  const today = todayLocalISO();
  const pills = useMemo(() => {
    const monday = startOfWeek(new Date());
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        dayLabel: DAY_LABELS[i] ?? '',
        dateNumber: String(d.getDate()),
        isToday: iso === today,
      };
    });
  }, [today]);

  return (
    <View style={[styles.row, { gap: 8 }]}>
      {pills.map((p) => (
        <WeekPill key={p.dayLabel} dayLabel={p.dayLabel} dateNumber={p.dateNumber} isToday={p.isToday} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 16 },
  pill: { flex: 1, minHeight: 68, borderRadius: 16, padding: 10, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  dateNumber: { fontSize: 18, fontWeight: '700', marginTop: 4 },
});