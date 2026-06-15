import type { Href } from 'expo-router';

import type { ActivityConfig } from '@/constants/activities';
import type { ActivitySession } from '@/contexts/ActivitySessionContext';

export type ActivityStepStatus =
  | 'locked'
  | 'available'
  | 'active'
  | 'complete'
  | 'needs-upload'
  | 'error';

export type ActivityStep = {
  id: string;
  title: string;
  shortTitle: string;
  route: Href;
  isComplete: boolean;
  status: ActivityStepStatus;
  lockedReason?: string;
};

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function isPredictionComplete(
  cfg: ActivityConfig,
  session: ActivitySession,
): boolean {
  return cfg.predictionFields.every((field) =>
    hasValue(session.predictions[field.key]),
  );
}

function captureStepRows(cfg: ActivityConfig, session: ActivitySession) {
  if (cfg.id === 'parachute-drop') {
    return (cfg.parachuteDropActions ?? ['Drop']).map((title, index) => ({
      id: `capture-${index}`,
      title,
      shortTitle: `Drop ${index + 1}`,
      isComplete: Boolean(session.parachuteReadings[index]?.video?.url),
    }));
  }

  if (cfg.id === 'hand-fan-challenge') {
    return (cfg.fanChallengeActions ?? ['Trial']).map((title, index) => ({
      id: `capture-${index}`,
      title,
      shortTitle: `${index + 1}`,
      isComplete: Boolean(session.fanAngleReadings[index]?.video?.url),
    }));
  }

  if (cfg.id === 'decibel-detector') {
    return (cfg.decibelActions ?? ['Measurement']).map((title, index) => ({
      id: `capture-${index}`,
      title,
      shortTitle: `Sound ${index + 1}`,
      isComplete: session.decibelReadings.length > index,
    }));
  }

  if (cfg.id === 'vibration-analysis') {
    return (cfg.vibrationDesignActions ?? ['Design']).map((title, index) => ({
      id: `capture-${index}`,
      title,
      shortTitle: `Design ${index + 1}`,
      isComplete: session.vibrationReadings.length > index,
    }));
  }

  if (cfg.id === 'surface-smoothness') {
    const movements = cfg.movementActions ?? ['Movement'];
    return [1, 2].flatMap((attempt) =>
      movements.map((movement, movementIndex) => {
        const index = (attempt - 1) * movements.length + movementIndex;
        return {
          id: `capture-${index}`,
          title: `Attempt ${attempt}: ${movement}`,
          shortTitle: `A${attempt}.${movementIndex + 1}`,
          isComplete: session.performanceReadings.length > index,
        };
      }),
    );
  }

  if (cfg.id === 'reaction-time') {
    const tapAttempts = cfg.reactionTapAttempts ?? 3;
    const traceAttempts = cfg.reactionTraceAttempts ?? 3;
    return [
      {
        id: 'capture-tap-dominant',
        title: 'Phase 1: dominant hand taps',
        shortTitle: 'P1',
        isComplete:
          session.tapReactionReadings.filter((r) => r.hand === 'dominant')
            .length >= tapAttempts,
      },
      {
        id: 'capture-tap-non-dominant',
        title: 'Phase 2: non-dominant hand taps',
        shortTitle: 'P2',
        isComplete:
          session.tapReactionReadings.filter((r) => r.hand === 'non_dominant')
            .length >= tapAttempts,
      },
      {
        id: 'capture-tracing',
        title: 'Phase 3: tracing challenge',
        shortTitle: 'P3',
        isComplete: session.tracingReadings.length >= traceAttempts,
      },
    ];
  }

  if (cfg.id === 'breathing-pattern') {
    return (cfg.breathingPhases ?? ['Breathing']).map((title, index) => ({
      id: `capture-${index}`,
      title,
      shortTitle: `Phase ${index + 1}`,
      isComplete: session.breathingReadings.length > index,
    }));
  }

  return [
    {
      id: 'capture',
      title: 'Capture data',
      shortTitle: 'Capture',
      isComplete: false,
    },
  ];
}

export function isCaptureComplete(
  cfg: ActivityConfig,
  session: ActivitySession,
): boolean {
  return captureStepRows(cfg, session).every((step) => step.isComplete);
}

export function getCurrentCaptureStepId(
  cfg: ActivityConfig,
  session: ActivitySession,
): string {
  const rows = captureStepRows(cfg, session);
  return rows.find((step) => !step.isComplete)?.id ?? rows[rows.length - 1]?.id ?? 'capture';
}

export function getActivitySteps(params: {
  cfg: ActivityConfig;
  session: ActivitySession;
  activeStepId: string;
  completed: boolean;
}): ActivityStep[] {
  const { cfg, session, activeStepId, completed } = params;
  const rawSteps = [
    {
      id: 'prediction',
      title: 'Prediction & inputs',
      shortTitle: 'Predict',
      route: `/activity/${cfg.id}/prediction` as Href,
      isComplete: isPredictionComplete(cfg, session),
    },
    ...captureStepRows(cfg, session).map((step) => ({
      ...step,
      route: {
        pathname: '/activity/[activityId]/capture',
        params: { activityId: cfg.id, stepId: step.id },
      } as Href,
    })),
    {
      id: 'results',
      title: 'Results',
      shortTitle: 'Results',
      route: `/activity/${cfg.id}/dashboard` as Href,
      isComplete: isCaptureComplete(cfg, session),
    },
    {
      id: 'reflection',
      title: 'Reflection & submit',
      shortTitle: 'Reflect',
      route: `/activity/${cfg.id}/reflection` as Href,
      isComplete: completed,
    },
  ];

  const firstIncompleteIndex = rawSteps.findIndex((step) => !step.isComplete);
  const unlockedThrough =
    firstIncompleteIndex === -1 ? rawSteps.length - 1 : firstIncompleteIndex;

  return rawSteps.map((step, index) => {
    const isActive = step.id === activeStepId;
    const locked = index > unlockedThrough;
    return {
      ...step,
      status: isActive
        ? 'active'
        : locked
          ? 'locked'
          : step.isComplete
            ? 'complete'
            : 'available',
      lockedReason:
        locked && firstIncompleteIndex >= 0
          ? `Complete "${rawSteps[firstIncompleteIndex].shortTitle}" first.`
          : undefined,
    };
  });
}

export function captureStepIndex(stepId: string | undefined): number | null {
  if (!stepId?.startsWith('capture-')) return null;
  const raw = stepId.replace('capture-', '');
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function hasActivityDraftProgress(
  cfg: ActivityConfig,
  session: ActivitySession,
): boolean {
  return isPredictionComplete(cfg, session) || captureStepRows(cfg, session).some((s) => s.isComplete);
}

export function nextActivityRoute(
  cfg: ActivityConfig,
  session: ActivitySession,
): Href {
  if (!isPredictionComplete(cfg, session)) {
    return `/activity/${cfg.id}/prediction` as Href;
  }
  if (!isCaptureComplete(cfg, session)) {
    return {
      pathname: '/activity/[activityId]/capture',
      params: { activityId: cfg.id, stepId: getCurrentCaptureStepId(cfg, session) },
    } as Href;
  }
  return `/activity/${cfg.id}/dashboard` as Href;
}
