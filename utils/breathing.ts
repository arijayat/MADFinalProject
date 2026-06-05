import type { AccelSample } from '@/utils/vibration';
import { vibrationMs2 } from '@/utils/vibration';

export type GyroSample = { x: number; y: number; z: number };

export type BreathingMotionSample = {
  t: number;
  chestMovement: number;
  movementMs2: number;
  rotationRateRadS: number;
};

/** Chest rise/fall signal when phone lies on torso (screen up). */
export function chestSignal({ x, y, z }: AccelSample): number {
  return z + (x + y) * 0.12;
}

const MIN_BREATH_INTERVAL_S = 1.2;
const MIN_PEAK_THRESHOLD = 0.015;

export type BreathingAnalysis = {
  breathCount: number;
  breathsPerMinute: number;
  durationS: number;
  peakMovementMs2: number;
  movementRangeG: number;
  peakRotationRadS: number;
  averageRotationRadS: number;
  motionQuality: 'low' | 'steady' | 'active';
};

/**
 * Estimate breaths per minute from chest movement samples (timestamps in ms).
 */
export function analyzeBreathing(
  samples: BreathingMotionSample[],
): BreathingAnalysis {
  if (samples.length < 10) {
    return {
      breathCount: 0,
      breathsPerMinute: 0,
      durationS: 0,
      peakMovementMs2: 0,
      movementRangeG: 0,
      peakRotationRadS: 0,
      averageRotationRadS: 0,
      motionQuality: 'low',
    };
  }

  const durationS = Math.max(
    1,
    (samples[samples.length - 1].t - samples[0].t) / 1000,
  );
  const peakMovementMs2 = samples.reduce(
    (max, s) => Math.max(max, s.movementMs2),
    0,
  );
  const peakRotationRadS = samples.reduce(
    (max, s) => Math.max(max, s.rotationRateRadS),
    0,
  );
  const averageRotationRadS =
    samples.reduce((sum, s) => sum + s.rotationRateRadS, 0) / samples.length;

  const baselineN = Math.min(20, Math.floor(samples.length * 0.15));
  let baseline = 0;
  for (let i = 0; i < baselineN; i++) baseline += samples[i].chestMovement;
  baseline /= baselineN || 1;

  const smoothed: number[] = [];
  const window = 5;
  for (let i = 0; i < samples.length; i++) {
    let sum = 0;
    let count = 0;
    for (
      let j = Math.max(0, i - window);
      j <= Math.min(samples.length - 1, i + window);
      j++
    ) {
      sum += samples[j].chestMovement - baseline;
      count++;
    }
    smoothed.push(sum / count);
  }

  const movementRangeG = Math.max(...smoothed) - Math.min(...smoothed);
  const peakThreshold = Math.max(MIN_PEAK_THRESHOLD, movementRangeG * 0.28);
  let breathCount = 0;
  let lastPeakT = -Infinity;
  for (let i = 1; i < smoothed.length - 1; i++) {
    const prev = smoothed[i - 1];
    const cur = smoothed[i];
    const next = smoothed[i + 1];
    if (cur > peakThreshold && cur >= prev && cur >= next) {
      const t = samples[i].t / 1000;
      if (t - lastPeakT >= MIN_BREATH_INTERVAL_S) {
        breathCount++;
        lastPeakT = t;
      }
    }
  }

  const breathsPerMinute =
    durationS > 0 ? Math.round((breathCount / durationS) * 60) : 0;

  return {
    breathCount,
    breathsPerMinute,
    durationS: Math.round(durationS),
    peakMovementMs2,
    movementRangeG,
    peakRotationRadS,
    averageRotationRadS,
    motionQuality: getMotionQuality(movementRangeG, averageRotationRadS),
  };
}

function getMotionQuality(
  movementRangeG: number,
  averageRotationRadS: number,
): BreathingAnalysis['motionQuality'] {
  if (movementRangeG < 0.025) return 'low';
  if (averageRotationRadS > 0.75) return 'active';
  return 'steady';
}

export function sampleFromAccel(
  t: number,
  sample: AccelSample,
): BreathingMotionSample {
  return {
    t,
    chestMovement: chestSignal(sample),
    movementMs2: vibrationMs2(sample),
    rotationRateRadS: 0,
  };
}

export function sampleFromMotion(
  t: number,
  accel: AccelSample,
  gyro: GyroSample | null,
): BreathingMotionSample {
  return {
    t,
    chestMovement: chestSignal(accel),
    movementMs2: vibrationMs2(accel),
    rotationRateRadS: gyro
      ? Math.sqrt(gyro.x * gyro.x + gyro.y * gyro.y + gyro.z * gyro.z)
      : 0,
  };
}

export function formatBreathingOutcome(
  analysis: Pick<
    BreathingAnalysis,
    'durationS' | 'breathsPerMinute' | 'peakMovementMs2'
  > &
    Partial<Pick<BreathingAnalysis, 'movementRangeG'>>,
): string {
  const movement =
    analysis.movementRangeG != null
      ? ` · movement ${analysis.movementRangeG.toFixed(3)} g`
      : ` · peak ${analysis.peakMovementMs2.toFixed(2)} m/s²`;
  return `${analysis.durationS}s · ${analysis.breathsPerMinute} breaths/min${movement}`;
}
