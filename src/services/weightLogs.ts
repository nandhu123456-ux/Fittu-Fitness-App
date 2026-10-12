import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query } from 'firebase/firestore';

import { db } from './firebase';

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  note?: string;
}

export async function getRecentWeights(uid: string, count: number): Promise<WeightEntry[]> {
  try {
    const entries = await getDocs(query(collection(db, 'weightLogs', uid, 'entries'), orderBy('date', 'desc'), limit(count)));
    return entries.docs.map((entry) => {
      const data = entry.data();
      return { id: entry.id, date: String(data.date), weight: Number(data.weight), note: typeof data.note === 'string' ? data.note : undefined };
    });
  } catch {
    return [];
  }
}

export async function getWeightHistory(uid: string, count: number): Promise<WeightEntry[]> {
  return getRecentWeights(uid, count);
}

export async function deleteWeight(uid: string, entryId: string): Promise<void> {
  await deleteDoc(doc(db, 'weightLogs', uid, 'entries', entryId));
}

export async function addWeight(uid: string, weight: number, note?: string): Promise<void> {
  await addDoc(collection(db, 'weightLogs', uid, 'entries'), {
    date: new Date().toISOString().slice(0, 10), weight, ...(note ? { note } : {}),
  });
}
