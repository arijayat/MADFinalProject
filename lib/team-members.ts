import type { FirestoreTeamMember } from '@/types/firestore';

/** Link the signed-in Firebase user to a roster row (by uid or display name). */
export function linkAuthUserToMembers(
  members: FirestoreTeamMember[],
  uid: string,
  email: string | null | undefined,
  displayName: string | null | undefined,
): FirestoreTeamMember[] {
  const normalizedDisplay = displayName?.trim().toLowerCase();
  const emailLocal = email?.split('@')[0]?.trim().toLowerCase();
  const authEmail = email?.trim() || undefined;

  function matchesRosterName(memberName: string): boolean {
    const normalized = memberName.trim().toLowerCase();
    if (normalizedDisplay && normalized === normalizedDisplay) return true;
    if (emailLocal && normalized === emailLocal) return true;
    return false;
  }

  return members.map((member) => {
    if (member.uid === uid) {
      return authEmail ? { ...member, email: authEmail } : member;
    }
    if (!member.uid && matchesRosterName(member.name)) {
      return { ...member, uid, ...(authEmail ? { email: authEmail } : {}) };
    }
    return member;
  });
}

/** Roster rows the captain added that no account has claimed yet. */
export function getUnclaimedTeamMembers(members: FirestoreTeamMember[]): FirestoreTeamMember[] {
  return members.filter((m) => !m.uid);
}

function defaultCaptainName(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const fromDisplay = displayName?.trim();
  if (fromDisplay) return fromDisplay;

  const fromEmail = email?.split('@')[0]?.trim();
  if (fromEmail) return fromEmail;

  return 'Captain';
}

/** Ensure the team creator is linked to a roster row when registering a team. */
export function ensureCaptainOnRoster(
  members: FirestoreTeamMember[],
  uid: string,
  email: string | null | undefined,
  displayName: string | null | undefined,
): FirestoreTeamMember[] {
  const linked = linkAuthUserToMembers(members, uid, email, displayName);
  if (linked.some((member) => member.uid === uid)) {
    return linked;
  }

  const captainName = defaultCaptainName(displayName, email);
  const authEmail = email?.trim() || undefined;

  return [
    {
      id: `m-captain-${uid}`,
      name: captainName,
      uid,
      ...(authEmail ? { email: authEmail } : {}),
    },
    ...linked,
  ];
}

/** Suggest an unclaimed roster row for the signed-in user (display name or email). */
export function findSuggestedMemberId(
  members: FirestoreTeamMember[],
  displayName: string | null | undefined,
  email: string | null | undefined,
): string | null {
  const normalizedDisplay = displayName?.trim().toLowerCase();
  const emailLocal = email?.split('@')[0]?.trim().toLowerCase();

  const match = members.find((member) => {
    if (member.uid) return false;
    const normalized = member.name.trim().toLowerCase();
    if (normalizedDisplay && normalized === normalizedDisplay) return true;
    if (emailLocal && normalized === emailLocal) return true;
    return false;
  });

  return match?.id ?? null;
}

export function claimMemberSlot(
  members: FirestoreTeamMember[],
  memberId: string,
  uid: string,
  email: string | null | undefined,
): FirestoreTeamMember[] {
  const target = members.find((m) => m.id === memberId);
  if (!target) {
    throw new Error('That name is not on this team roster.');
  }
  if (target.uid && target.uid !== uid) {
    throw new Error('That name is already linked to another account.');
  }

  const authEmail = email?.trim() || undefined;

  return members.map((member) => {
    if (member.id === memberId) {
      return { ...member, uid, ...(authEmail ? { email: authEmail } : {}) };
    }
    return member;
  });
}

export function membersNeedAuthSync(
  members: FirestoreTeamMember[],
  uid: string,
  email: string | null | undefined,
  displayName: string | null | undefined,
): boolean {
  const linked = linkAuthUserToMembers(members, uid, email, displayName);
  return JSON.stringify(linked) !== JSON.stringify(members);
}
