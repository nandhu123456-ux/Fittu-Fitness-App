import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'user_reminders_v4';

export interface Reminder {
  id: string;
  title: string;
  enabled: boolean;
  time: string; // "HH:MM" (24-hour format internally)
  repeatCount: number; // 1 to 4
  everyDay: boolean;
}

export const DEFAULT_REMINDERS: Reminder[] = [
  { id: 'sleep', title: 'Sleep', enabled: true, time: '22:00', repeatCount: 1, everyDay: true },
  { id: 'breakfast', title: 'Breakfast', enabled: true, time: '08:30', repeatCount: 1, everyDay: true },
  { id: 'lunch', title: 'Lunch', enabled: true, time: '13:00', repeatCount: 1, everyDay: true },
  { id: 'dinner', title: 'Dinner', enabled: true, time: '20:00', repeatCount: 1, everyDay: true },
];

export async function getReminders(): Promise<Reminder[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_REMINDERS;
    // Basic migration/safety for missing repeatCount
    const parsed = JSON.parse(data) as Reminder[];
    return parsed.map(r => ({ ...r, repeatCount: r.repeatCount || 1 }));
  } catch {
    return DEFAULT_REMINDERS;
  }
}

async function ensureChannel(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#008A47',
    });
    return true;
  } catch {
    return false;
  }
}

export async function saveAndScheduleReminders(reminders: Reminder[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const reminder of reminders) {
    if (!reminder.enabled) continue;

    const [startHour, startMinute] = reminder.time.split(':').map(Number);
    // Enforce max 4, min 1
    const count = Math.min(Math.max(reminder.repeatCount || 1, 1), 4);

    for (let i = 0; i < count; i++) {
      const triggerHour = (startHour + i) % 24;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time for ${reminder.title}!`,
          body: count > 1 ? `Reminder ${i + 1} of ${count} for ${reminder.title}.` : `Don't forget your ${reminder.title} routine.`,
          sound: true,
          data: { screen: 'Reminders' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: triggerHour,
          minute: startMinute,
          channelId: 'reminders',
        },
      });
    }
  }
}

export async function requestPermissions(): Promise<boolean> {
  await ensureChannel();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}