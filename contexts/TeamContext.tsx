import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';
import {
  claimTeamRosterSlot,
  createTeam,
  getTeamById,
  getTeamByJoinCode,
  captainLeaveTeam,
  removeMemberFromTeam,
  syncTeamMemberAuthInfo,
  updateTeamDetails,
} from '@/lib/firestore/teams';
import { ensureCaptainOnRoster, linkAuthUserToMembers } from '@/lib/team-members';
import { setUserTeamId } from '@/lib/firestore/users';
import { normalizeTeamCode } from '@/lib/team-code';
import type { FirestoreTeamMember } from '@/types/firestore';

export type TeamMember = FirestoreTeamMember;

type TeamContextValue = {
  teamName: string;
  /** Display join code, e.g. #ALPHA7 */
  teamId: string;
  /** Firestore document id for the team */
  teamDocId: string | null;
  gradeLevel: string;
  members: TeamMember[];
  /** Firebase uid of the user who created the team. */
  ownerUid: string | null;
  /** True when the signed-in user created this team. */
  isTeamOwner: boolean;
  isLoadingTeam: boolean;
  setTeamName: (v: string) => void;
  setGradeLevel: (v: string) => void;
  setMembers: (m: TeamMember[]) => void;
  addMember: (name: string) => void;
  resetForNewTeam: () => void;
  /** Create team in Firestore and link to the signed-in user. */
  registerTeam: () => Promise<{ teamDocId: string; code: string }>;
  /** Join by join code and claim a roster name the captain added. */
  joinWithTeamCode: (code: string, memberId: string) => Promise<void>;
  refreshTeamFromFirestore: () => Promise<void>;
  saveTeamDetails: (name: string, gradeLevel: string) => Promise<void>;
  saveTeamMembers: (members: TeamMember[]) => Promise<void>;
  /** Leave the current team and clear local team state. Captains must pass newCaptainUid when others have joined. */
  leaveTeam: (newCaptainUid?: string) => Promise<void>;
};

const TeamContext = createContext<TeamContextValue | null>(null);

