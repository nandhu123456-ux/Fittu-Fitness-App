import { collection, doc, getDocs, query, where, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface DayLog {
  id: string;
  name: string;
  type: 'food' | 'water' | 'sleep';
  cal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  ml?: number;
  sleepMin?: number;
}

export async function getLogsForDate(uid: string, date: string): Promise<DayLog[]> {
  const results: DayLog[] = [];

  // 1. Food
  try {
    const foodQ = query(collection(db, 'foodLogs', uid, 'entries'), where('date', '==', date));
    const foodSnap = await getDocs(foodQ);
    foodSnap.forEach((d) => {
      const data = d.data();
      results.push({
        id: d.id,
        name: data.name || 'Food Item',
        type: 'food',
        cal: data.cal || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
      });
    });
  } catch (e) { console.warn(e); }

  // 2. Water
  try {
    const waterQ = query(collection(db, 'waterLogs', uid, 'entries'), where('date', '==', date));
    const waterSnap = await getDocs(waterQ);
    waterSnap.forEach((d) => {
      const data = d.data();
      results.push({ id: d.id, name: 'Water Log', type: 'water', ml: data.ml || 0 });
    });
  } catch (e) { console.warn(e); }

  // 3. Sleep / Activity
  try {
    const actQ = query(collection(db, 'activityLogs', uid, 'entries'), where('date', '==', date));
    const actSnap = await getDocs(actQ);
    actSnap.forEach((d) => {
      const data = d.data();
      // FIXED: Check for 'sleepMin' (our new field) AND 'sleepMinutes'
      const sleepMins = data.sleepMin || data.sleepMinutes || 0;
      if (sleepMins > 0) {
        results.push({ id: d.id, name: 'Sleep Log', type: 'sleep', sleepMin: sleepMins });
      }
    });
  } catch (e) { console.warn(e); }

  return results;
}

export async function deleteDayLog(uid: string, log: DayLog): Promise<void> {
  if (log.type === 'sleep') {
    // FIXED: Don't delete the whole activity document (it holds steps too). 
    // Just reset the sleep to 0.
    await setDoc(doc(db, 'activityLogs', uid, 'entries', log.id), { sleepMin: 0 }, { merge: true });
    return;
  }
  
  let col = 'foodLogs';
  if (log.type === 'water') col = 'waterLogs';
  
  await deleteDoc(doc(db, col, uid, 'entries', log.id));
}