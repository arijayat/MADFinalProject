import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { AppLanguage } from '@/contexts/LocalizationContext';
import type { ActivityId } from '@/constants/activities';

import {
  getNotificationMessages,
  INACTIVITY_NOTIFICATION_ID,
} from '@/lib/notifications/messages';

export const INACTIVITY_DELAY_SECONDS = 24 * 60 * 60;

export type NotificationPayload =
  | { type: 'activity-complete'; activityId: ActivityId }
  | { type: 'inactivity' };

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function notificationsSupportedOnPlatform(): boolean {
  return Platform.OS !== 'web';
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (!notificationsSupportedOnPlatform()) return false;
  if (!Device.isDevice) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'STEM Learning Lab',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E6F4FE',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  return requested.granted;
}

export async function cancelInactivityReminder(): Promise<void> {
  if (!notificationsSupportedOnPlatform()) return;
  await Notifications.cancelScheduledNotificationAsync(INACTIVITY_NOTIFICATION_ID);
}

export async function scheduleInactivityReminder(params: {
  language: AppLanguage;
  incompleteCount: number;
  hasDraftProgress: boolean;
}): Promise<void> {
  if (!notificationsSupportedOnPlatform()) return;

  const copy = getNotificationMessages(params.language);

  await Notifications.scheduleNotificationAsync({
    identifier: INACTIVITY_NOTIFICATION_ID,
    content: {
      title: copy.inactivityTitle,
      body: copy.inactivityBody({
        incompleteCount: params.incompleteCount,
        hasDraftProgress: params.hasDraftProgress,
      }),
      data: { type: 'inactivity' } satisfies NotificationPayload,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: INACTIVITY_DELAY_SECONDS,
    },
  });
}

export async function notifyActivityCompleted(params: {
  language: AppLanguage;
  activityId: ActivityId;
  activityTitle: string;
}): Promise<void> {
  if (!notificationsSupportedOnPlatform()) return;

  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  const copy = getNotificationMessages(params.language);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.activityCompleteTitle,
      body: copy.activityCompleteBody({ activityTitle: params.activityTitle }),
      data: {
        type: 'activity-complete',
        activityId: params.activityId,
      } satisfies NotificationPayload,
      sound: true,
    },
    trigger: null,
  });
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  if (!notificationsSupportedOnPlatform()) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function parseNotificationPayload(
  data: Record<string, unknown> | undefined,
): NotificationPayload | null {
  if (!data || typeof data.type !== 'string') return null;

  if (data.type === 'inactivity') {
    return { type: 'inactivity' };
  }

  if (data.type === 'activity-complete' && typeof data.activityId === 'string') {
    return { type: 'activity-complete', activityId: data.activityId as ActivityId };
  }

  return null;
}
