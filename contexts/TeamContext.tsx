import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { addMemberToTeam, createTeam, getTeamById, getTeamByJoinCode } from '@/lib/firestore/teams';
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
  isLoadingTeam: boolean;
  setTeamName: (v: string) => void;
  setGradeLevel: (v: string) => void;
  setMembers: (m: TeamMember[]) => void;
  addMember: (name: string) => void;
  resetForNewTeam: () => void;
  /** Create team in Firestore and link to the signed-in user. */
  registerTeam: () => Promise<{ teamDocId: string; code: string }>;
  /** Join by join code and sync local state. */
  joinWithTeamCode: (code: string) => Promise<void>;
  refreshTeamFromFirestore: () => Promise<void>;
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
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);

  const applyTeamDocument = useCallback(
    (team: { id: string; name: string; code: string; gradeLevel: string; members: TeamMember[] }) => {
      setTeamDocId(team.id);
      setTeamName(team.name);
      setTeamCode(team.code);
      setGradeLevel(team.gradeLevel);
      setMembers(team.members);
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
      return;
    }

    setIsLoadingTeam(true);
    try {
      const team = await getTeamById(profile.teamId);
      if (team) {
        applyTeamDocument(team);
      }
    } finally {
      setIsLoadingTeam(false);
    }
  }, [profile?.teamId, applyTeamDocument]);

  useEffect(() => {
    if (!user) {
      setTeamDocId(null);
      setTeamName('');
      setTeamCode('');
      setGradeLevel('');
      setMembers([]);
      return;
    }
    void refreshTeamFromFirestore();
  }, [user, profile?.teamId, refreshTeamFromFirestore]);

  const addMember = useCallback((name: string) => {
    const id = `m-${Date.now()}`;
    setMembers((prev) => [
      ...prev,
      { id, name, email: `${name.toLowerCase().replace(/\s+/g, '')}@mail.edu` },
    ]);
  }, []);

  const resetForNewTeam = useCallback(() => {
    setTeamDocId(null);
    setTeamName('');
    setTeamCode('');
    setGradeLevel('');
    setMembers([]);
  }, []);

  const registerTeam = useCallback(async () => {
    if (!user) throw new Error('You must be signed in to register a team.');

    const { teamId, code } = await createTeam({
      ownerUid: user.uid,
      name: teamName.trim() || 'My Team',
      gradeLevel,
      members,
    });

    await setUserTeamId(user.uid, teamId);
    await refreshProfile();
    applyTeamDocument({
      id: teamId,
      name: teamName.trim() || 'My Team',
      code,
      gradeLevel,
      members,
    });

    return { teamDocId: teamId, code };
  }, [user, teamName, gradeLevel, members, refreshProfile, applyTeamDocument]);

  const joinWithTeamCode = useCallback(
    async (rawCode: string) => {
      if (!user) throw new Error('You must be signed in to join a team.');

      const team = await getTeamByJoinCode(rawCode);
      if (!team) {
        throw new Error('No team found with that code. Check the code and try again.');
      }

      const nextMembers = team.members ?? [];
      await addMemberToTeam(team.id, user.uid, nextMembers);
      await setUserTeamId(user.uid, team.id);
      await refreshProfile();
      applyTeamDocument(team);
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
      isLoadingTeam,
      setTeamName,
      setGradeLevel,
      setMembers,
      addMember,
      resetForNewTeam,
      registerTeam,
      joinWithTeamCode,
      refreshTeamFromFirestore,
    }),
    [
      teamName,
      teamCode,
      teamDocId,
      gradeLevel,
      members,
      isLoadingTeam,
      addMember,
      resetForNewTeam,
      registerTeam,
      joinWithTeamCode,
      refreshTeamFromFirestore,
    ],
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
