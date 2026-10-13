import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, Timestamp } from 'firebase/firestore';

import { auth, db } from './firebase';

const COACH_URL = 'https://be-fit-nine.vercel.app/api/coach-chat';
const FALLBACK = "Sorry, I couldn't reach the coach. Try again.";

interface CoachPayload {
  reply?: string | null;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: Timestamp;
}

function messagesRef(uid: string) {
  return collection(db, 'coachChats', uid, 'messages');
}

/** Appends a user message to coachChats/{uid}/messages. */
export async function sendMessage(uid: string, content: string): Promise<void> {
  try {
    await addDoc(messagesRef(uid), { role: 'user', content, ts: serverTimestamp() });
  } catch {
    // swallow — optimistic UI already shows the message
  }
}

/** Appends an assistant reply to coachChats/{uid}/messages. */
export async function saveAssistantMessage(uid: string, content: string): Promise<void> {
  try {
    await addDoc(messagesRef(uid), { role: 'assistant', content, ts: serverTimestamp() });
  } catch {
    // swallow
  }
}

/** Reads the most recent messages ordered oldest→newest. Returns [] on failure. */
export async function getChatHistory(uid: string, cap = 50): Promise<CoachMessage[]> {
  try {
    const snapshots = await getDocs(query(messagesRef(uid), orderBy('ts', 'asc'), limit(cap)));
    return snapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() } as CoachMessage));
  } catch {
    return [];
  }
}

/**
 * Real AI coach — fetches the last 6 messages as context, POSTs to the Vercel
 * coach-chat function, and returns the reply string. Same signature as the old
 * stub. Returns a friendly fallback on any failure.
 */
export async function getAssistantReply(uid: string, userMessage: string): Promise<string> {
  try {
    const history = await getChatHistory(uid, 6);
    const mapped = [...history, { role: 'user' as const, content: userMessage }]
      .slice(-6)
      .map((message) => ({ role: message.role, content: message.content }));
    const user = auth.currentUser;
    if (!user) return FALLBACK;
    const idToken = await user.getIdToken();
    const res = await fetch(COACH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ message: userMessage, history: mapped }),
    });
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as CoachPayload;
    if (!data.reply) return FALLBACK;
    return data.reply;
  } catch (e) {
    console.error('[coachChat] error', e);
    return FALLBACK;
  }
}
