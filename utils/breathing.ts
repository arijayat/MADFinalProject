import type { AccelSample } from '@/utils/vibration';
import { vibrationMs2 } from '@/utils/vibration';

/** Chest rise/fall signal when phone lies on torso (screen up). */
export function chestSignal({ x, y, z }: AccelSample): number {
  return z;
}

const MIN_BREATH_INTERVAL_S = 1.2;
const PEAK_THRESHOLD = 0.018;

export type BreathingAnalysis = {
  breathCount: number;
  breathsPerMinute: number;
  durationS: number;
  peakMovementMs2: number;
};

/**
 * Estimate breaths per minute from Z-axis samples (timestamps in ms).
 */
export function analyzeBreathing(
  samples: { t: number; z: number; movementMs2: number }[],
): BreathingAnalysis {
  if (samples.length < 10) {
    return {
      breathCount: 0,
      breathsPerMinute: 0,
      durationS: 0,
      peakMovementMs2: 0,
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

  const baselineN = Math.min(20, Math.floor(samples.length * 0.15));
  let baseline = 0;
  for (let i = 0; i < baselineN; i++) baseline += samples[i].z;
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
      sum += samples[j].z - baseline;
      count++;
    }
    smoothed.push(sum / count);
  }

  let breathCount = 0;
  let lastPeakT = -Infinity;
  for (let i = 1; i < smoothed.length - 1; i++) {
    const prev = smoothed[i - 1];
    const cur = smoothed[i];
    const next = smoothed[i + 1];
    if (cur > PEAK_THRESHOLD && cur >= prev && cur >= next) {
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
  };
}

export function sampleFromAccel(
  t: number,
  sample: AccelSample,
): { t: number; z: number; movementMs2: number } {
  return {
    t,
    z: chestSignal(sample),
    movementMs2: vibrationMs2(sample),
  };
}

export function formatBreathingOutcome(analysis: BreathingAnalysis): string {
  return `${analysis.durationS}s · ${analysis.breathsPerMinute} BPM · peak ${analysis.peakMovementMs2.toFixed(2)} m/s²`;
}
