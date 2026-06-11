import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { isIndividualActivity, type ActivityId } from '@/constants/activities';
import { getFirebaseDb } from '@/lib/firebase';
import { computeLeaderboardScore } from '@/utils/leaderboard-score';
import type {
  ActivityReflection,
  ActivityResultDocument,
  FirestoreTeamMember,
} from '@/types/firestore';

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

export type IndividualLeaderboardRow = {
  rank: number;
  studentName: string;
  teamName: string;
  displayName: string;
  id: string;
  score: number;
  teamDocId: string;
  memberId: string;
  memberUid?: string;
};

type TeamLeaderboardMeta = {
  name: string;
  code: string;
  members: FirestoreTeamMember[];
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
  teamMeta: Map<string, TeamLeaderboardMeta>,
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

function toIndividualLeaderboardRows(
  activityId: ActivityId,
  data: ActivityResultDocument,
  teamDocId: string,
  teamMeta: Map<string, TeamLeaderboardMeta>,
): Omit<IndividualLeaderboardRow, 'rank'>[] {
  if (!isIndividualActivity(activityId)) return [];

  const meta = teamMeta.get(teamDocId);
  const teamName = meta?.name ?? 'Unknown team';
  const code = meta?.code ?? '';
  const displayId = code ? `#${code}` : '—';
  const score = computeLeaderboardScore(activityId, data);
  const performer = data.performer;

  if (!performer?.memberId || !performer.name.trim()) {
    return [];
  }

  const rosterMember = meta?.members.find((member) => member.id === performer.memberId);
  const studentName = rosterMember?.name.trim() || performer.name.trim();

  return [
    {
      studentName,
      teamName,
      displayName: `${studentName} (${teamName})`,
      id: displayId,
      score,
      teamDocId,
      memberId: performer.memberId,
      memberUid: performer.uid ?? rosterMember?.uid,
    },
  ];
}

function rankIndividualLeaderboardRows(
  rows: Omit<IndividualLeaderboardRow, 'rank'>[],
): IndividualLeaderboardRow[] {
  const scoredRows = rows.filter((row) => row.score > 0);
  scoredRows.sort(
    (a, b) =>
      b.score - a.score || a.displayName.localeCompare(b.displayName),
  );

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
  teamMeta: Map<string, TeamLeaderboardMeta>,
): Promise<LeaderboardRow[]> {
  const { team } = await fetchActivityLeaderboardBundle(activityId, teamMeta);
  return team;
}

export async function fetchActivityIndividualLeaderboard(
  activityId: ActivityId,
  teamMeta: Map<string, TeamLeaderboardMeta>,
): Promise<IndividualLeaderboardRow[]> {
  const { individual } = await fetchActivityLeaderboardBundle(activityId, teamMeta);
  return individual;
}

export async function fetchActivityLeaderboardBundle(
  activityId: ActivityId,
  teamMeta: Map<string, TeamLeaderboardMeta>,
): Promise<{
  team: LeaderboardRow[];
  individual: IndividualLeaderboardRow[];
}> {
  const results = await listAllActivityResults();
  const teamRows: Omit<LeaderboardRow, 'rank'>[] = [];
  const individualRows: Omit<IndividualLeaderboardRow, 'rank'>[] = [];

  for (const { data, teamDocId } of results) {
    if (data.activityId !== activityId) continue;
    teamRows.push(toLeaderboardRow(activityId, data, teamDocId, teamMeta));
    individualRows.push(
      ...toIndividualLeaderboardRows(activityId, data, teamDocId, teamMeta),
    );
  }

  return {
    team: rankLeaderboardRows(teamRows),
    individual: rankIndividualLeaderboardRows(individualRows),
  };
}

export async function fetchAllActivityLeaderboards(
  activityIds: ActivityId[],
  teamMeta: Map<string, TeamLeaderboardMeta>,
): Promise<Record<ActivityId, LeaderboardRow[]>> {
  const { team } = await fetchAllLeaderboardBundles(activityIds, teamMeta);
  return team;
}

export async function fetchAllActivityIndividualLeaderboards(
  activityIds: ActivityId[],
  teamMeta: Map<string, TeamLeaderboardMeta>,
): Promise<Record<ActivityId, IndividualLeaderboardRow[]>> {
  const { individual } = await fetchAllLeaderboardBundles(activityIds, teamMeta);
  return individual;
}

export async function fetchAllLeaderboardBundles(
  activityIds: ActivityId[],
  teamMeta: Map<string, TeamLeaderboardMeta>,
): Promise<{
  team: Record<ActivityId, LeaderboardRow[]>;
  individual: Record<ActivityId, IndividualLeaderboardRow[]>;
}> {
  const allowed = new Set(activityIds);
  const teamGrouped = new Map<ActivityId, Omit<LeaderboardRow, 'rank'>[]>();
  const individualGrouped = new Map<
    ActivityId,
    Omit<IndividualLeaderboardRow, 'rank'>[]
  >();

  for (const activityId of activityIds) {
    teamGrouped.set(activityId, []);
    individualGrouped.set(activityId, []);
  }

  const results = await listAllActivityResults();
  for (const { data, teamDocId } of results) {
    if (!allowed.has(data.activityId)) continue;
    teamGrouped
      .get(data.activityId)!
      .push(toLeaderboardRow(data.activityId, data, teamDocId, teamMeta));
    individualGrouped
      .get(data.activityId)!
      .push(
        ...toIndividualLeaderboardRows(
          data.activityId,
          data,
          teamDocId,
          teamMeta,
        ),
      );
  }

  const team = {} as Record<ActivityId, LeaderboardRow[]>;
  const individual = {} as Record<ActivityId, IndividualLeaderboardRow[]>;
  for (const activityId of activityIds) {
    team[activityId] = rankLeaderboardRows(teamGrouped.get(activityId) ?? []);
    individual[activityId] = rankIndividualLeaderboardRows(
      individualGrouped.get(activityId) ?? [],
    );
  }
  return { team, individual };
}
