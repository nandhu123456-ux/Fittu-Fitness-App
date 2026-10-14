import { collection, doc, getDocs, limit, query, setDoc, Timestamp } from 'firebase/firestore';

import { db } from './firebase';

export interface Correction {
  query: string; // normalized lowercase query
  chosenFoodId: string;
  chosenFoodName: string;
  correctedAt: Timestamp;
}

function normalize(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Fetch all corrections for a user (up to 200). */
export async function getCorrections(uid: string): Promise<Record<string, Correction>> {
  try {
    const snap = await getDocs(
      query(collection(db, 'foodCorrections', uid, 'entries'), limit(200))
    );
    const map: Record<string, Correction> = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      const q = String(data.query ?? '');
      if (q) {
        map[q] = {
          query: q,
          chosenFoodId: String(data.chosenFoodId ?? ''),
          chosenFoodName: String(data.chosenFoodName ?? ''),
          correctedAt: data.correctedAt as Timestamp,
        };
      }
    });
    return map;
  } catch (e) {
    console.warn('[corrections] read failed', e);
    return {};
  }
}

/** Record that the user searched `queryText` and picked `chosenFood`. */
export async function recordCorrection(
  uid: string,
  queryText: string,
  chosenFood: { id: string; name: string }
): Promise<void> {
  const key = normalize(queryText);
  if (!key) return;
  try {
    await setDoc(
      doc(db, 'foodCorrections', uid, 'entries', key),
      {
        query: key,
        chosenFoodId: chosenFood.id,
        chosenFoodName: chosenFood.name,
        correctedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('[corrections] write failed', e);
  }
}
