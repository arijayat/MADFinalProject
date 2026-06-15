import { ActivityStepRail } from '@/components/activity/ActivityStepRail';
import type { ActivityConfig } from '@/constants/activities';
import { useActivitySession } from '@/contexts/ActivitySessionContext';
import { getActivitySteps } from '@/lib/activity-progress/steps';

type Props = {
  cfg: ActivityConfig;
  activeStepId: string;
};

export function ActivityProgress({ cfg, activeStepId }: Props) {
  const { getSession, isActivityCompleted } = useActivitySession();
  const session = getSession(cfg.id);
  const steps = getActivitySteps({
    cfg,
    session,
    activeStepId,
    completed: isActivityCompleted(cfg.id),
  });

  return <ActivityStepRail steps={steps} />;
}
