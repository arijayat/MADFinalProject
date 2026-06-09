import { computeLeaderboardScore } from '@/utils/leaderboard-score';

describe('computeLeaderboardScore', () => {
  it('combines reflection stars and activity-specific reading counts', () => {
    expect(
      computeLeaderboardScore('parachute-drop', {
        reflection: { stars: 3, notes: 'ok', submittedAt: 1 },
        parachuteReadings: [{}, {}, {}],
      }),
    ).toBe(51);

    expect(
      computeLeaderboardScore('reaction-time', {
        reflection: { stars: 1, notes: 'ok', submittedAt: 1 },
        tapReactionReadings: [{}, {}, {}],
        tracingReadings: [{}, {}],
      }),
    ).toBe(25);
  });

  it('caps reflection, reading, and final scores', () => {
    expect(
      computeLeaderboardScore('decibel-detector', {
        reflection: { stars: 10, notes: 'ok', submittedAt: 1 },
        decibelReadings: Array.from({ length: 100 }, () => ({})),
      }),
    ).toBe(100);
  });

  it('scores missing reflection and readings as zero', () => {
    expect(computeLeaderboardScore('breathing-pattern', {})).toBe(0);
  });
});
