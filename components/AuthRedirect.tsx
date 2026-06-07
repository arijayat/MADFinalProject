import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';

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
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const root = segments[0];
    if (!user && root && PROTECTED_ROOTS.has(root)) {
      router.replace('/sign-in');
    }
  }, [user, isLoading, segments, router]);

  return null;
}
