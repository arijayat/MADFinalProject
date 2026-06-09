import {
  analyzeBreathing,
  chestSignal,
  formatBreathingOutcome,
  sampleFromAccel,
  sampleFromMotion,
} from '@/utils/breathing';
import {
  breathingRatePredictionMatches,
  formatRecordingDetail,
  higherAfterExerciseActual,
  higherAfterExerciseMatches,
} from '@/utils/breathing-dashboard';

function breathingWaveSamples() {
  return Array.from({ length: 121 }, (_, i) => {
    const t = i * 100;
    const chestMovement = Math.sin((2 * Math.PI * t) / 2000) * 0.05;
    return {
      t,
      chestMovement,
      movementMs2: Math.abs(chestMovement) * 9.81,
      rotationRateRadS: 0.1,
    };
  });
}

describe('breathing analysis', () => {
  it('returns a low-quality empty analysis for too few samples', () => {
    expect(analyzeBreathing([])).toMatchObject({
      breathCount: 0,
      breathsPerMinute: 0,
      durationS: 0,
      motionQuality: 'low',
    });
  });

  it('estimates breaths per minute from chest motion peaks', () => {
    const result = analyzeBreathing(breathingWaveSamples());

    expect(result.durationS).toBe(12);
    expect(result.breathCount).toBeGreaterThanOrEqual(5);
    expect(result.breathsPerMinute).toBeGreaterThanOrEqual(25);
    expect(result.motionQuality).toBe('steady');
    expect(result.movementRangeG).toBeGreaterThan(0.05);
  });

  it('derives samples from accelerometer and gyro readings', () => {
    expect(chestSignal({ x: 1, y: 1, z: 0.5 })).toBeCloseTo(0.74);
    expect(sampleFromAccel(100, { x: 0, y: 0, z: 1 })).toMatchObject({
      t: 100,
      chestMovement: 1,
      movementMs2: 0,
      rotationRateRadS: 0,
    });
    expect(sampleFromMotion(100, { x: 0, y: 0, z: 2 }, { x: 1, y: 2, z: 2 }).rotationRateRadS).toBe(3);
  });

  it('formats breathing outcomes', () => {
    expect(formatBreathingOutcome({ durationS: 30, breathsPerMinute: 16, peakMovementMs2: 0.4 })).toBe('30s · 16 breaths/min · peak 0.40 m/s\u00b2');
    expect(formatBreathingOutcome({ durationS: 30, breathsPerMinute: 16, peakMovementMs2: 0.4, movementRangeG: 0.0312 })).toBe('30s · 16 breaths/min · movement 0.031 g');
  });
});

describe('breathing dashboard helpers', () => {
  const readings = [
    { label: 'At rest', breathCount: 8, breathsPerMinute: 16, durationS: 30, peakMovementMs2: 0.3, movementRangeG: 0.02, peakRotationRadS: 0.1 },
    { label: 'After Exercise 1', breathCount: 14, breathsPerMinute: 28, durationS: 30, peakMovementMs2: 0.5 },
  ];

  it('matches breathing rate predictions within tolerance', () => {
    expect(breathingRatePredictionMatches('20', 24)).toBe('Yes');
    expect(breathingRatePredictionMatches('20', 25)).toBe('No');
    expect(breathingRatePredictionMatches(undefined, 20)).toBe('\u2014');
  });

  it('formats recording detail with optional motion values', () => {
    expect(formatRecordingDetail(readings[0])).toBe('30s · peak 0.30 m/s\u00b2 · chest range 0.020 g · gyro 0.10 rad/s');
    expect(formatRecordingDetail(readings[1])).toBe('30s · peak 0.50 m/s\u00b2');
  });

  it('compares rest breathing to after-exercise readings', () => {
    expect(higherAfterExerciseActual(readings)).toBe('Yes — rate increased');
    expect(higherAfterExerciseMatches('Yes', readings)).toBe('Yes');
    expect(higherAfterExerciseMatches('No', readings)).toBe('No');
    expect(higherAfterExerciseMatches('Yes', [readings[0]])).toBe('\u2014');
  });
});
