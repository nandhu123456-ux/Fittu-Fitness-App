import { doc, getDoc, increment, setDoc } from 'firebase/firestore';

import { db } from './firebase';
import { todayLocalISO } from '../utils/streak';

// Local timezone, not UTC, so late-night water rolls to the correct calendar day.
const today = (): string => todayLocalISO();

export async function getTodaysWater(uid: string): Promise<number> {
  try {
    const snapshot = await getDoc(doc(db, 'waterLogs', uid, 'entries', today()));
    return Number(snapshot.data()?.ml ?? 0);
  } catch {
    return 0;
  }
}

export async function addWater(uid: string, ml: number): Promise<void> {
  await setDoc(doc(db, 'waterLogs', uid, 'entries', today()), { date: today(), ml: increment(ml) }, { merge: true });
}
