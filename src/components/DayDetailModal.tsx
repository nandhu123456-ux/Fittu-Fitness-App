import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getEntriesForDate } from '../services/foodLogService';
import type { FoodLogEntry } from '../services/foodLogService';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';

interface Props {
  visible: boolean;
  date: string | null;
  onClose: () => void;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function DayDetailModal({ visible, date, onClose }: Props) {
  const theme = useTheme();
  const { user } = useAuthStore();
  const uid = user?.uid;
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !date || !uid) {
      setEntries([]);
      return;
    }
    let active = true;
    setLoading(true);
    void getEntriesForDate(uid, date).then((result) => {
      if (active) {
        setEntries(result);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [visible, date, uid]);

  const totalCal = entries.reduce((sum, e) => sum + (e.cal ?? 0), 0);

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        overlay: { backgroundColor: theme.colors.overlay, flex: 1, justifyContent: 'flex-end' },
        sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
        title: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
        subtitle: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
        emptyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600', marginTop: 12 },
        emptyCopy: { color: theme.colors.muted, fontSize: 13, marginTop: 6, textAlign: 'center' },
        close: { backgroundColor: theme.colors.accent, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
        closeText: { color: theme.colors.bg, fontSize: 15, fontWeight: '700' },
        entryCard: { backgroundColor: theme.colors.surfaceHi, borderRadius: 12, padding: 12, marginBottom: 8 },
        mealType: { color: theme.colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
        foodName: { color: theme.colors.text, fontSize: 15, fontWeight: '600', marginTop: 2 },
        calRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
        calText: { color: theme.colors.muted, fontSize: 13 },
      }),
    [theme],
  );

  if (!date) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={themedStyles.overlay}>
        <Pressable onPress={(e) => e.stopPropagation()} style={themedStyles.sheet}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.colors.accent} />
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.muted} />
              <Text style={themedStyles.emptyTitle}>No meals logged</Text>
              <Text style={themedStyles.emptyCopy}>You didn't log anything on {formatDate(date)}</Text>
            </View>
          ) : (
            <>
              <Text style={themedStyles.title}>{formatDate(date)}</Text>
              <Text style={themedStyles.subtitle}>{entries.length} meals · {totalCal} kcal</Text>
              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {entries.map((entry) => (
                  <View key={entry.id} style={themedStyles.entryCard}>
                    <Text style={themedStyles.mealType}>{capitalize(entry.mealType)}</Text>
                    <Text style={themedStyles.foodName} numberOfLines={2}>{entry.name}</Text>
                    <View style={themedStyles.calRow}>
                      <Text style={themedStyles.calText}>{entry.cal} kcal</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <Pressable onPress={onClose} style={themedStyles.close}>
                <Text style={themedStyles.closeText}>Close</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  list: { marginTop: 12, marginBottom: 8 },
});