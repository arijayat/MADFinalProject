import {
  EmailAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ensureUserProfile, touchUserProfile, updateUserDisplayName, updateUserProfileAfterSignUp } from '@/lib/firestore/users';
import { getAuthErrorMessage } from '@/lib/firebase-errors';
import { getFirebaseAuth } from '@/lib/firebase';
import type { SchoolLocation, UserProfile } from '@/types/firestore';

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  configError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    details: { displayName: string; schoolLocation: SchoolLocation },
  ) => Promise<void>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  updateDisplayName: (displayName: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      details: { displayName: string; schoolLocation: SchoolLocation },
    ) => {
      try {
        const trimmedEmail = email.trim();
        const trimmedName = details.displayName.trim();
        const credential = await createUserWithEmailAndPassword(
          getFirebaseAuth(),
          trimmedEmail,
          password,
        );

        if (trimmedName) {
          await updateProfile(credential.user, { displayName: trimmedName });
        }

        await updateUserProfileAfterSignUp(credential.user.uid, {
          email: trimmedEmail,
          displayName: trimmedName,
          schoolLocation: details.schoolLocation,
        });
      } catch (error) {
        throw new Error(getAuthErrorMessage(error));
      }
    },
    [],
  );

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

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const current = getFirebaseAuth().currentUser;
      if (!current?.email) {
        throw new Error('You must be signed in with email to change your password.');
      }

      try {
        const credential = EmailAuthProvider.credential(current.email, currentPassword);
        await reauthenticateWithCredential(current, credential);
        await updatePassword(current, newPassword);
        await touchUserProfile(current.uid);
        await refreshProfile();
      } catch (error) {
        throw new Error(getAuthErrorMessage(error));
      }
    },
    [refreshProfile],
  );

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  }, []);

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
      changePassword,
      resetPassword,
    }),
    [user, profile, isLoading, configError, signIn, signUp, logOut, refreshProfile, updateDisplayName, changePassword, resetPassword],
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
