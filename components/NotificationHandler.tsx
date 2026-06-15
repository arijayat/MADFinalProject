import { useAppNotifications } from '@/hooks/useAppNotifications';

export function NotificationHandler() {
  useAppNotifications();
  return null;
}
