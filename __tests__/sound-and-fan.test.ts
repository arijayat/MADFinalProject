import {
  QUIET_ROOM_REFERENCE_DB,
  getHearingRisk,
  predictionMatchesActual,
  volumeRelation,
} from '@/utils/decibel-hearing-risk';
import { formatDisplayDb, meteringToDisplayDb } from '@/utils/decibels';
import {
  bendPredictionMatches,
  degreesToRadians,
  estimateForceN,
  formatForceN,
  getStiffnessK,
} from '@/utils/fan-force';

describe('decibel helpers', () => {
  it('maps recorder metering into clamped display dB values', () => {
    expect(meteringToDisplayDb(-30)).toBe(60);
    expect(meteringToDisplayDb(-500)).toBe(20);
    expect(meteringToDisplayDb(80)).toBe(130);
  });

  it('formats display dB values and missing values', () => {
    expect(formatDisplayDb(72)).toBe('72 dB');
    expect(formatDisplayDb(null)).toBe('\u2014');
    expect(formatDisplayDb(Number.NaN)).toBe('\u2014');
  });

  it('classifies hearing risk and relative loudness', () => {
    expect(getHearingRisk(-1)).toBe('\u2014');
    expect(getHearingRisk(25)).toBe('No risk');
    expect(getHearingRisk(88)).toBe('Hearing damage possible after long exposure');
    expect(getHearingRisk(140)).toBe('Instant, permanent hearing damage');

    expect(volumeRelation(QUIET_ROOM_REFERENCE_DB + 3, QUIET_ROOM_REFERENCE_DB)).toBe('About the same');
    expect(volumeRelation(60, QUIET_ROOM_REFERENCE_DB)).toBe('Louder');
    expect(volumeRelation(35, QUIET_ROOM_REFERENCE_DB)).toBe('Softer');
  });

  it('checks sound predictions against measured values', () => {
    expect(predictionMatchesActual('Louder', 60, 45)).toBe('Yes');
    expect(predictionMatchesActual('Softer', 60, 45)).toBe('No');
    expect(predictionMatchesActual(undefined, 60, 45)).toBe('\u2014');
  });
});

describe('fan force helpers', () => {
  it('looks up stiffness, converts degrees, and estimates force', () => {
    expect(getStiffnessK('Standard card stock')).toBe(0.2);
    expect(getStiffnessK('Unknown')).toBeNull();
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
    expect(estimateForceN(0.2, 30)).toBeCloseTo(0.104719755);
  });

  it('matches bend predictions within tolerance and formats small forces', () => {
    expect(bendPredictionMatches('25', 30)).toBe('Yes');
    expect(bendPredictionMatches('24.9', 30)).toBe('No');
    expect(bendPredictionMatches('not a number', 30)).toBe('\u2014');
    expect(formatForceN(0.004321)).toBe('0.0043 N');
    expect(formatForceN(0.54321)).toBe('0.543 N');
    expect(formatForceN(2.345)).toBe('2.35 N');
  });
});
