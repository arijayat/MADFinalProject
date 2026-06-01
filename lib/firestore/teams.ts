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
