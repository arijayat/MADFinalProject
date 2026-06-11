import type { Timestamp } from 'firebase/firestore';

import type { ActivityId } from '@/constants/activities';

export type FirestoreTeamMember = {
  id: string;
  name: string;
  /** Set when this member has signed in and joined the team */
  uid?: string;
  email?: string;
};

export type SchoolLocation = {
  latitude: number;
  longitude: number;
  /** Human-readable place name from reverse geocoding */
  label: string | null;
};

export type UserPreferences = {
  themeMode: 'light' | 'dark';
  language: 'en' | 'id';
};

export const defaultUserPreferences: UserPreferences = {
  themeMode: 'light',
  language: 'en',
};

export type UserProfile = {
  email: string;
  displayName: string | null;
  photoURL: string | null;
  teamId: string | null;
  schoolLocation: SchoolLocation | null;
  preferences?: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type TeamDocument = {
  name: string;
  /** Join code shown to teammates (e.g. ALPHA7) */
  code: string;
  gradeLevel: string;
  ownerUid: string;
  memberUids: string[];
  members: FirestoreTeamMember[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ActivityReflection = {
  stars: number;
  insights: string;
};

export type ActivityPerformer = {
  memberId: string;
  name: string;
  uid?: string;
};

/** Activity capture data stored under teams/{teamId}/activityResults/{activityId} */
export type ActivityResultDocument = {
  activityId: ActivityId;
  teamId: string;
  savedByUid: string;
  predictions: Record<string, string>;
  decibelReadings: unknown[];
  vibrationReadings: unknown[];
  performanceReadings: unknown[];
  parachuteReadings: unknown[];
  tapReactionReadings: unknown[];
  tracingReadings: unknown[];
  breathingReadings: unknown[];
  fanAngleReadings: unknown[];
  bounceActual: string | null;
  /** Download URL for Action 3 revised parachute design photo (Storage, not inline bytes) */
  parachuteDesignPhotoUrl: string | null;
  /** Unix ms when the Storage object may be deleted (30 days after upload) */
  parachuteDesignPhotoExpiresAtMs: number | null;
  /** Team member who performed an individual-ranked activity. */
  performer?: ActivityPerformer | null;
  reflection: ActivityReflection | null;
  updatedAt: Timestamp;
};
