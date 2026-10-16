import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'prefs' });

export function getWeightUnit(): 'kg' | 'lb' {
  return (storage.getString('weightUnit') as 'kg' | 'lb') ?? 'kg';
}

export function setWeightUnit(u: 'kg' | 'lb') {
  storage.set('weightUnit', u);
}

export function getWaterUnit(): 'ml' | 'oz' {
  return (storage.getString('waterUnit') as 'ml' | 'oz') ?? 'ml';
}

export function setWaterUnit(u: 'ml' | 'oz') {
  storage.set('waterUnit', u);
}

export type ReminderKey = 'breakfast' | 'lunch' | 'dinner' | 'water' | 'weighIn';

export function getReminder(key: ReminderKey): boolean {
  return storage.getBoolean(`reminder_${key}`) ?? false;
}

export function setReminder(key: ReminderKey, value: boolean) {
  storage.set(`reminder_${key}`, value);
}
