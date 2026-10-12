import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseAuthUser,
} from 'firebase/auth';

import { useAuthStore } from '../store/authStore';
import { auth } from './firebase';
import { createUserProfile } from './user';

function toAuthError(e: unknown): Error {
  if (e instanceof Error) return e;
  return new Error('Authentication failed.');
}

/** Creates the Auth user, then the users/{uid} doc. Profile-write failure is surfaced
 *  via authStore.error but does NOT block onboarding (the Auth user already exists). */
export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<void> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    try {
      await createUserProfile(credential.user.uid, email, displayName);
    } catch (profileError) {
      // error already recorded in authStore by createUserProfile — continue to onboarding
      console.warn('createUserProfile failed after signup:', profileError);
    }
  } catch (e) {
    throw toAuthError(e);
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    throw toAuthError(e);
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    useAuthStore.getState().setError(null);
  } catch (e) {
    useAuthStore.getState().setError(toAuthError(e).message);
    throw e;
  }
}

/** Subscribes to auth-state changes; caller must invoke the returned unsubscribe on unmount. */
export function onAuthChange(
  callback: (user: FirebaseAuthUser | null) => void,
): () => void {
  return onAuthStateChanged(auth, callback);
}
