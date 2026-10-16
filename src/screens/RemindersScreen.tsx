import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { getReminder, setReminder, type ReminderKey } from '../services/preferences';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type Navigation = BottomTabNavigationProp<RootTabParamList, 'Profile'>;

interface ReminderRow {
  key: ReminderKey;
  title: string;
  subtitle: string;
}

const REMINDERS: ReminderRow[] = [
  { key: 'breakfast', title: 'Breakfast reminder', subtitle: '8:00 AM' },
  { key: 'lunch', title: 'Lunch reminder', subtitle: '1:00 PM' },
  { key: 'dinner', title: 'Dinner reminder', subtitle: '8:00 PM' },
  { key: 'water', title: 'Water reminder', subtitle: 'Every 2 hours' },
  { key: 'weighIn', title: 'Weigh-in reminder', subtitle: '7:00 AM' },
];

export default function RemindersScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Navigation>();
  const [reminders, setReminders] = useState<Record<ReminderKey, boolean>>({
    breakfast: getReminder('breakfast'),
    lunch: getReminder('lunch'),
    dinner: getReminder('dinner'),
    water: getReminder('water'),
    weighIn: getReminder('weighIn'),
  });

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        screen: { backgroundColor: theme.colors.bg, flex: 1 },
        header: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 20,
          paddingTop: 20,
        },
        headerTitle: {
          color: theme.colors.text,
          fontSize: 20,
          fontWeight: '600',
          marginLeft: 12,
        },
        subtitle: {
          color: theme.colors.muted,
          fontSize: 13,
          marginTop: 8,
          paddingHorizontal: 20,
        },
        card: {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: 20,
          borderWidth: 1,
          marginHorizontal: 20,
          marginTop: 16,
          overflow: 'hidden',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        rowDivider: { borderTopColor: theme.colors.border, borderTopWidth: 1 },
        rowText: { flex: 1 },
        rowTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
        rowSubtitle: { color: theme.colors.muted, fontSize: 12, marginTop: 1 },
      }),
    [theme]
  );

  const toggleReminder = (key: ReminderKey, value: boolean) => {
    setReminders((prev) => ({ ...prev, [key]: value }));
    setReminder(key, value);
    if (value) {
      Alert.alert(
        'Notification support is coming in the next update. Your preference has been saved.'
      );
    }
  };

  return (
    <ScrollView style={themedStyles.screen} contentContainerStyle={styles.content}>
      <View style={themedStyles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons color={theme.colors.text} name="chevron-back" size={24} />
        </Pressable>
        <Text style={themedStyles.headerTitle}>Reminders</Text>
      </View>
      <Text style={themedStyles.subtitle}>Get notified to stay on track</Text>

      <View style={themedStyles.card}>
        {REMINDERS.map((row, index) => (
          <View key={row.key} style={[themedStyles.row, index > 0 && themedStyles.rowDivider]}>
            <View style={themedStyles.rowText}>
              <Text style={themedStyles.rowTitle}>{row.title}</Text>
              <Text style={themedStyles.rowSubtitle}>{row.subtitle}</Text>
            </View>
            <Switch
              value={reminders[row.key]}
              onValueChange={(value) => toggleReminder(row.key, value)}
              trackColor={{ false: theme.colors.borderStrong, true: theme.colors.accent }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
});
