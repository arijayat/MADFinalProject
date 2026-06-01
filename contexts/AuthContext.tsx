import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getAuthErrorMessage } from '@/lib/firebase-errors';
import { getFirebaseAuth } from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  configError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      const auth = getFirebaseAuth();
      unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setIsLoading(false);
      });
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : 'Firebase configuration error.');
      setIsLoading(false);
    }

    return () => unsubscribe?.();
  }, []);

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
    await signOut(getFirebaseAuth());
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, configError, signIn, signUp, logOut }),
    [user, isLoading, configError, signIn, signUp, logOut],
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
