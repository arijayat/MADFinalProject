import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import type { ActivityId } from '@/constants/activities';
import { getFirebaseDb } from '@/lib/firebase';
import { computeLeaderboardScore } from '@/utils/leaderboard-score';
import type { ActivityReflection, ActivityResultDocument } from '@/types/firestore';

export type ActivitySessionSnapshot = Omit<
  ActivityResultDocument,
  'activityId' | 'teamId' | 'savedByUid' | 'reflection' | 'updatedAt'
>;

export type LeaderboardRow = {
  rank: number;
  team: string;
  id: string;
  score: number;
  teamDocId: string;
};

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

export async function getActivityResult(
  teamId: string,
  activityId: ActivityId,
): Promise<ActivityResultDocument | null> {
  const snap = await getDoc(
    doc(getFirebaseDb(), 'teams', teamId, 'activityResults', activityId),
  );
  if (!snap.exists()) return null;
  return snap.data() as ActivityResultDocument;
}

export async function listTeamActivityResults(
  teamId: string,
): Promise<Partial<Record<ActivityId, ActivityResultDocument>>> {
  const snap = await getDocs(
    collection(getFirebaseDb(), 'teams', teamId, 'activityResults'),
  );
  const out: Partial<Record<ActivityId, ActivityResultDocument>> = {};
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as ActivityResultDocument;
    out[data.activityId] = data;
  }
  return out;
}

export async function fetchActivityLeaderboard(
  activityId: ActivityId,
  teamMeta: Map<string, { name: string; code: string }>,
): Promise<LeaderboardRow[]> {
  const snap = await getDocs(
    query(
      collectionGroup(getFirebaseDb(), 'activityResults'),
      where('activityId', '==', activityId),
    ),
  );

  const rows: Omit<LeaderboardRow, 'rank'>[] = [];

  for (const docSnap of snap.docs) {
    const data = docSnap.data() as ActivityResultDocument;
    const teamDocId = docSnap.ref.parent.parent?.id ?? data.teamId;
    const meta = teamMeta.get(teamDocId);
    const code = meta?.code ?? '';
    const displayId = code ? `#${code}` : '—';

    rows.push({
      team: meta?.name ?? 'Unknown team',
      id: displayId,
      score: computeLeaderboardScore(activityId, data),
      teamDocId,
    });
  }

  rows.sort((a, b) => b.score - a.score || a.team.localeCompare(b.team));

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}
