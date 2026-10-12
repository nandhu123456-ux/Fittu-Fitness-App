import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from './firebase';

const today = (): string => new Date().toISOString().slice(0, 10);

export async function getTodayMood(uid: string): Promise<string | null> {
  try {
    const snapshot = await getDoc(doc(db, 'moodLogs', uid, 'entries', today()));
    return typeof snapshot.data()?.mood === 'string' ? snapshot.data()?.mood : null;
  } catch {
    return null;
  }
}

export async function setMood(uid: string, mood: string): Promise<void> {
  await setDoc(doc(db, 'moodLogs', uid, 'entries', today()), { date: today(), mood });
}
