import { collection, addDoc, deleteDoc, doc, getDocs, limit, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { todayLocalISO } from '../utils/streak';

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  note?: string;
  createdAt?: number;
}

export async function getRecentWeights(uid: string, count: number): Promise<WeightEntry[]> {
  try {
    const entries = await getDocs(query(collection(db, 'weightLogs', uid, 'entries'), orderBy('date', 'desc'), limit(count)));
    return entries.docs.map((entry) => {
      const data = entry.data();
      return { 
        id: entry.id, 
        date: String(data.date), 
        weight: Number(data.weight), 
        note: typeof data.note === 'string' ? data.note : undefined,
        createdAt: data.createdAt ? Number(data.createdAt) : 0
      };
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
  const now = Date.now();

  // 1. Add to history with a precise millisecond timestamp
  await addDoc(collection(db, 'weightLogs', uid, 'entries'), {
    date: todayLocalISO(),
    weight,
    createdAt: now,
    ...(note ? { note } : {}),
  });

  // 2. Update the user's main profile so the dashboard knows
  try {
    await updateDoc(doc(db, 'users', uid), {
      'profile.weightKg': weight,
    });
  } catch (e) {
    console.warn('[weightLogs] Failed to update user profile weight', e);
  }
}