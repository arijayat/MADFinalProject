import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';

import { getAuthErrorMessage } from '@/lib/firebase-errors';
import { getFirebaseAuth } from '@/lib/firebase';

WebBrowser.maybeCompleteAuthSession();

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

/** Must match a URI registered on the Google Cloud *Web* OAuth client (https only). */
const redirectUri = makeRedirectUri();

export function useGoogleSignIn() {
  const [isReady, setIsReady] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: googleWebClientId,
    redirectUri,
  });

  useEffect(() => {
    setIsReady(Boolean(request));
  }, [request]);

  const signInWithGoogle = useCallback(async () => {
    if (!googleWebClientId) {
      throw new Error(
        'Google Sign-In is not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env (see docs/FIREBASE_SETUP.md).',
      );
    }

    const result = await promptAsync();
    if (result.type !== 'success') {
      if (result.type === 'cancel' || result.type === 'dismiss') {
        throw new Error('Google sign-in was cancelled.');
      }
      throw new Error('Google sign-in failed. Try again.');
    }

    const idToken = result.params.id_token;
    if (!idToken) {
      throw new Error('Google did not return an ID token. Check OAuth client setup.');
    }

    try {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(getFirebaseAuth(), credential);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  }, [promptAsync]);

  useEffect(() => {
    if (response?.type === 'error') {
      console.warn('Google auth response error', response.error);
    }
  }, [response]);

  return {
    signInWithGoogle,
    isGoogleConfigured: Boolean(googleWebClientId),
    isReady,
  };
}
