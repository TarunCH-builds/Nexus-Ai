/**
 * NEXUS AI - Firebase Client Configuration
 * Initializes Firebase App, Google Auth, and Cloud Firestore.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Sync basic user profile to Firestore
  if (user) {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      displayName: user.displayName || 'Nexus User',
      email: user.email || '',
      photoURL: user.photoURL || '',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }, { merge: true });
  }

  return user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged, collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot };
export type { User };
