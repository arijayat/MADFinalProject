import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type TeamMember = { id: string; name: string; email?: string };

type TeamContextValue = {
  teamName: string;
  teamId: string;
  gradeLevel: string;
  members: TeamMember[];
  setTeamName: (v: string) => void;
  setTeamId: (v: string) => void;
  setGradeLevel: (v: string) => void;
  setMembers: (m: TeamMember[]) => void;
  addMember: (name: string) => void;
  /** Wireframe: apply a join code and sync team id / name (no backend). */
  joinWithTeamCode: (code: string) => void;
  /** Reset defaults before starting the “create new team” flow. */
  resetForNewTeam: () => void;
};

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teamName, setTeamName] = useState('TEAM A');
  const [teamId, setTeamId] = useState('#1234');
  const [gradeLevel, setGradeLevel] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);

  const addMember = useCallback((name: string) => {
    const id = `m-${Date.now()}`;
    setMembers((prev) => [...prev, { id, name, email: `${name.toLowerCase().replace(/\s+/g, '')}@mail.edu` }]);
  }, []);

  const joinWithTeamCode = useCallback((code: string) => {
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const token = normalized || 'DEMO';
    setTeamId(`#${token}`);
    setTeamName(`TEAM ${token}`);
    setGradeLevel('');
    setMembers([]);
  }, []);

  const resetForNewTeam = useCallback(() => {
    setTeamName('TEAM A');
    setTeamId('#1234');
    setGradeLevel('');
    setMembers([]);
  }, []);

  const value = useMemo(
    () => ({
      teamName,
      teamId,
      gradeLevel,
      members,
      setTeamName,
      setTeamId,
      setGradeLevel,
      setMembers,
      addMember,
      joinWithTeamCode,
      resetForNewTeam,
    }),
    [teamName, teamId, gradeLevel, members, addMember, joinWithTeamCode, resetForNewTeam]
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
