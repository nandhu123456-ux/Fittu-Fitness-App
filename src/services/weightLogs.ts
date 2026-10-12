import { addDoc, collection, getDocs, limit, orderBy, query } from 'firebase/firestore';

import { db } from './firebase';

export interface WeightEntry {
  date: string;
  weight: number;
}

export async function getRecentWeights(uid: string, count: number): Promise<WeightEntry[]> {
  try {
    const entries = await getDocs(query(collection(db, 'weightLogs', uid, 'entries'), orderBy('date', 'desc'), limit(count)));
    return entries.docs.map((entry) => {
      const data = entry.data();
      return { date: String(data.date), weight: Number(data.weight) };
    });
  } catch {
    return [];
  }
}

export async function addWeight(uid: string, weight: number, note?: string): Promise<void> {
  await addDoc(collection(db, 'weightLogs', uid, 'entries'), {
    date: new Date().toISOString().slice(0, 10), weight, ...(note ? { note } : {}),
  });
}
