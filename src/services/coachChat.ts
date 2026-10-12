import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, Timestamp } from 'firebase/firestore';

import { db } from './firebase';

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

const REPLIES = [
  "I hear you. Let's keep going.",
  'One step at a time. What did you eat today?',
  'Consistency beats perfection. Log your next meal.',
];

let replyIndex = 0;

/**
 * STUB — returns a rotating hardcoded reply. Will be replaced with the real Vercel AI
 * call later; keep this signature: (uid, userMessage) => Promise<string>.
 */
export async function getAssistantReply(uid: string, userMessage: string): Promise<string> {
  void uid;
  void userMessage;
  const reply = REPLIES[replyIndex % REPLIES.length] as string;
  replyIndex += 1;
  return reply;
}
