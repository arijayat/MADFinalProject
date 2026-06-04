import type { Timestamp } from 'firebase/firestore';

import type { ActivityId } from '@/constants/activities';

export type FirestoreTeamMember = {
  id: string;
  name: string;
  /** Set when this member has signed in and joined the team */
  uid?: string;
  email?: string;
};

export type UserProfile = {
  email: string;
  displayName: string | null;
  photoURL: string | null;
  teamId: string | null;
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
  reflection: ActivityReflection | null;
  updatedAt: Timestamp;
};
