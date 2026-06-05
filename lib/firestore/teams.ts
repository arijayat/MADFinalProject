import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { getFirebaseDb } from '@/lib/firebase';
import {
  claimMemberSlot,
  getLinkedTeamMembersExcept,
  linkAuthUserToMembers,
  releaseMemberFromRoster,
} from '@/lib/team-members';

/** Written to ownerUid when the captain leaves and no members remain on the team. */
export const ABANDONED_OWNER_UID = '';
import { generateTeamCode, normalizeTeamCode } from '@/lib/team-code';
import type { FirestoreTeamMember, TeamDocument } from '@/types/firestore';

const teamsCollection = () => collection(getFirebaseDb(), 'teams');

export async function getTeamById(teamId: string): Promise<(TeamDocument & { id: string }) | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'teams', teamId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as TeamDocument) };
}

export async function getTeamByJoinCode(
  rawCode: string,
): Promise<(TeamDocument & { id: string }) | null> {
  const code = normalizeTeamCode(rawCode);
  if (!code) return null;

  const q = query(teamsCollection(), where('code', '==', code), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...(docSnap.data() as TeamDocument) };
}

export async function createTeam(params: {
  ownerUid: string;
  name: string;
  gradeLevel: string;
  members: FirestoreTeamMember[];
}): Promise<{ teamId: string; code: string }> {
  const code = generateTeamCode();
  const memberUids = [params.ownerUid];

  const payload: Omit<TeamDocument, 'createdAt' | 'updatedAt'> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    name: params.name.trim(),
    code,
    gradeLevel: params.gradeLevel.trim(),
    ownerUid: params.ownerUid,
    memberUids,
    members: params.members,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(teamsCollection(), payload);
  return { teamId: ref.id, code };
}

export async function updateTeamMembers(
  teamId: string,
  members: FirestoreTeamMember[],
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'teams', teamId), {
    members,
    updatedAt: serverTimestamp(),
  });
}

export async function updateTeamDetails(
  teamId: string,
  updates: {
    name?: string;
    gradeLevel?: string;
    members?: FirestoreTeamMember[];
  },
): Promise<void> {
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.name !== undefined) {
    payload.name = updates.name.trim();
  }
  if (updates.gradeLevel !== undefined) {
    payload.gradeLevel = updates.gradeLevel.trim();
  }
  if (updates.members !== undefined) {
    payload.members = updates.members;
  }

  await updateDoc(doc(getFirebaseDb(), 'teams', teamId), payload);
}

export async function addMemberToTeam(
  teamId: string,
  uid: string,
  members: FirestoreTeamMember[],
): Promise<void> {
  const team = await getTeamById(teamId);
  if (!team) throw new Error('Team not found.');

  const memberUids = team.memberUids.includes(uid) ? team.memberUids : [...team.memberUids, uid];

  await updateDoc(doc(getFirebaseDb(), 'teams', teamId), {
    members,
    memberUids,
    updatedAt: serverTimestamp(),
  });
}

/** Captain leaves: transfer captaincy or abandon the team when no one else has joined. */
export async function captainLeaveTeam(params: {
  teamId: string;
  uid: string;
  newCaptainUid?: string;
}): Promise<void> {
  const team = await getTeamById(params.teamId);
  if (!team) throw new Error('Team not found.');
  if (team.ownerUid !== params.uid) {
    throw new Error('Only the team captain can leave this way.');
  }

  const linkedOthers = getLinkedTeamMembersExcept(team.members ?? [], params.uid);

  if (linkedOthers.length > 0) {
    if (!params.newCaptainUid) {
      throw new Error('Choose a team member to become the new captain.');
    }
    if (!linkedOthers.some((member) => member.uid === params.newCaptainUid)) {
      throw new Error('That member cannot become captain.');
    }
    if (!team.memberUids.includes(params.newCaptainUid)) {
      throw new Error('The new captain must be an active team member.');
    }

    const memberUids = team.memberUids.filter((memberUid) => memberUid !== params.uid);
    const nextMembers = releaseMemberFromRoster(team.members ?? [], params.uid);

    await updateDoc(doc(getFirebaseDb(), 'teams', params.teamId), {
      ownerUid: params.newCaptainUid,
      members: nextMembers,
      memberUids,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const nextMembers = releaseMemberFromRoster(team.members ?? [], params.uid);

  await updateDoc(doc(getFirebaseDb(), 'teams', params.teamId), {
    ownerUid: ABANDONED_OWNER_UID,
    members: nextMembers,
    memberUids: [],
    updatedAt: serverTimestamp(),
  });
}

/** Remove a member from the team and free their roster slot for rejoining. */
export async function removeMemberFromTeam(teamId: string, uid: string): Promise<void> {
  const team = await getTeamById(teamId);
  if (!team) throw new Error('Team not found.');

  const memberUids = team.memberUids.filter((memberUid) => memberUid !== uid);
  const nextMembers = releaseMemberFromRoster(team.members ?? [], uid);

  await updateDoc(doc(getFirebaseDb(), 'teams', teamId), {
    members: nextMembers,
    memberUids,
    updatedAt: serverTimestamp(),
  });
}

/** Join by code and link the signed-in user to a captain-added roster name. */
export async function claimTeamRosterSlot(params: {
  teamId: string;
  uid: string;
  memberId: string;
  email: string | null | undefined;
}): Promise<FirestoreTeamMember[]> {
  const team = await getTeamById(params.teamId);
  if (!team) throw new Error('Team not found.');

  const nextMembers = claimMemberSlot(
    team.members ?? [],
    params.memberId,
    params.uid,
    params.email,
  );

  await addMemberToTeam(params.teamId, params.uid, nextMembers);
  return nextMembers;
}

/** Persist auth email/uid on the roster when the signed-in user opens their team. */
export async function syncTeamMemberAuthInfo(
  teamId: string,
  uid: string,
  email: string | null | undefined,
  displayName: string | null | undefined,
): Promise<FirestoreTeamMember[]> {
  const team = await getTeamById(teamId);
  if (!team) return [];

  const linked = linkAuthUserToMembers(team.members ?? [], uid, email, displayName);
  const changed = JSON.stringify(linked) !== JSON.stringify(team.members ?? []);

  if (changed) {
    await updateTeamMembers(teamId, linked);
  }

  return linked;
}

export async function listTeamsForLeaderboard(): Promise<
  Map<string, { name: string; code: string }>
> {
  const snap = await getDocs(teamsCollection());
  const map = new Map<string, { name: string; code: string }>();
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as TeamDocument;
    map.set(docSnap.id, { name: data.name, code: data.code });
  }
  return map;
}
