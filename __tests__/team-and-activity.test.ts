import { getActivity, HUB_ACTIVITY_ORDER } from '@/constants/activities';
import {
  isActivityId,
  sessionFromActivityResult,
  toActivitySessionSnapshot,
} from '@/lib/activity-snapshot';
import { generateTeamCode, normalizeTeamCode } from '@/lib/team-code';
import { hasBlockedTeamNameWords, validateTeamName } from '@/utils/team-name-filter';

describe('team code helpers', () => {
  it('normalizes join codes for forgiving input', () => {
    expect(normalizeTeamCode(' ab-c 12 ')).toBe('ABC12');
  });

  it('generates codes using the expected length and character set', () => {
    const code = generateTeamCode(20);

    expect(code).toHaveLength(20);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    expect(code).not.toMatch(/[IO10]/);
  });
});

describe('team name validation', () => {
  it('trims valid names', () => {
    expect(validateTeamName('  Newton Crew  ')).toBe('Newton Crew');
  });

  it('rejects empty and blocked names, including simple leet substitutions', () => {
    expect(() => validateTeamName('   ')).toThrow('Team name cannot be empty.');
    expect(hasBlockedTeamNameWords('sh1t squad')).toBe(true);
    expect(() => validateTeamName('sh1t squad')).toThrow('Choose a different team name.');
  });

  it('allows normal classroom team names', () => {
    expect(hasBlockedTeamNameWords('Science Squad 42')).toBe(false);
  });
});

describe('activity registry and snapshots', () => {
  it('contains every hub activity and resolves valid ids', () => {
    expect(HUB_ACTIVITY_ORDER).toHaveLength(7);
    for (const id of HUB_ACTIVITY_ORDER) {
      expect(isActivityId(id)).toBe(true);
      expect(getActivity(id)?.id).toBe(id);
    }
    expect(isActivityId('unknown')).toBe(false);
    expect(getActivity('unknown')).toBeUndefined();
  });

  it('serializes and hydrates activity session data with empty defaults', () => {
    const snapshot = toActivitySessionSnapshot({
      predictions: { action1_pred: '1.2' },
      decibelReadings: [{ label: 'Action 1', peakDb: 70 }],
      vibrationReadings: [],
      performanceReadings: [],
      parachuteReadings: [],
      tapReactionReadings: [],
      tracingReadings: [],
      breathingReadings: [],
      fanAngleReadings: [],
      bounceActual: 'No bounce',
      parachuteDesignPhotoUrl: 'https://example.test/photo.jpg',
      parachuteDesignPhotoExpiresAtMs: 123,
    });

    expect(snapshot.predictions.action1_pred).toBe('1.2');
    expect(snapshot.decibelReadings).toHaveLength(1);
    expect(snapshot.bounceActual).toBe('No bounce');

    expect(sessionFromActivityResult({ id: 'x', activityId: 'decibel-detector' })).toMatchObject({
      predictions: {},
      decibelReadings: [],
      bounceActual: null,
      parachuteDesignPhotoUrl: null,
      parachuteDesignPhotoExpiresAtMs: null,
    });
  });
});
