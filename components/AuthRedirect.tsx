import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';

function getPostAuthRoute(hasTeam: boolean): '/(tabs)' | '/team-onboarding' {
  return hasTeam ? '/(tabs)' : '/team-onboarding';
}

const PROTECTED_ROOTS = new Set([
  '(tabs)',
  'settings',
  'change-password',
  'team-onboarding',
  'join-team',
  'join-team-pick-name',
  'leave-team-captain',
  'team-registration',
  'team-members',
  'activity',
]);

export function AuthRedirect() {
  const { user, profile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const root = segments[0];
    const isAuthScreen = root === 'sign-in' || root === 'log-in' || root === 'create-account';
    if (user && isAuthScreen) {
      router.replace(getPostAuthRoute(Boolean(profile?.teamId)));
      return;
    }

    if (user && root === 'team-onboarding' && profile?.teamId) {
      router.replace('/(tabs)');
      return;
    }

    if (!user && root && PROTECTED_ROOTS.has(root)) {
      router.replace('/sign-in');
    }
  }, [user, profile?.teamId, isLoading, segments, router]);

  return null;
}