function formatDisplayCode(code: string): string {
  const normalized = normalizeTeamCode(code);
  return normalized ? `#${normalized}` : '#----';
}

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();

  const [teamDocId, setTeamDocId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [ownerUid, setOwnerUid] = useState<string | null>(null);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);

  const isTeamOwner = Boolean(user?.uid && ownerUid && user.uid === ownerUid);

  const applyTeamDocument = useCallback(
    (team: {
      id: string;
      name: string;
      code: string;
      gradeLevel: string;
      members: TeamMember[];
      ownerUid: string;
    }) => {
      setTeamDocId(team.id);
      setTeamName(team.name);
      setTeamCode(team.code);
      setGradeLevel(team.gradeLevel);
      setMembers(team.members);
      setOwnerUid(team.ownerUid);
    },
    [],
  );

  const refreshTeamFromFirestore = useCallback(async () => {
    if (!profile?.teamId) {
      setTeamDocId(null);
      setTeamName('');
      setTeamCode('');
      setGradeLevel('');
      setMembers([]);
      setOwnerUid(null);
      return;
    }

    setIsLoadingTeam(true);
    try {
      const team = await getTeamById(profile.teamId);
      if (!team) return;

      let roster = team.members ?? [];
      if (user) {
        if (team.ownerUid === user.uid) {
          roster = await syncTeamMemberAuthInfo(
            profile.teamId,
            user.uid,
            user.email,
            user.displayName,
          );
        }
        roster = linkAuthUserToMembers(
          roster,
          user.uid,
          user.email,
          user.displayName,
        );
      }

      applyTeamDocument({
        id: team.id,
        name: team.name,
        code: team.code,
        gradeLevel: team.gradeLevel,
        members: roster,
        ownerUid: team.ownerUid,
      });
    } finally {
      setIsLoadingTeam(false);
    }
  }, [profile?.teamId, user, applyTeamDocument]);

  useEffect(() => {
    if (!user) {
      setTeamDocId(null);
      setTeamName('');
      setTeamCode('');
      setGradeLevel('');
      setMembers([]);
      setOwnerUid(null);
      return;
    }
    void refreshTeamFromFirestore();
  }, [user, profile?.teamId, refreshTeamFromFirestore]);

  const addMember = useCallback((name: string) => {
    const id = `m-${Date.now()}`;
    setMembers((prev) => [...prev, { id, name }]);
  }, []);

  const resetForNewTeam = useCallback(() => {
    setTeamDocId(null);
    setTeamName('');
    setTeamCode('');
    setGradeLevel('');
    setMembers([]);
    setOwnerUid(null);
  }, []);

  const registerTeam = useCallback(async () => {
    if (!user) throw new Error('You must be signed in to register a team.');

    const linkedMembers = ensureCaptainOnRoster(
      members,
      user.uid,
      user.email,
      user.displayName,
    );

    const { teamId, code } = await createTeam({
      ownerUid: user.uid,
      name: teamName.trim() || 'My Team',
      gradeLevel,
      members: linkedMembers,
    });

    await setUserTeamId(user.uid, teamId);
    await refreshProfile();
    applyTeamDocument({
      id: teamId,
      name: teamName.trim() || 'My Team',
      code,
      gradeLevel,
      members: linkedMembers,
      ownerUid: user.uid,
    });

    return { teamDocId: teamId, code };
  }, [user, teamName, gradeLevel, members, refreshProfile, applyTeamDocument]);

  const saveTeamDetails = useCallback(
    async (name: string, gradeLevel: string) => {
      if (!teamDocId) throw new Error('No team to update.');
      if (!isTeamOwner) throw new Error('Only the team captain can edit team details.');
      const trimmedName = name.trim();
      const trimmedGrade = gradeLevel.trim();
      if (!trimmedName) throw new Error('Team name cannot be empty.');

      await updateTeamDetails(teamDocId, {
        name: trimmedName,
        gradeLevel: trimmedGrade,
      });
      setTeamName(trimmedName);
      setGradeLevel(trimmedGrade);
    },
    [teamDocId, isTeamOwner],
  );

  const saveTeamMembers = useCallback(
    async (nextMembers: TeamMember[]) => {
      if (!teamDocId) throw new Error('No team to update.');
      if (!isTeamOwner) throw new Error('Only the team captain can edit team members.');
      const normalized = nextMembers.map((member) => ({
        ...member,
        name: member.name.trim(),
      }));

      if (normalized.some((member) => !member.name)) {
        throw new Error('Every team member needs a name.');
      }

      await updateTeamDetails(teamDocId, { members: normalized });
      setMembers(normalized);
    },
    [teamDocId, isTeamOwner],
  );

  const leaveTeam = useCallback(
    async (newCaptainUid?: string) => {
      if (!user) throw new Error('You must be signed in to leave a team.');
      if (!teamDocId) throw new Error('You are not on a team.');

      if (isTeamOwner) {
        await captainLeaveTeam({
          teamId: teamDocId,
          uid: user.uid,
          newCaptainUid,
        });
      } else {
        await removeMemberFromTeam(teamDocId, user.uid);
      }

      await setUserTeamId(user.uid, null);
      await refreshProfile();
      resetForNewTeam();
    },
    [user, teamDocId, isTeamOwner, refreshProfile, resetForNewTeam],
  );

  const joinWithTeamCode = useCallback(
    async (rawCode: string, memberId: string) => {
      if (!user) throw new Error('You must be signed in to join a team.');
      if (!memberId.trim()) throw new Error('Select your name on the team roster.');

      const team = await getTeamByJoinCode(rawCode);
      if (!team) {
        throw new Error('No team found with that code. Check the code and try again.');
      }

      if (team.memberUids.includes(user.uid)) {
        await setUserTeamId(user.uid, team.id);
        await refreshProfile();
        applyTeamDocument({
          id: team.id,
          name: team.name,
          code: team.code,
          gradeLevel: team.gradeLevel,
          members: team.members ?? [],
          ownerUid: team.ownerUid,
        });
        return;
      }

      const nextMembers = await claimTeamRosterSlot({
        teamId: team.id,
        uid: user.uid,
        memberId,
        email: user.email,
      });

      await setUserTeamId(user.uid, team.id);
      await refreshProfile();
      applyTeamDocument({
        id: team.id,
        name: team.name,
        code: team.code,
        gradeLevel: team.gradeLevel,
        members: nextMembers,
        ownerUid: team.ownerUid,
      });
    },
    [user, refreshProfile, applyTeamDocument],
  );

  const value = useMemo(
    () => ({
      teamName,
      teamId: formatDisplayCode(teamCode),
      teamDocId,
      gradeLevel,
      members,
      ownerUid,
      isTeamOwner,
      isLoadingTeam,
      setTeamName,
      setGradeLevel,
      setMembers,
      addMember,
      resetForNewTeam,
      registerTeam,
      joinWithTeamCode,
      refreshTeamFromFirestore,
      saveTeamDetails,
      saveTeamMembers,
      leaveTeam,
    }),
    [
      teamName,
      teamCode,
      teamDocId,
      gradeLevel,
      members,
      ownerUid,
      isTeamOwner,
      isLoadingTeam,
      addMember,
      resetForNewTeam,
      registerTeam,
      joinWithTeamCode,
      refreshTeamFromFirestore,
      saveTeamDetails,
      saveTeamMembers,
      leaveTeam,
    ],
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
