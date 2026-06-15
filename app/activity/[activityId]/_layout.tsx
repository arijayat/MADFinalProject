import { Stack, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityProgress } from '@/components/activity/ActivityProgress';
import { ScreenHeader } from '@/components/wireframe/BackNav';
import { useLocalizedActivity } from '@/constants/localized-activities';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { ActivityWorkflowChromeProvider } from '@/contexts/ActivityWorkflowContext';

export default function ActivityIdLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { activityId, stepId } = useLocalSearchParams<{
    activityId: string;
    stepId?: string;
  }>();
  const cfg = useLocalizedActivity(activityId ?? '');
  const { colors } = useAppTheme();
  const workflowRoute =
    pathname.endsWith('/prediction') ||
    pathname.endsWith('/capture') ||
    pathname.endsWith('/dashboard') ||
    pathname.endsWith('/reflection');

  const routeActiveStepId = pathname.endsWith('/prediction')
    ? 'prediction'
    : pathname.endsWith('/dashboard')
      ? 'results'
      : pathname.endsWith('/reflection')
        ? 'reflection'
        : stepId ?? 'capture-0';
  const [activeStepId, setActiveStepId] = useState(routeActiveStepId);
  const workflowChrome = useMemo(() => ({ setActiveStepId }), []);

  useEffect(() => {
    setActiveStepId(routeActiveStepId);
  }, [routeActiveStepId]);

  if (!workflowRoute || !cfg) {
    return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
  }

  const title = pathname.endsWith('/prediction')
    ? 'Prediction & Input'
    : pathname.endsWith('/dashboard')
      ? 'Analytical Dashboard'
      : pathname.endsWith('/reflection')
        ? 'Reflection & Upload'
        : 'Sensor Capture';

  const subtitle = pathname.endsWith('/prediction')
    ? 'Enter your hypothesis and experimental variables.'
    : pathname.endsWith('/dashboard')
      ? 'Compare your predictions with actual results.'
      : pathname.endsWith('/reflection')
        ? 'Document your findings and thoughts.'
        : 'Perform the experiment and capture data.';

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safe, { backgroundColor: colors.screenBg }]}>
      <View style={styles.top}>
        <ScreenHeader
          backLabel="BACK"
          onBack={() => router.replace(`/activity/${cfg.id}/intro`)}
          title={title}
          subtitle={subtitle}
        />
        <ActivityProgress cfg={cfg} activeStepId={activeStepId} />
      </View>
      <ActivityWorkflowChromeProvider value={workflowChrome}>
        <View style={styles.body}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'none',
              contentStyle: { backgroundColor: colors.screenBg },
            }}
          />
        </View>
      </ActivityWorkflowChromeProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  top: {
    paddingHorizontal: 18,
    paddingTop: 22,
    gap: 14,
  },
  body: {
    flex: 1,
  },
});
