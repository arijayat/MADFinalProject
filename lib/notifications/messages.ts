import type { AppLanguage } from '@/contexts/LocalizationContext';

export const INACTIVITY_NOTIFICATION_ID = 'stem-inactivity-reminder';

type ActivityCompleteParams = {
  activityTitle: string;
};

type InactivityParams = {
  incompleteCount: number;
  hasDraftProgress: boolean;
};

const messages = {
  en: {
    activityCompleteTitle: 'Activity complete!',
    activityCompleteBody: ({ activityTitle }: ActivityCompleteParams) =>
      `Great work finishing ${activityTitle}. See how your team ranks!`,
    inactivityTitle: 'Ready for more science?',
    inactivityBody: ({ incompleteCount, hasDraftProgress }: InactivityParams) => {
      if (hasDraftProgress) {
        return 'You have an activity in progress. Jump back in and finish your experiment.';
      }
      if (incompleteCount > 0) {
        return `You still have ${incompleteCount} activit${incompleteCount === 1 ? 'y' : 'ies'} to explore in STEM Learning Lab.`;
      }
      return 'Open STEM Learning Lab and keep your science streak going.';
    },
  },
  id: {
    activityCompleteTitle: 'Aktivitas selesai!',
    activityCompleteBody: ({ activityTitle }: ActivityCompleteParams) =>
      `Kerja bagus menyelesaikan ${activityTitle}. Lihat peringkat timmu!`,
    inactivityTitle: 'Siap lanjut eksperimen?',
    inactivityBody: ({ incompleteCount, hasDraftProgress }: InactivityParams) => {
      if (hasDraftProgress) {
        return 'Kamu masih punya aktivitas yang belum selesai. Lanjutkan eksperimenmu.';
      }
      if (incompleteCount > 0) {
        return `Masih ada ${incompleteCount} aktivitas yang bisa kamu jelajahi di STEM Learning Lab.`;
      }
      return 'Buka STEM Learning Lab dan lanjutkan eksperimen sainsmu.';
    },
  },
} satisfies Record<
  AppLanguage,
  {
    activityCompleteTitle: string;
    activityCompleteBody: (params: ActivityCompleteParams) => string;
    inactivityTitle: string;
    inactivityBody: (params: InactivityParams) => string;
  }
>;

export function getNotificationMessages(language: AppLanguage) {
  return messages[language] ?? messages.en;
}
