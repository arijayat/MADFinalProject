import { computeFallPhysics } from '@/utils/parachute-physics';
import { computeLeaderboardScore } from '@/utils/leaderboard-score';
import type { LeaderboardScoreInput } from '@/utils/leaderboard-score';

/** Shared reflection helper — stars drive up to 75 pts of the leaderboard score. */
function reflection(stars: number, insights: string) {
  return { stars, insights };
}

describe('practical activity scoring from classroom results', () => {
  it('scores a Decibel Detector session after measuring quiet room, talking, and stamping', () => {
    const result: LeaderboardScoreInput = {
      reflection: reflection(4, 'Book drop was loudest; stamping surprised us'),
      decibelReadings: [
        { label: 'Quiet room', peakDb: 45 },
        { label: 'Talking', peakDb: 62 },
        { label: 'Stamping feet', peakDb: 81 },
      ],
    };

    // 4 stars × 15 = 60 reflection pts + 3 readings × 2 = 6 capture pts
    expect(computeLeaderboardScore('decibel-detector', result)).toBe(66);
  });

  it('scores a Parachute Drop after three timed drops from a 1.2 m table', () => {
    const predictions = { dropHeight: '1.2', mass: '200' };
    const parachuteReadings = [
      {
        label: 'Action 1: No parachute (baseline)',
        fallTimeS: 0.45,
        contactTimeS: 0.08,
        reboundTimeS: null,
        observedBounce: 'No bounce' as const,
        video: null,
      },
      {
        label: 'Action 2: Plastic canopy, four corners tied to toy',
        fallTimeS: 0.82,
        contactTimeS: 0.12,
        reboundTimeS: null,
        observedBounce: 'No bounce' as const,
        video: null,
      },
      {
        label: 'Action 3: Your best parachute design',
        fallTimeS: 1.15,
        contactTimeS: 0.18,
        reboundTimeS: 0.22,
        observedBounce: 'Bounce' as const,
        video: null,
      },
    ];

    const result: LeaderboardScoreInput = {
      reflection: reflection(5, 'Our plastic canopy slowed the toy clearly'),
      parachuteReadings,
    };

    // 5 stars × 15 = 75 + 3 readings × 2 = 6
    expect(computeLeaderboardScore('parachute-drop', result)).toBe(81);

    // Same session numbers feed the physics worksheet (baseline drop, 200 g toy)
    const baselinePhysics = computeFallPhysics(
      Number(predictions.dropHeight),
      parachuteReadings[0].fallTimeS,
      Number(predictions.mass),
    );
    expect(baselinePhysics?.finalVelocityMs).toBeCloseTo(2.67, 1);
    expect(baselinePhysics?.dragForceN).toBeCloseTo(0.78, 1);
  });

  it('scores a Hand Fan Challenge after measuring bend angles at 15, 30, and 45 cm', () => {
    // Team predicted ~30° max bend on thin printer paper at 30 cm
    const result: LeaderboardScoreInput = {
      reflection: reflection(3, 'Paper bent most at 15 cm'),
      fanAngleReadings: [
        { label: '15 cm from fan', angleDegrees: 28, video: null },
        { label: '30 cm from fan', angleDegrees: 18, video: null },
        { label: '45 cm from fan', angleDegrees: 12, video: null },
      ],
    };

    // 3 stars × 15 = 45 + 3 readings × 2 = 6
    expect(computeLeaderboardScore('hand-fan-challenge', result)).toBe(51);
  });

  it('scores Vibration Analysis after shaking three earthquake-resistant designs', () => {
    const result: LeaderboardScoreInput = {
      reflection: reflection(4, 'Design 3 with six pillars stayed steadiest'),
      vibrationReadings: [
        {
          label: 'Design 1: 4 accordion folds + 4 pillars',
          peakTiltDeg: 5.2,
          peakVibrationMs2: 0.35,
          startLevelDeg: 0.8,
        },
        {
          label: 'Design 2: 10 accordion folds + 4 pillars',
          peakTiltDeg: 2.8,
          peakVibrationMs2: 0.18,
          startLevelDeg: 0.6,
        },
        {
          label: 'Design 3: Your best design (e.g. 3 folds + 6 pillars)',
          peakTiltDeg: 1.9,
          peakVibrationMs2: 0.12,
          startLevelDeg: 0.5,
        },
      ],
    };

    expect(computeLeaderboardScore('vibration-analysis', result)).toBe(66);
  });

  it('scores Human Performance Lab after three guided arm movements', () => {
    const result: LeaderboardScoreInput = {
      reflection: reflection(3, 'Circle motion was smoothest on attempt 1'),
      performanceReadings: [
        {
          label: 'Movement 1: Circle / figure-8',
          peakVibrationMs2: 0.45,
          durationS: 12,
          hapticFeedback: false,
          attempt: 1,
        },
        {
          label: 'Movement 2: Up and down',
          peakVibrationMs2: 0.88,
          durationS: 10,
          hapticFeedback: false,
          attempt: 1,
        },
        {
          label: 'Movement 3: Side to side',
          peakVibrationMs2: 0.32,
          durationS: 11,
          hapticFeedback: true,
          attempt: 2,
        },
      ],
    };

    expect(computeLeaderboardScore('surface-smoothness', result)).toBe(51);
  });

  it('scores Reaction Board Challenge after tap trials and tracing attempts', () => {
    const result: LeaderboardScoreInput = {
      reflection: reflection(4, 'Right hand was faster; tracing improved on attempt 3'),
      tapReactionReadings: [
        { hand: 'dominant', attempt: 1, reactionTimeMs: 312, falseStart: false },
        { hand: 'dominant', attempt: 2, reactionTimeMs: 287, falseStart: false },
        { hand: 'dominant', attempt: 3, reactionTimeMs: 305, falseStart: false },
      ],
      tracingReadings: [
        { attempt: 1, accuracyPct: 71, avgDelayMs: 210 },
        { attempt: 2, accuracyPct: 78, avgDelayMs: 165 },
        { attempt: 3, accuracyPct: 84, avgDelayMs: 142 },
      ],
    };

    // 4 stars × 15 = 60 + (3 tap + 3 trace) × 2 = 12
    expect(computeLeaderboardScore('reaction-time', result)).toBe(72);
  });

  it('scores Chest Breathing Motion after rest and two post-exercise recordings', () => {
    const result: LeaderboardScoreInput = {
      reflection: reflection(5, 'Breathing rate rose clearly after star jumps'),
      breathingReadings: [
        {
          label: 'Breathing at rest',
          breathCount: 8,
          breathsPerMinute: 16,
          durationS: 30,
          peakMovementMs2: 0.28,
          movementRangeG: 0.022,
        },
        {
          label: 'After Exercise 1',
          breathCount: 13,
          breathsPerMinute: 26,
          durationS: 30,
          peakMovementMs2: 0.48,
        },
        {
          label: 'After Exercise 2',
          breathCount: 16,
          breathsPerMinute: 32,
          durationS: 30,
          peakMovementMs2: 0.62,
        },
      ],
    };

    // 5 stars × 15 = 75 + 3 readings × 2 = 6
    expect(computeLeaderboardScore('breathing-pattern', result)).toBe(81);
  });

  it('gives a low score when a team submits reflection but no sensor readings', () => {
    const result: LeaderboardScoreInput = {
      reflection: reflection(2, 'We ran out of time before capturing data'),
      decibelReadings: [],
    };

    // 2 stars × 15 = 30 + 0 readings
    expect(computeLeaderboardScore('decibel-detector', result)).toBe(30);
  });
});
