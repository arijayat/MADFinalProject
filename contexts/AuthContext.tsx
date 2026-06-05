import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ensureUserProfile, updateUserDisplayName } from '@/lib/firestore/users';
import { getAuthErrorMessage } from '@/lib/firebase-errors';
import { getFirebaseAuth } from '@/lib/firebase';
import type { UserProfile } from '@/types/firestore';

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  configError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  updateDisplayName: (displayName: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  const loadProfile = useCallback(async (authUser: User) => {
    const next = await ensureUserProfile(authUser);
    setProfile(next);
    return next;
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    const current = getFirebaseAuth().currentUser;
    if (!current) {
      setProfile(null);
      return null;
    }
    const next = await ensureUserProfile(current);
    setProfile(next);
    return next;
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      const auth = getFirebaseAuth();
      unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
        setUser(nextUser);
        if (nextUser) {
          try {
            await loadProfile(nextUser);
          } catch (error) {
            console.error('Failed to load user profile', error);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      });
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : 'Firebase configuration error.');
      setIsLoading(false);
    }

    return () => unsubscribe?.();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  }, []);

  const logOut = useCallback(async () => {
    setUser(null);
    setProfile(null);
    await signOut(getFirebaseAuth());
  }, []);

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      const current = getFirebaseAuth().currentUser;
      if (!current) throw new Error('You must be signed in to update your profile.');
      await updateUserDisplayName(current.uid, displayName);
      await refreshProfile();
    },
    [refreshProfile],
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      configError,
      signIn,
      signUp,
      logOut,
      refreshProfile,
      updateDisplayName,
    }),
    [user, profile, isLoading, configError, signIn, signUp, logOut, refreshProfile, updateDisplayName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
