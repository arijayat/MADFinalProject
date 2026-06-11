import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { updateUserPreferences } from '@/lib/firestore/users';
import { defaultUserPreferences } from '@/types/firestore';

export type AppLanguage = 'en' | 'id';

type TranslationValue = string | ((params: Record<string, string | number>) => string);
type TranslationKey = keyof typeof translations.en;

type LocalizationContextValue = {
  language: AppLanguage;
  languageName: string;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const languageNames: Record<AppLanguage, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
};

const translations = {
  en: {
    back: 'Back',
    cancel: 'CANCEL',
    save: 'SAVE',
    saving: 'SAVING...',
    saved: 'Saved',
    tryAgain: 'Try again.',
    confirm: 'Confirm',
    settings: 'Settings',
    appPreferences: 'App preferences',
    settingsSubtitle: 'Adjust how the app looks and manage your account.',
    appearance: 'Appearance',
    darkMode: 'Dark mode',
    currentMode: ({ mode }: Record<string, string | number>) => `Current mode: ${mode}`,
    dark: 'Dark',
    light: 'Light',
    language: 'Language',
    languageSubtitle: ({ language }: Record<string, string | number>) => `Current language: ${language}`,
    security: 'Security',
    changePassword: 'Change password',
    tabHub: 'HUB',
    tabRankings: 'RANKINGS',
    tabTeam: 'TEAM',
    tabProfile: 'PROFILE',
    activityHub: 'Science Activity Hub',
    home: 'Home',
    yourTeam: 'Your team',
    gradeNotSet: 'Grade not set',
    currentTeam: 'Current team',
    activities: 'Activities',
    hubInstruction: 'Choose one activity, make a prediction, capture data, then compare results.',
    selectExperiment: 'Select an experiment to begin',
    requirements: 'Requirements',
    completed: 'Completed',
    account: 'Account',
    profile: 'Profile',
    profileSubtitle: 'Your account and app settings.',
    student: 'Student',
    noEmail: 'No email',
    email: 'Email',
    displayName: 'Display name',
    enterDisplayName: 'Enter your display name',
    accountSaved: 'Your account details were updated.',
    accountSaveFailed: 'Could not save account',
    logOut: 'Log out',
    signingOut: 'Signing out...',
    logOutFailed: 'Log out failed',
    logOutMessage: 'Are you sure you want to sign out?',
    team: 'Team',
    teamWorkspace: 'Team workspace',
    loadingTeam: 'Loading team from cloud...',
    teamOnboardingHint: 'Register or join a team from onboarding.',
    manageRoster: 'Manage your roster.',
    viewRoster: 'View your team roster.',
    members: ({ count }: Record<string, string | number>) => `${count} members`,
    teamDetails: 'Team details',
    teamName: 'Team name',
    enterTeamName: 'Enter team name',
    joinCode: 'Join code',
    gradeLevel: 'Grade level',
    enterGradeLevel: 'Enter grade level',
    ownerOnly: 'Only the team captain can edit team details.',
    teamMembers: 'Team members',
    noMembersAdd: 'No members yet. Add one below.',
    noMembersListed: 'No members listed yet.',
    memberName: 'Member name',
    enterMemberName: 'Enter member name',
    linkedAccount: 'Linked to an account',
    newMemberName: 'New member name',
    enterTeamMemberName: 'Enter the team member name',
    addMember: 'ADD MEMBER',
    leaveTeam: 'LEAVE TEAM',
    leaving: 'LEAVING...',
    missingName: 'Missing name',
    missingNameMessage: 'Enter a team member name first.',
    membersSaved: 'Team members were updated.',
    membersSaveFailed: 'Could not save members',
    teamSaved: 'Team details were updated.',
    teamSaveFailed: 'Could not save team',
    leaveTeamTitle: 'Leave team?',
    leaveTeamMessage: 'You will be removed from the roster. You can rejoin later with the team code.',
    leaveTeamConfirm: 'Leave team',
    leaveTeamFailed: 'Could not leave team',
    rankings: 'Rankings',
    teamLeaderboard: 'Team leaderboard',
    individualLeaderboard: 'Individual leaderboard',
    studentLabel: 'Student',
    teams: 'Teams',
    individuals: 'Individuals',
    loadingRankings: 'Loading rankings from cloud...',
    rankingsLoadFailed: 'Could not load rankings. Check Firestore rules and your connection.',
    teamRankingsInfo: 'Rankings from saved team results. Overall ranking combines scores across every activity.',
    individualRankingsInfo: 'Each student inherits their team score for every completed activity.',
    overallRanking: 'Overall ranking',
    teamStanding: ({ rank, score }: Record<string, string | number>) => `Your team is #${rank} with ${score} points.`,
    individualStanding: ({ rank, score }: Record<string, string | number>) => `You are #${rank} with ${score} points.`,
    teamsRanked: 'Teams are ranked by total activity score.',
    studentsRanked: 'Students are ranked by total activity score.',
    noRankingData: 'No ranking data yet.',
    activityRankings: 'Activity rankings',
    topTeams: 'Top teams for each activity.',
    topStudents: 'Top students for each activity.',
    seeMore: 'See more',
    yourStanding: ({ rank, score }: Record<string, string | number>) => `Your standing: #${rank} - ${score} pts`,
    yourStandingLabel: 'Your standing',
    leader: ({ name, score }: Record<string, string | number>) => `Leader: ${name} - ${score} pts`,
    overallStanding: 'Overall standing',
    activityStanding: 'Activity standing',
    closeRankings: 'Close rankings',
    yourTeamStanding: 'Your team standing',
    completedActivities: ({ count }: Record<string, string | number>) => `${count} activities`,
    you: 'You',
    unknown: 'Unknown',
    tapToContinue: 'Tap to continue',
    firebaseWarning: 'Firebase not configured - see docs/FIREBASE_SETUP.md and restart Expo.',
  },
  id: {
    back: 'Kembali',
    cancel: 'BATAL',
    save: 'SIMPAN',
    saving: 'MENYIMPAN...',
    saved: 'Tersimpan',
    tryAgain: 'Coba lagi.',
    confirm: 'Konfirmasi',
    settings: 'Pengaturan',
    appPreferences: 'Preferensi aplikasi',
    settingsSubtitle: 'Atur tampilan aplikasi dan kelola akunmu.',
    appearance: 'Tampilan',
    darkMode: 'Mode gelap',
    currentMode: ({ mode }: Record<string, string | number>) => `Mode saat ini: ${mode}`,
    dark: 'Gelap',
    light: 'Terang',
    language: 'Bahasa',
    languageSubtitle: ({ language }: Record<string, string | number>) => `Bahasa saat ini: ${language}`,
    security: 'Keamanan',
    changePassword: 'Ubah kata sandi',
    tabHub: 'BERANDA',
    tabRankings: 'PERINGKAT',
    tabTeam: 'TIM',
    tabProfile: 'PROFIL',
    activityHub: 'Pusat Aktivitas Sains',
    home: 'Beranda',
    yourTeam: 'Tim kamu',
    gradeNotSet: 'Kelas belum diatur',
    currentTeam: 'Tim saat ini',
    activities: 'Aktivitas',
    hubInstruction: 'Pilih satu aktivitas, buat prediksi, ambil data, lalu bandingkan hasil.',
    selectExperiment: 'Pilih eksperimen untuk mulai',
    requirements: 'Kebutuhan',
    completed: 'Selesai',
    account: 'Akun',
    profile: 'Profil',
    profileSubtitle: 'Akun dan pengaturan aplikasimu.',
    student: 'Siswa',
    noEmail: 'Tidak ada email',
    email: 'Email',
    displayName: 'Nama tampilan',
    enterDisplayName: 'Masukkan nama tampilan',
    accountSaved: 'Detail akunmu telah diperbarui.',
    accountSaveFailed: 'Tidak dapat menyimpan akun',
    logOut: 'Keluar',
    signingOut: 'Keluar...',
    logOutFailed: 'Gagal keluar',
    logOutMessage: 'Apakah kamu yakin ingin keluar?',
    team: 'Tim',
    teamWorkspace: 'Ruang kerja tim',
    loadingTeam: 'Memuat tim dari cloud...',
    teamOnboardingHint: 'Daftarkan atau gabung ke tim dari onboarding.',
    manageRoster: 'Kelola anggota timmu.',
    viewRoster: 'Lihat daftar anggota timmu.',
    members: ({ count }: Record<string, string | number>) => `${count} anggota`,
    teamDetails: 'Detail tim',
    teamName: 'Nama tim',
    enterTeamName: 'Masukkan nama tim',
    joinCode: 'Kode gabung',
    gradeLevel: 'Tingkat kelas',
    enterGradeLevel: 'Masukkan tingkat kelas',
    ownerOnly: 'Hanya kapten tim yang dapat mengedit detail tim.',
    teamMembers: 'Anggota tim',
    noMembersAdd: 'Belum ada anggota. Tambahkan di bawah.',
    noMembersListed: 'Belum ada anggota terdaftar.',
    memberName: 'Nama anggota',
    enterMemberName: 'Masukkan nama anggota',
    linkedAccount: 'Terhubung ke akun',
    newMemberName: 'Nama anggota baru',
    enterTeamMemberName: 'Masukkan nama anggota tim',
    addMember: 'TAMBAH ANGGOTA',
    leaveTeam: 'KELUAR DARI TIM',
    leaving: 'KELUAR...',
    missingName: 'Nama kosong',
    missingNameMessage: 'Masukkan nama anggota tim terlebih dahulu.',
    membersSaved: 'Anggota tim telah diperbarui.',
    membersSaveFailed: 'Tidak dapat menyimpan anggota',
    teamSaved: 'Detail tim telah diperbarui.',
    teamSaveFailed: 'Tidak dapat menyimpan tim',
    leaveTeamTitle: 'Keluar dari tim?',
    leaveTeamMessage: 'Kamu akan dihapus dari daftar anggota. Kamu dapat bergabung lagi nanti dengan kode tim.',
    leaveTeamConfirm: 'Keluar dari tim',
    leaveTeamFailed: 'Tidak dapat keluar dari tim',
    rankings: 'Peringkat',
    teamLeaderboard: 'Papan peringkat tim',
    individualLeaderboard: 'Papan peringkat individu',
    studentLabel: 'Siswa',
    teams: 'Tim',
    individuals: 'Individu',
    loadingRankings: 'Memuat peringkat dari cloud...',
    rankingsLoadFailed: 'Tidak dapat memuat peringkat. Periksa aturan Firestore dan koneksimu.',
    teamRankingsInfo: 'Peringkat berasal dari hasil tim yang tersimpan. Peringkat keseluruhan menggabungkan skor semua aktivitas.',
    individualRankingsInfo: 'Setiap siswa memakai skor timnya untuk setiap aktivitas yang selesai.',
    overallRanking: 'Peringkat keseluruhan',
    teamStanding: ({ rank, score }: Record<string, string | number>) => `Tim kamu peringkat #${rank} dengan ${score} poin.`,
    individualStanding: ({ rank, score }: Record<string, string | number>) => `Kamu peringkat #${rank} dengan ${score} poin.`,
    teamsRanked: 'Tim diurutkan berdasarkan total skor aktivitas.',
    studentsRanked: 'Siswa diurutkan berdasarkan total skor aktivitas.',
    noRankingData: 'Belum ada data peringkat.',
    activityRankings: 'Peringkat aktivitas',
    topTeams: 'Tim terbaik untuk setiap aktivitas.',
    topStudents: 'Siswa terbaik untuk setiap aktivitas.',
    seeMore: 'Lihat lainnya',
    yourStanding: ({ rank, score }: Record<string, string | number>) => `Posisimu: #${rank} - ${score} poin`,
    yourStandingLabel: 'Posisimu',
    leader: ({ name, score }: Record<string, string | number>) => `Pemimpin: ${name} - ${score} poin`,
    overallStanding: 'Posisi keseluruhan',
    activityStanding: 'Posisi aktivitas',
    closeRankings: 'Tutup peringkat',
    yourTeamStanding: 'Posisi tim kamu',
    completedActivities: ({ count }: Record<string, string | number>) => `${count} aktivitas`,
    you: 'Kamu',
    unknown: 'Tidak diketahui',
    tapToContinue: 'Ketuk untuk lanjut',
    firebaseWarning: 'Firebase belum dikonfigurasi - lihat docs/FIREBASE_SETUP.md dan mulai ulang Expo.',
  },
} satisfies Record<AppLanguage, Record<string, TranslationValue>>;

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [language, setLanguageState] = useState<AppLanguage>(defaultUserPreferences.language);

  useEffect(() => {
    if (!user) {
      setLanguageState(defaultUserPreferences.language);
      return;
    }

    const saved = profile?.preferences?.language;
    if (saved === 'en' || saved === 'id') {
      setLanguageState(saved);
    }
  }, [user?.uid, profile?.preferences?.language]);

  const setLanguage = useCallback(
    (nextLanguage: AppLanguage) => {
      setLanguageState(nextLanguage);
      if (!user) return;
      void updateUserPreferences(user.uid, { language: nextLanguage }).catch((error) => {
        console.error('Failed to save language preference', error);
      });
    },
    [user],
  );

  const value = useMemo<LocalizationContextValue>(() => {
    function t(key: TranslationKey, params: Record<string, string | number> = {}) {
      const entry = translations[language][key] ?? translations.en[key];
      return typeof entry === 'function' ? entry(params) : entry;
    }

    return {
      language,
      languageName: languageNames[language],
      setLanguage,
      t,
    };
  }, [language, setLanguage]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  const ctx = useContext(LocalizationContext);
  if (!ctx) throw new Error('useLocalization must be used within LocalizationProvider');
  return ctx;
}

export const availableLanguages: { code: AppLanguage; label: string }[] = [
  { code: 'en', label: languageNames.en },
  { code: 'id', label: languageNames.id },
];
