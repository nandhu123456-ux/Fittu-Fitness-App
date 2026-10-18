import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { DEFAULT_SETTINGS, getReminderSettings, ReminderSettings, saveAndScheduleReminders } from '../services/reminderService';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type Navigation = BottomTabNavigationProp<RootTabParamList, 'Reminders'>;
type ReminderKey = keyof ReminderSettings;

const LABELS: Record<ReminderKey, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  water: 'Water',
};

const SUBTITLES: Record<ReminderKey, string> = {
  breakfast: 'Morning meal',
  lunch: 'Midday meal',
  dinner: 'Evening meal',
  water: 'Hydration',
};

const HOURS = [...Array(24).keys()];

function timeFor(hour: number): string {
  return String(hour).padStart(2, '0') + ':00';
}

export default function RemindersScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Navigation>();
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickerKey, setPickerKey] = useState<ReminderKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setSettings(await getReminderSettings());
      } catch {
        setSettings(DEFAULT_SETTINGS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const KEYS: ReminderKey[] = ['breakfast', 'lunch', 'dinner', 'water'];
  const rows = useMemo(() => KEYS.map((key) => ({ key, ...(settings?.[key] ?? DEFAULT_SETTINGS[key]) })), [settings]);

  const apply = async (next: ReminderSettings) => {
    setSettings(next);
    try {
      await saveAndScheduleReminders(next);
    } catch {
      Alert.alert('Could not save reminder settings');
    }
  };

  const toggle = (key: ReminderKey, enabled: boolean) => {
    if (!settings) return;
    apply({ ...settings, [key]: { ...settings[key], enabled } });
  };

  const setTime = (key: ReminderKey, time: string) => {
    if (!settings) return;
    setPickerKey(null);
    apply({ ...settings, [key]: { ...settings[key], time } });
  };

  const themed = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
    headerTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '700', marginLeft: 12 },
    
    // Replaced marginHorizontal with padding on the ScrollView
    scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
    card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
    row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
    rowLeft: { flex: 1 },
    rowTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
    rowSubtitle: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
    timeBtn: { alignItems: 'center', flexDirection: 'row', gap: 6 },
    timeText: { color: theme.colors.accent, fontSize: 15, fontWeight: '600' },
    
    modalBackdrop: { backgroundColor: 'rgba(0,0,0,0.5)', flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 20, width: '100%', maxWidth: 340 },
    modalHeader: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 16 },
    modalTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
    modalList: { maxHeight: 300 },
    modalOption: { alignItems: 'center', borderRadius: 12, paddingVertical: 14 },
    modalOptionSelected: { backgroundColor: theme.colors.accentGlow },
    modalOptionText: { color: theme.colors.text, fontSize: 16 },
    modalOptionSelectedText: { color: theme.colors.accent, fontWeight: '700' },
    modalClose: { alignItems: 'center', marginTop: 16, paddingVertical: 12 },
    modalCloseText: { color: theme.colors.accent, fontSize: 16, fontWeight: '600' },
  }), [theme]);

  if (loading) {
    return (
      <SafeAreaView style={themed.screen}>
        <ActivityIndicator size="large" color={theme.colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={themed.screen}>
      <View style={themed.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={themed.headerTitle}>Reminders</Text>
      </View>
      
      <ScrollView contentContainerStyle={themed.scrollContent}>
        {rows.map((row) => (
          <View key={row.key} style={themed.card}>
            <View style={themed.row}>
              <View style={themed.rowLeft}>
                <Text style={themed.rowTitle}>{LABELS[row.key]} Reminder</Text>
                <Text style={themed.rowSubtitle}>{SUBTITLES[row.key]}</Text>
              </View>
              <View style={themed.timeBtn}>
                <Switch value={row.enabled} onValueChange={(v) => toggle(row.key, v)} trackColor={{ false: theme.colors.muted, true: theme.colors.accent }} thumbColor={theme.colors.accentText} />
                <Pressable onPress={() => setPickerKey(row.key)} style={{ marginLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={themed.timeText}>{row.time}</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      
      <Modal visible={pickerKey !== null} transparent onRequestClose={() => setPickerKey(null)} animationType="fade">
        <Pressable style={themed.modalBackdrop} onPress={() => setPickerKey(null)}>
          <View style={themed.modalCard} collapsable={false}>
            <View style={themed.modalHeader}>
              <Ionicons name="time" size={24} color={theme.colors.accent} />
              <Text style={themed.modalTitle}>Time for {LABELS[pickerKey!]}</Text>
            </View>
            <ScrollView style={themed.modalList} showsVerticalScrollIndicator={false}>
              {HOURS.map((h) => {
                const time = timeFor(h);
                const selected = settings?.[pickerKey!].time === time;
                return (
                  <Pressable key={h} style={[themed.modalOption, selected && themed.modalOptionSelected]} onPress={() => setTime(pickerKey!, time)}>
                    <Text style={[themed.modalOptionText, selected && themed.modalOptionSelectedText]}>{time}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable style={themed.modalClose} onPress={() => setPickerKey(null)}>
              <Text style={themed.modalCloseText}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}