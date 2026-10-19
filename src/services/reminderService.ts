import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'user_reminders';

export interface ReminderSettings {
  breakfast: { enabled: boolean; time: string };
  lunch: { enabled: boolean; time: string };
  dinner: { enabled: boolean; time: string };
  water: { enabled: boolean; time: string };
}

export const DEFAULT_SETTINGS: ReminderSettings = {
  breakfast: { enabled: true, time: '08:00' },
  lunch: { enabled: true, time: '13:00' },
  dinner: { enabled: true, time: '20:00' },
  water: { enabled: false, time: '10:00' },
};

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#008A47',
  });
}

export async function getReminderSettings(): Promise<ReminderSettings> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

export async function saveAndScheduleReminders(settings: ReminderSettings) {
  // Save to local storage
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  const keys = Object.keys(settings) as (keyof ReminderSettings)[];
  for (const key of keys) {
    const reminder = settings[key];
    if (!reminder.enabled) continue;
    const [hour, minute] = reminder.time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for ${key}!`,
        body: `Don't forget to log your ${key}.`,
        sound: true,
        // Read by App.tsx's notification-response listener to navigate on tap.
        // `type` is included so you can later route differently per reminder
        // (e.g. water -> Hydration, meals -> Log) without another release.
        data: { screen: 'Log', type: key },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        // Required on Android 8+ — without this the scheduled notification
        // may not fire on the custom channel you created above.
        channelId: 'reminders',
      },
    });
  }
}

export async function requestPermissions(): Promise<boolean> {
  await ensureChannel();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}