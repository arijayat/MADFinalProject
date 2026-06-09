import {
  formatTilt,
  formatVibration,
  levelLabel,
  levelStatus,
  magnitudeG,
  tiltDegrees,
  vibrationMs2,
} from '@/utils/vibration';
import {
  getSteadiestDesignIndex,
  mostStablePredictionMatches,
  steadiestDesignLabel,
  tiltPredictionMatches,
} from '@/utils/vibration-dashboard';
import {
  averagePeakVibration,
  formatPerformanceReading,
  getHardestMovementPrediction,
  hardestMovementMatches,
  movementIndexFromLabel,
} from '@/utils/performance-dashboard';

describe('vibration sensor helpers', () => {
  it('computes tilt, magnitude, dynamic vibration, and labels level status', () => {
    expect(tiltDegrees({ x: 0, y: 0, z: 1 })).toBeCloseTo(0);
    expect(tiltDegrees({ x: 1, y: 0, z: 0 })).toBeCloseTo(90);
    expect(magnitudeG({ x: 2, y: 0, z: 0 })).toBe(2);
    expect(vibrationMs2({ x: 2, y: 0, z: 0 })).toBeCloseTo(9.81);
    expect(levelStatus(2)).toBe('level');
    expect(levelStatus(5)).toBe('slight');
    expect(levelStatus(5.1)).toBe('unlevel');
    expect(levelLabel('unlevel')).toContain('Not level');
  });

  it('formats tilt and vibration readouts', () => {
    expect(formatTilt(3.456)).toBe('3.5\u00b0');
    expect(formatTilt(null)).toBe('\u2014');
    expect(formatVibration(1.234)).toBe('1.23 m/s\u00b2');
    expect(formatVibration(null)).toBe('\u2014');
  });
});

describe('vibration dashboard helpers', () => {
  const readings = [
    { label: 'Custom label', peakTiltDeg: 5, peakVibrationMs2: 0.2, startLevelDeg: 1 },
    { label: 'Custom label 2', peakTiltDeg: 2, peakVibrationMs2: 0.1, startLevelDeg: 1 },
    { label: 'Custom label 3', peakTiltDeg: 4, peakVibrationMs2: 0.4, startLevelDeg: 1 },
  ];

  it('matches tilt predictions and identifies the steadiest design', () => {
    expect(tiltPredictionMatches('3', 4.9)).toBe('Yes');
    expect(tiltPredictionMatches('3', 5.1)).toBe('No');
    expect(tiltPredictionMatches('', 5)).toBe('\u2014');
    expect(getSteadiestDesignIndex(readings)).toBe(1);
    expect(steadiestDesignLabel(readings)).toBe('Design 2');
    expect(mostStablePredictionMatches('Design 2', readings)).toBe('Yes');
    expect(mostStablePredictionMatches('Design 1', readings)).toBe('No');
  });

  it('handles empty readings', () => {
    expect(getSteadiestDesignIndex([])).toBe(-1);
    expect(steadiestDesignLabel([])).toBe('\u2014');
    expect(mostStablePredictionMatches('Design 1', [])).toBe('\u2014');
  });
});

describe('performance dashboard helpers', () => {
  const readings = [
    { label: 'Movement 1: Circle', peakVibrationMs2: 0.5, durationS: 10, hapticFeedback: false, attempt: 1 as const },
    { label: 'Movement 2: Up and down', peakVibrationMs2: 0.9, durationS: 12, hapticFeedback: false, attempt: 1 as const },
    { label: 'Movement 3: Side to side', peakVibrationMs2: 0.3, durationS: 9, hapticFeedback: true, attempt: 2 as const },
  ];

  it('formats readings and maps movement labels', () => {
    expect(formatPerformanceReading(readings[0])).toBe('0.50 m/s\u00b2 · 10s');
    expect(movementIndexFromLabel('Movement 2: Up and down')).toBe(1);
    expect(movementIndexFromLabel('Something else')).toBe(-1);
  });

  it('finds and matches the hardest movement by attempt', () => {
    expect(getHardestMovementPrediction(readings, 1)).toBe('Movement 2');
    expect(getHardestMovementPrediction(readings, 2)).toBe('Movement 3');
    expect(hardestMovementMatches('Movement 2', readings, 1)).toBe('Yes');
    expect(hardestMovementMatches('Movement 1', readings, 1)).toBe('No');
    expect(hardestMovementMatches(undefined, readings, 1)).toBe('\u2014');
  });

  it('averages peak vibration for a selected attempt', () => {
    expect(averagePeakVibration(readings, 1)).toBe('0.70 m/s\u00b2 avg');
    expect(averagePeakVibration([], 1)).toBe('\u2014');
  });
});
