import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { ACTIVITIES, HUB_ACTIVITY_ORDER } from '@/constants/activities';
import { useActivitySession } from '@/contexts/ActivitySessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { hasActivityDraftProgress } from '@/lib/activity-progress/steps';
import {
  cancelAllScheduledNotifications,
  cancelInactivityReminder,
  configureNotificationHandler,
  ensureNotificationPermissions,
  parseNotificationPayload,
  scheduleInactivityReminder,
} from '@/lib/notifications/notifications';
import { defaultUserPreferences } from '@/types/firestore';

function useInactivityStats() {
  const { getSession, isActivityCompleted } = useActivitySession();

  let incompleteCount = 0;
  let hasDraftProgress = false;

  for (const activityId of HUB_ACTIVITY_ORDER) {
    if (isActivityCompleted(activityId)) continue;
    incompleteCount += 1;
    const session = getSession(activityId);
    if (hasActivityDraftProgress(ACTIVITIES[activityId], session)) {
      hasDraftProgress = true;
    }
  }

  return { incompleteCount, hasDraftProgress };
}

export function useAppNotifications() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { language } = useLocalization();
  const { incompleteCount, hasDraftProgress } = useInactivityStats();
  const notificationsEnabled =
    profile?.preferences?.notificationsEnabled ?? defaultUserPreferences.notificationsEnabled;
  const appState = useRef(AppState.currentState);
  const permissionRequested = useRef(false);

  const refreshInactivityReminder = useCallback(async () => {
    if (!user || !notificationsEnabled) {
      await cancelInactivityReminder();
      return;
    }

    const granted = await ensureNotificationPermissions();
    if (!granted) return;

    await cancelInactivityReminder();
    await scheduleInactivityReminder({
      language,
      incompleteCount,
      hasDraftProgress,
    });
  }, [user, notificationsEnabled, language, incompleteCount, hasDraftProgress]);

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    if (!user || !notificationsEnabled || permissionRequested.current) return;

    permissionRequested.current = true;
    void ensureNotificationPermissions();
  }, [user, notificationsEnabled]);

  useEffect(() => {
    if (!user || !notificationsEnabled) {
      void cancelAllScheduledNotifications();
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const previous = appState.current;
      appState.current = nextState;

      if (previous.match(/inactive|background/) && nextState === 'active') {
        void cancelInactivityReminder();
        return;
      }

      if (nextState.match(/inactive|background/)) {
        void refreshInactivityReminder();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user, notificationsEnabled, refreshInactivityReminder]);

  useEffect(() => {
    if (!notificationsEnabled) {
      void cancelAllScheduledNotifications();
    }
  }, [notificationsEnabled]);

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse | null) => {
      if (!response) return;

      const payload = parseNotificationPayload(
        response.notification.request.content.data as Record<string, unknown> | undefined,
      );

      if (!payload) return;

      if (payload.type === 'activity-complete') {
        router.push(`/activity/${payload.activityId}/leaderboard`);
        return;
      }

      router.push('/(tabs)');
    },
    [router],
  );

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    void Notifications.getLastNotificationResponseAsync().then(handleNotificationResponse);

    return () => {
      subscription.remove();
    };
  }, [handleNotificationResponse]);
}
