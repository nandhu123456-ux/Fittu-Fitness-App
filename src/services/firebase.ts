import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// DEVIATION from CLINE_CONTEXT.md: memoryLocalCache() instead of persistentLocalCache() —
// IndexedDB is unavailable in React Native; offline persistence is a separate later task.
//
// firebase v12 ships getReactNativePersistence in the react-native build of @firebase/auth
// (Metro resolves it via the `react-native` export condition) but omits it from its public
// TS types, and the old `firebase/auth/react-native` subpath no longer exists — re-declare it.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: typeof AsyncStorage): Persistence;
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function bootstrap(): { app: FirebaseApp; auth: Auth; db: Firestore; storage: FirebaseStorage } {
  // getApps() guards against double-init on Fast Refresh re-running this module.
  const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  if (typeof getReactNativePersistence !== 'function') {
    // Loud failure, never silent memory-only auth: relaunch persistence depends on this.
    throw new Error(
      'getReactNativePersistence missing from firebase/auth — auth would not survive relaunch.',
    );
  }
  const auth: Auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

  // initializeFirestore throws failed-precondition on a second call with settings.
  let db: Firestore;
  try {
    db = initializeFirestore(app, { localCache: memoryLocalCache() });
  } catch {
    db = getFirestore(app);
  }

  const storage: FirebaseStorage = getStorage(app);
  return { app, auth, db, storage };
}

const { app, auth, db, storage } = bootstrap();

export { app, auth, db, storage };

