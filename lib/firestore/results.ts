import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
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

function toLeaderboardRow(
  activityId: ActivityId,
  data: ActivityResultDocument,
  teamDocId: string,
  teamMeta: Map<string, { name: string; code: string }>,
): Omit<LeaderboardRow, 'rank'> {
  const meta = teamMeta.get(teamDocId);
  const code = meta?.code ?? '';
  const displayId = code ? `#${code}` : '—';

  return {
    team: meta?.name ?? 'Unknown team',
    id: displayId,
    score: computeLeaderboardScore(activityId, data),
    teamDocId,
  };
}

function rankLeaderboardRows(
  rows: Omit<LeaderboardRow, 'rank'>[],
): LeaderboardRow[] {
  const scoredRows = rows.filter((row) => row.score > 0);
  scoredRows.sort((a, b) => b.score - a.score || a.team.localeCompare(b.team));

  return scoredRows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

async function listAllActivityResults(): Promise<
  { data: ActivityResultDocument; teamDocId: string }[]
> {
  const snap = await getDocs(
    collectionGroup(getFirebaseDb(), 'activityResults'),
  );

  return snap.docs.map((docSnap) => {
    const data = docSnap.data() as ActivityResultDocument;
    const teamDocId = docSnap.ref.parent.parent?.id ?? data.teamId;
    return { data, teamDocId };
  });
}

export async function fetchActivityLeaderboard(
  activityId: ActivityId,
  teamMeta: Map<string, { name: string; code: string }>,
): Promise<LeaderboardRow[]> {
  const results = await listAllActivityResults();
  const rows = results
    .filter(({ data }) => data.activityId === activityId)
    .map(({ data, teamDocId }) =>
      toLeaderboardRow(activityId, data, teamDocId, teamMeta),
    );

  return rankLeaderboardRows(rows);
}

export async function fetchAllActivityLeaderboards(
  activityIds: ActivityId[],
  teamMeta: Map<string, { name: string; code: string }>,
): Promise<Record<ActivityId, LeaderboardRow[]>> {
  const allowed = new Set(activityIds);
  const grouped = new Map<ActivityId, Omit<LeaderboardRow, 'rank'>[]>();

  for (const activityId of activityIds) {
    grouped.set(activityId, []);
  }

  const results = await listAllActivityResults();
  for (const { data, teamDocId } of results) {
    if (!allowed.has(data.activityId)) continue;
    grouped
      .get(data.activityId)!
      .push(toLeaderboardRow(data.activityId, data, teamDocId, teamMeta));
  }

  const out = {} as Record<ActivityId, LeaderboardRow[]>;
  for (const activityId of activityIds) {
    out[activityId] = rankLeaderboardRows(grouped.get(activityId) ?? []);
  }
  return out;
}
