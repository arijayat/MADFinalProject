import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import type { ActivityStep } from '@/lib/activity-progress/steps';

type Props = {
  steps: ActivityStep[];
};

const STEP_WIDTH = 92;
const STEP_GAP = 8;
const ROW_PADDING = 12;

function iconForStatus(status: ActivityStep['status']) {
  if (status === 'complete') return 'check-circle';
  if (status === 'locked') return 'lock';
  if (status === 'active') return 'radio-button-checked';
  if (status === 'error' || status === 'needs-upload') return 'error';
  return 'radio-button-unchecked';
}

export function ActivityStepRail({ steps }: Props) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.status === 'active'),
  );
  const activeOffset = useMemo(
    () => Math.max(0, activeIndex * (STEP_WIDTH + STEP_GAP) - ROW_PADDING),
    [activeIndex],
  );

  useEffect(() => {
    const id = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: activeOffset, y: 0, animated: false });
    }, 0);
    return () => clearTimeout(id);
  }, [activeOffset]);

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.panelBg,
          borderColor: colors.border,
          boxShadow: colors.shadow,
        },
      ]}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Activity progress</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        contentOffset={{ x: activeOffset, y: 0 }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {steps.map((step, index) => {
          const locked = step.status === 'locked';
          const active = step.status === 'active';
          const complete = step.status === 'complete';
          return (
            <Pressable
              key={step.id}
              accessibilityRole="button"
              accessibilityState={{ disabled: locked, selected: active }}
              disabled={false}
              onPress={() => {
                if (locked) {
                  Alert.alert('Step locked', step.lockedReason ?? 'Complete the previous step first.');
                  return;
                }
                router.replace(step.route);
              }}
              style={({ pressed }) => [
                styles.step,
                {
                  backgroundColor: active
                    ? colors.accentSoft
                    : complete
                      ? colors.surfaceAlt
                      : colors.panelBg,
                  borderColor: active
                    ? Wireframe.accent
                    : complete
                      ? colors.border
                      : locked
                        ? colors.border
                        : Wireframe.accent,
                  opacity: locked ? 0.55 : pressed ? 0.86 : 1,
                },
              ]}>
              <View style={styles.topLine}>
                <Text style={[styles.index, { color: colors.textMuted }]}>
                  {index + 1}
                </Text>
                <MaterialIcons
                  name={iconForStatus(step.status)}
                  size={16}
                  color={
                    active || complete
                      ? Wireframe.accent
                      : locked
                        ? colors.textMuted
                        : colors.text
                  }
                />
              </View>
              <Text
                numberOfLines={2}
                style={[
                  styles.title,
                  { color: locked ? colors.textMuted : colors.text },
                  active && styles.titleActive,
                ]}>
                {step.shortTitle}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    backgroundColor: Wireframe.panelBg,
    borderColor: Wireframe.border,
    boxShadow: Wireframe.shadow,
  },
  label: {
    paddingHorizontal: 12,
    marginBottom: 8,
    color: Wireframe.textMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  row: {
    gap: 8,
    paddingHorizontal: 12,
  },
  step: {
    width: STEP_WIDTH,
    minHeight: 66,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  index: {
    fontSize: 11,
    fontWeight: '800',
    color: Wireframe.textMuted,
    fontVariant: ['tabular-nums'],
  },
  title: {
    color: Wireframe.text,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
  },
  titleActive: {
    color: Wireframe.accent,
  },
});
