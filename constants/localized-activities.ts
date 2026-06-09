import { useMemo } from 'react';

import {
  ACTIVITIES,
  HUB_ACTIVITY_ORDER,
  type ActivityConfig,
  type ActivityId,
} from '@/constants/activities';
import { useLocalization, type AppLanguage } from '@/contexts/LocalizationContext';

type ActivityText = Partial<
  Pick<
    ActivityConfig,
    | 'title'
    | 'subtitle'
    | 'hubDescription'
    | 'requirements'
    | 'gear'
    | 'safety'
    | 'dashboardVariables'
    | 'captureDoneStatusA'
    | 'captureDoneStatusB'
    | 'leaderboardSubtitle'
  >
>;

const activityText: Record<AppLanguage, Partial<Record<ActivityId, ActivityText>>> = {
  en: {},
  id: {
    'parachute-drop': {
      title: 'Uji Jatuh Parasut',
      subtitle: 'Rancang, buat, dan uji parasut. Rekam jatuhnya lalu bandingkan waktu jatuh dengan prediksimu.',
      hubDescription: 'Rekayasa + fisika: bandingkan jatuh tanpa parasut dan dengan parasut, lalu hitung hambatan dan gaya-g dari video.',
      requirements: ['Mainan kecil', 'Meja atau titik jatuh yang lebih tinggi', 'Kertas atau plastik, tali, gunting, selotip', 'Meteran atau penggaris'],
      gear: ['Mainan kecil', 'Meja atau permukaan tinggi', 'Kertas atau plastik untuk kanopi', 'Tali, gunting, dan selotip', 'Meteran atau penggaris'],
      safety: ['Selalu lakukan eksperimen di area aman dan diawasi.', 'Gunakan kacamata pengaman jika meluncurkan atau menjatuhkan benda.', 'Jaga penonton tetap berjarak aman saat pengujian.', 'Jatuhkan benda hanya di area lantai kosong.', 'Gunakan video gerak lambat hanya untuk mengukur waktu.'],
      dashboardVariables: ['Tinggi jatuh (m)', 'Massa mainan (g)', 'Aksi 1: Tanpa parasut', 'Aksi 2: Desain kanopi plastik', 'Aksi 3: Desain terbaikmu', 'Memantul saat mendarat?'],
      captureDoneStatusA: 'Video jatuh berhasil diambil',
      captureDoneStatusB: 'Waktu jatuh dan tumbukan tersimpan',
      leaderboardSubtitle: 'Peringkat Kelas 6 - Uji Jatuh Parasut',
    },
    'decibel-detector': {
      title: 'Detektor Desibel',
      subtitle: 'Ukur dan bandingkan tingkat suara dari berbagai aksi di kelas.',
      hubDescription: 'Ukur dan bandingkan tingkat suara dari berbagai aksi di kelas.',
      requirements: ['Sumber suara di kelas', 'Meteran'],
      gear: ['Meteran'],
      safety: ['Selalu lakukan eksperimen di area aman dan diawasi.', 'Gunakan kacamata pengaman jika meluncurkan atau menjatuhkan benda.', 'Jaga penonton tetap berjarak aman saat pengujian.'],
      dashboardVariables: ['Aksi 1', 'Aksi 2', 'Aksi 3', 'Lokasi / zona'],
      captureDoneStatusA: 'Tingkat suara berhasil diambil',
      captureDoneStatusB: 'Pembacaan semua aksi tersimpan',
      leaderboardSubtitle: 'Peringkat Kelas 6 - Pemburu Polusi Suara',
    },
    'hand-fan-challenge': {
      title: 'Tantangan Kipas Tangan',
      subtitle: 'Rekam pengaruh gerakan udara pada bahan fleksibel dan ukur sudut dari frame video.',
      hubDescription: 'Fisika: uji pengaruh desain kipas, kekakuan bahan, dan jarak terhadap tekukan dengan video dan pengukuran sudut.',
      requirements: ['Kertas dan karton dengan kekakuan berbeda', 'Gunting', 'Selotip', 'Meteran atau penggaris', 'Spidol', 'Kipas tangan atau desain kipas buatan'],
      gear: ['Berbagai sampel kertas/karton', 'Gunting dan selotip', 'Meteran atau penggaris', 'Busur derajat opsional'],
      safety: ['Selalu lakukan eksperimen di area aman dan diawasi.', 'Jangan arahkan kipas ke wajah atau mata.', 'Jauhkan jari dari tepi tajam saat memotong bahan.'],
      dashboardVariables: ['Desain kipas', 'Bahan', 'Jarak dari kipas (cm)', 'Prediksi sudut tekuk maksimum'],
      captureDoneStatusA: 'Rekaman video berhasil diambil',
      captureDoneStatusB: 'Pengukuran sudut dari frame tersimpan',
      leaderboardSubtitle: 'Peringkat Kelas 6 - Tantangan Kipas Tangan',
    },
    'vibration-analysis': {
      title: 'Struktur Tahan Gempa',
      subtitle: 'Rancang platform tahan gempa dan ukur kemampuan meredam getaran dengan sensor ponsel.',
      hubDescription: 'Rekayasa + Ilmu Bumi: bangun struktur peredam, lalu gunakan akselerometer dan level sensor untuk membandingkan kestabilan.',
      requirements: ['Karton, kertas, gunting, selotip', 'Gelas plastik atau kertas', 'Meja atau permukaan datar untuk digoyang pelan'],
      gear: ['Karton dan kertas', 'Gunting dan selotip', 'Gelas plastik atau kertas', 'Meja atau permukaan datar'],
      safety: ['Selalu lakukan eksperimen di area aman dan diawasi.', 'Goyangkan meja pelan. Jangan angkat, lempar, atau jatuhkan struktur.', 'Letakkan ponsel menghadap atas dan di tengah platform.'],
      dashboardVariables: ['Desain 1', 'Desain 2', 'Desain 3 terbaikmu', 'Desain paling stabil'],
      captureDoneStatusA: 'Pembacaan getaran berhasil diambil',
      captureDoneStatusB: 'Data level dan kemiringan tersimpan',
      leaderboardSubtitle: 'Peringkat Kelas 6 - Analisis Getaran',
    },
    'surface-smoothness': {
      title: 'Lab Performa Manusia',
      subtitle: 'Ukur kecepatan dan kehalusan gerakan dengan sensor getaran ponsel.',
      hubDescription: 'Selidiki gerak tubuh dengan mengukur kecepatan, kehalusan, dan koordinasi saat melakukan gerakan terkontrol.',
      requirements: ['Ruang terbuka untuk bergerak aman'],
      gear: ['Ruang terbuka untuk bergerak aman'],
      safety: ['Selalu lakukan eksperimen di area aman dan diawasi.', 'Pegang ponsel erat dan jangan ayunkan dekat orang atau benda lain.', 'Bergerak pelan dan berhenti jika merasa sakit atau pusing.'],
      dashboardVariables: ['Gerakan 1', 'Gerakan 2', 'Gerakan 3', 'Paling sulit menjaga getaran rendah', 'Kehalusan percobaan 1', 'Percobaan 2', 'Percobaan 3'],
      captureDoneStatusA: 'Getaran gerakan berhasil diambil',
      captureDoneStatusB: 'Pembacaan kecepatan dan kehalusan tersimpan',
      leaderboardSubtitle: 'Peringkat Kelas 6 - Lab Performa Manusia',
    },
    'reaction-time': {
      title: 'Tantangan Papan Reaksi',
      subtitle: 'Ukur waktu reaksi, bandingkan tangan dominan dan non-dominan, lalu ikuti target bergerak.',
      hubDescription: 'Neurosains + Matematika: ketuk saat tombol muncul, ulangi dengan tangan lain, lalu ikuti bentuk bergerak untuk mengukur koordinasi.',
      requirements: ['Permukaan meja datar', 'Kertas untuk mencatat hasil opsional'],
      gear: ['Meja datar untuk meletakkan perangkat', 'Ruang kerja yang bersih'],
      safety: ['Selalu lakukan eksperimen di area aman dan diawasi.', 'Jaga ponsel tetap datar di meja selama semua fase.', 'Gunakan satu jari tiap kali mengetuk dan menelusuri.'],
      dashboardVariables: ['Nama anggota tim', 'Tangan dominan', 'Fase 1: Reaksi ketuk', 'Fase 2: Tangan lain', 'Tangan dominan lebih cepat?', 'Percobaan menelusuri 1', 'Percobaan menelusuri 2', 'Percobaan menelusuri 3'],
      captureDoneStatusA: 'Data reaksi dan penelusuran berhasil diambil',
      captureDoneStatusB: 'Ketiga fase selesai',
      leaderboardSubtitle: 'Peringkat Kelas 6 - Tantangan Papan Reaksi',
    },
    'breathing-pattern': {
      title: 'Gerak Pernapasan Dada',
      subtitle: 'Berbaring dengan ponsel di dada untuk mengukur napas saat istirahat dan setelah olahraga ringan.',
      hubDescription: 'Ilmu Kedokteran: rekam naik-turun dada dengan sensor gerak ponsel, lalu bandingkan napas per menit.',
      requirements: ['Matras datar atau lantai bersih', 'Ruang untuk olahraga ringan'],
      gear: ['Matras atau handuk untuk berbaring', 'Ruang terbuka untuk olahraga ringan'],
      safety: ['Selalu lakukan eksperimen di area aman dan diawasi.', 'Lakukan olahraga ringan yang nyaman dan berhenti jika pusing.', 'Letakkan ponsel pelan di dada dan berdiri dengan hati-hati.'],
      dashboardVariables: ['Pernapasan saat istirahat', 'Setelah olahraga 1', 'Setelah olahraga 2', 'Lebih tinggi setelah olahraga?'],
      captureDoneStatusA: 'Rekaman gerak dada berhasil diambil',
      captureDoneStatusB: 'Ketiga fase selesai',
      leaderboardSubtitle: 'Peringkat Kelas 6 - Gerak Pernapasan Dada',
    },
  },
};

export function useLocalizedActivities() {
  const { language } = useLocalization();

  return useMemo(() => {
    const localized = Object.fromEntries(
      Object.entries(ACTIVITIES).map(([id, activity]) => [
        id,
        {
          ...activity,
          ...(activityText[language][id as ActivityId] ?? {}),
        },
      ]),
    ) as Record<ActivityId, ActivityConfig>;

    return {
      activities: localized,
      orderedActivities: HUB_ACTIVITY_ORDER.map((id) => localized[id]),
    };
  }, [language]);
}

export function useLocalizedActivity(id: string): ActivityConfig | undefined {
  const { activities } = useLocalizedActivities();
  return activities[id as ActivityId];
}
