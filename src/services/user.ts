import { Timestamp, doc, getDoc, setDoc } from 'firebase/firestore';

import { useAuthStore } from '../store/authStore';
import type { User } from '../types/user';
import { db } from './firebase';

function recordError(e: unknown): void {
  const message = e instanceof Error ? e.message : 'Firestore request failed.';
  useAuthStore.getState().setError(message);
}

/** Creates users/{uid} with base fields; profile/goal/targets are filled during onboarding. */
export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string,
): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid), {
      uid,
      email,
      displayName,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      onboardingComplete: false,
    });
  } catch (e) {
    recordError(e);
    throw e;
  }
}

/** Returns the users/{uid} doc, or null when it does not exist yet. */
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const snapshot = await getDoc(doc(db, 'users', uid));
    if (!snapshot.exists()) return null;
    return snapshot.data() as User;
  } catch (e) {
    recordError(e);
    throw e;
  }
}

/** Merges partial user data into users/{uid} and bumps updatedAt. */
export async function updateUserProfile(uid: string, patch: Partial<User>): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid), { ...patch, updatedAt: Timestamp.now() }, { merge: true });
  } catch (e) {
    recordError(e);
    throw e;
  }
}
