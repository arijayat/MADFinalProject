import { User, updateProfile } from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import type { UserProfile } from '@/types/firestore';

const usersCollection = () => 'users';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getFirebaseDb(), usersCollection(), uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = doc(getFirebaseDb(), usersCollection(), user.uid);
  const existing = await getDoc(ref);

  if (existing.exists()) {
    const data = existing.data() as UserProfile;
    await updateDoc(ref, {
      email: user.email ?? data.email,
      displayName: user.displayName ?? data.displayName,
      photoURL: user.photoURL ?? data.photoURL,
      updatedAt: serverTimestamp(),
    });
    const updated = await getDoc(ref);
    return updated.data() as UserProfile;
  }

  const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    email: user.email ?? '',
    displayName: user.displayName,
    photoURL: user.photoURL,
    teamId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, profile);
  const created = await getDoc(ref);
  return created.data() as UserProfile;
}

export async function setUserTeamId(uid: string, teamId: string | null): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), usersCollection(), uid), {
    teamId,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserDisplayName(
  uid: string,
  displayName: string,
): Promise<void> {
  const trimmed = displayName.trim();
  const authUser = getFirebaseAuth().currentUser;

  if (authUser?.uid === uid) {
    await updateProfile(authUser, { displayName: trimmed || null });
  }

  await updateDoc(doc(getFirebaseDb(), usersCollection(), uid), {
    displayName: trimmed || null,
    updatedAt: serverTimestamp(),
  });
}
