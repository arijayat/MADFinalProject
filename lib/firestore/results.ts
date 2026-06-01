import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import type { ActivityId } from '@/constants/activities';
import { getFirebaseDb } from '@/lib/firebase';
import type { ActivityReflection, ActivityResultDocument } from '@/types/firestore';

export type ActivitySessionSnapshot = Omit<
  ActivityResultDocument,
  'activityId' | 'teamId' | 'savedByUid' | 'reflection' | 'updatedAt'
>;

export async function saveActivityResult(params: {
  teamId: string;
  activityId: ActivityId;
  savedByUid: string;
  session: ActivitySessionSnapshot;
  reflection: ActivityReflection | null;
}): Promise<void> {
  const ref = doc(
    getFirebaseDb(),
    'teams',
    params.teamId,
    'activityResults',
    params.activityId,
  );

  const payload: Omit<ActivityResultDocument, 'updatedAt'> & {
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    activityId: params.activityId,
    teamId: params.teamId,
    savedByUid: params.savedByUid,
    ...params.session,
    reflection: params.reflection,
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload, { merge: true });
}
