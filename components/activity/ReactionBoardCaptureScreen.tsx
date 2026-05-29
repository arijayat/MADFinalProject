import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import type { ActivityConfig } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';
import {
  useActivitySession,
  type TapReactionReading,
  type TracingReading,
} from '@/contexts/ActivitySessionContext';

type Props = {
  cfg: ActivityConfig;
};

type MainPhase = 'tap_dominant' | 'tap_non_dominant' | 'tracing';
type TapUi = 'intro' | 'waiting' | 'ready' | 'result';
type TraceUi = 'intro' | 'tracing' | 'result';

const TAP_BUTTON = 72;
const TRACE_DURATION_MS = 8000;
const TRACE_SAMPLE_MS = 50;
const RANDOM_DELAY_MIN = 1500;
const RANDOM_DELAY_MAX = 4500;

function randomDelayMs() {
  return (
    RANDOM_DELAY_MIN +
    Math.floor(Math.random() * (RANDOM_DELAY_MAX - RANDOM_DELAY_MIN))
  );
}

function targetPoint(progress: number, w: number, h: number) {
  const margin = 36;
  const x = margin + progress * Math.max(1, w - margin * 2);
  const y = h / 2 + Math.sin(progress * Math.PI * 3) * (h * 0.22);
  return { x, y };
}

function computeTracingMetrics(
  targetSamples: { t: number; x: number; y: number }[],
  touchSamples: { t: number; x: number; y: number }[],
) {
  if (targetSamples.length === 0 || touchSamples.length === 0) {
    return { accuracyPct: 0, avgDelayMs: 0 };
  }

  let distSum = 0;
  let delaySum = 0;
  let count = 0;

  for (const touch of touchSamples) {
    let nearest = targetSamples[0];
    let bestDist = Infinity;
    for (const target of targetSamples) {
      const dx = touch.x - target.x;
      const dy = touch.y - target.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist) {
        bestDist = d;
        nearest = target;
      }
    }
    distSum += bestDist;
    delaySum += Math.max(0, touch.t - nearest.t);
    count += 1;
  }

  const avgDist = distSum / count;
  const avgDelayMs = Math.round(delaySum / count);
  const accuracyPct = Math.max(0, Math.min(100, Math.round(100 - avgDist / 2.5)));
  return { accuracyPct, avgDelayMs };
}

export function ReactionBoardCaptureScreen({ cfg }: Props) {
  const router = useRouter();
  const { setTapReactionReadings, setTracingReadings, clearCapture } =
    useActivitySession();

  const tapAttempts = cfg.reactionTapAttempts ?? 3;
  const traceAttempts = cfg.reactionTraceAttempts ?? 3;

  const [mainPhase, setMainPhase] = useState<MainPhase>('tap_dominant');
  const [tapAttempt, setTapAttempt] = useState(1);
  const [traceAttempt, setTraceAttempt] = useState(1);
  const [tapUi, setTapUi] = useState<TapUi>('intro');
  const [traceUi, setTraceUi] = useState<TraceUi>('intro');
  const [allDone, setAllDone] = useState(false);

  const [tapSaved, setTapSaved] = useState<TapReactionReading[]>([]);
  const [traceSaved, setTraceSaved] = useState<TracingReading[]>([]);

  const [lastReactionMs, setLastReactionMs] = useState<number | null>(null);
  const [falseStart, setFalseStart] = useState(false);
  const [buttonPos, setButtonPos] = useState({ left: 40, top: 120 });

  const [arenaSize, setArenaSize] = useState({ w: 300, h: 280 });
  const [targetPos, setTargetPos] = useState({ x: 40, y: 140 });
  const [traceProgress, setTraceProgress] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState<number | null>(null);
  const [liveDelay, setLiveDelay] = useState<number | null>(null);

  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimeRef = useRef<number | null>(null);
  const traceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const traceStartRef = useRef<number | null>(null);
  const targetSamplesRef = useRef<{ t: number; x: number; y: number }[]>([]);
  const touchSamplesRef = useRef<{ t: number; x: number; y: number }[]>([]);
  const mainPhaseRef = useRef(mainPhase);
  const traceUiRef = useRef(traceUi);

  useEffect(() => {
    mainPhaseRef.current = mainPhase;
  }, [mainPhase]);

  useEffect(() => {
    traceUiRef.current = traceUi;
  }, [traceUi]);

  useEffect(() => {
    clearCapture(cfg.id);
    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (traceIntervalRef.current) clearInterval(traceIntervalRef.current);
    };
  }, [cfg.id, clearCapture]);

  const handForPhase = (): 'dominant' | 'non_dominant' =>
    mainPhase === 'tap_dominant' ? 'dominant' : 'non_dominant';

  const placeRandomButton = useCallback(() => {
    const maxLeft = Math.max(8, arenaSize.w - TAP_BUTTON - 8);
    const maxTop = Math.max(8, arenaSize.h - TAP_BUTTON - 8);
    setButtonPos({
      left: 8 + Math.floor(Math.random() * maxLeft),
      top: 8 + Math.floor(Math.random() * maxTop),
    });
  }, [arenaSize.w, arenaSize.h]);

  const clearDelayTimer = useCallback(() => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  }, []);

  const startTapTrial = useCallback(() => {
    clearDelayTimer();
    setFalseStart(false);
    setLastReactionMs(null);
    placeRandomButton();
    setTapUi('waiting');
    delayTimerRef.current = setTimeout(() => {
      showTimeRef.current = Date.now();
      setTapUi('ready');
    }, randomDelayMs());
  }, [clearDelayTimer, placeRandomButton]);

  const onEarlyTap = useCallback(() => {
    if (tapUi !== 'waiting') return;
    clearDelayTimer();
    setFalseStart(true);
    setLastReactionMs(null);
    setTapUi('result');
  }, [tapUi, clearDelayTimer]);

  const onReactionTap = useCallback(() => {
    if (tapUi !== 'ready' || showTimeRef.current == null) return;
    const ms = Date.now() - showTimeRef.current;
    setLastReactionMs(ms);
    setTapUi('result');
  }, [tapUi]);

  const saveTapResult = useCallback(() => {
    const hand = handForPhase();
    const reading: TapReactionReading = {
      hand,
      attempt: tapAttempt as 1 | 2 | 3,
      reactionTimeMs: falseStart ? 0 : (lastReactionMs ?? 0),
      falseStart,
    };
    const nextTap = [...tapSaved, reading];
    setTapSaved(nextTap);

    if (tapAttempt < tapAttempts) {
      setTapAttempt((a) => a + 1);
      setTapUi('intro');
      return;
    }

    if (mainPhase === 'tap_dominant') {
      setMainPhase('tap_non_dominant');
      setTapAttempt(1);
      setTapUi('intro');
      return;
    }

    setMainPhase('tracing');
    setTraceAttempt(1);
    setTraceUi('intro');
    setTapReactionReadings(cfg.id, nextTap);
  }, [
    tapSaved,
    tapAttempt,
    tapAttempts,
    mainPhase,
    falseStart,
    lastReactionMs,
    setTapReactionReadings,
    cfg.id,
  ]);

  const stopTraceInterval = useCallback(() => {
    if (traceIntervalRef.current) {
      clearInterval(traceIntervalRef.current);
      traceIntervalRef.current = null;
    }
  }, []);

  const finishTracing = useCallback(() => {
    stopTraceInterval();
    const metrics = computeTracingMetrics(
      targetSamplesRef.current,
      touchSamplesRef.current,
    );
    setLiveAccuracy(metrics.accuracyPct);
    setLiveDelay(metrics.avgDelayMs);
    setTraceUi('result');
  }, [stopTraceInterval]);

  const startTracing = useCallback(() => {
    targetSamplesRef.current = [];
    touchSamplesRef.current = [];
    setTraceProgress(0);
    setLiveAccuracy(null);
    setLiveDelay(null);
    traceStartRef.current = Date.now();
    setTraceUi('tracing');

    traceIntervalRef.current = setInterval(() => {
      const start = traceStartRef.current;
      if (start == null) return;
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / TRACE_DURATION_MS);
      const pt = targetPoint(progress, arenaSize.w, arenaSize.h);
      setTargetPos(pt);
      setTraceProgress(progress);
      targetSamplesRef.current.push({ t: elapsed, x: pt.x, y: pt.y });

      if (touchSamplesRef.current.length > 0) {
        const live = computeTracingMetrics(
          targetSamplesRef.current,
          touchSamplesRef.current,
        );
        setLiveAccuracy(live.accuracyPct);
        setLiveDelay(live.avgDelayMs);
      }

      if (progress >= 1) {
        finishTracing();
      }
    }, TRACE_SAMPLE_MS);
  }, [arenaSize.w, arenaSize.h, finishTracing]);

  const saveTraceResult = useCallback(() => {
    const metrics = computeTracingMetrics(
      targetSamplesRef.current,
      touchSamplesRef.current,
    );
    const reading: TracingReading = {
      attempt: traceAttempt as 1 | 2 | 3,
      accuracyPct: metrics.accuracyPct,
      avgDelayMs: metrics.avgDelayMs,
    };
    const nextTrace = [...traceSaved, reading];
    setTraceSaved(nextTrace);

    if (traceAttempt < traceAttempts) {
      setTraceAttempt((a) => a + 1);
      setTraceUi('intro');
      return;
    }

    setTracingReadings(cfg.id, nextTrace);
    setTapReactionReadings(cfg.id, tapSaved);
    setAllDone(true);
  }, [
    traceSaved,
    traceAttempt,
    traceAttempts,
    tapSaved,
    setTracingReadings,
    setTapReactionReadings,
    cfg.id,
  ]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => traceUiRef.current === 'tracing',
      onMoveShouldSetPanResponder: () => traceUiRef.current === 'tracing',
      onPanResponderGrant: (evt) => {
        if (traceUiRef.current !== 'tracing' || traceStartRef.current == null)
          return;
        const { locationX, locationY } = evt.nativeEvent;
        touchSamplesRef.current.push({
          t: Date.now() - traceStartRef.current,
          x: locationX,
          y: locationY,
        });
      },
      onPanResponderMove: (evt) => {
        if (traceUiRef.current !== 'tracing' || traceStartRef.current == null)
          return;
        const { locationX, locationY } = evt.nativeEvent;
        touchSamplesRef.current.push({
          t: Date.now() - traceStartRef.current,
          x: locationX,
          y: locationY,
        });
      },
    }),
  ).current;

  const phaseTitle = () => {
    if (mainPhase === 'tap_dominant') return 'Phase 1: Tap reaction (dominant hand)';
    if (mainPhase === 'tap_non_dominant')
      return 'Phase 2: Swap hands (non-dominant hand)';
    return 'Phase 3: Tracing challenge';
  };

  const phaseHint = () => {
    if (mainPhase === 'tracing') {
      if (traceUi === 'intro')
        return 'Trace the moving circle with one finger for 8 seconds. Keep the phone flat on the table.';
      if (traceUi === 'tracing')
        return 'Follow the green circle closely with your finger.';
      return 'Tracing complete for this attempt.';
    }
    if (tapUi === 'intro')
      return mainPhase === 'tap_dominant'
        ? 'Use your dominant hand. Tap the button as soon as it appears.'
        : 'Use your non-dominant hand. Tap as soon as the button appears.';
    if (tapUi === 'waiting') return 'Wait… do not tap until the button appears.';
    if (tapUi === 'ready') return 'Tap now!';
    if (falseStart) return 'False start — wait for the button before tapping.';
    return lastReactionMs != null
      ? `Reaction time: ${lastReactionMs} ms`
      : 'Trial recorded.';
  };

  const onArenaLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArenaSize({ w: width, h: height });
  };

  let footerLabel = 'START TRIAL';
  let footerAction: () => void = () => {};
  let footerDisabled = false;

  if (allDone) {
    footerLabel = 'VIEW RESULTS';
    footerAction = () => router.push(`/activity/${cfg.id}/dashboard`);
  } else if (mainPhase === 'tracing') {
    if (traceUi === 'intro') {
      footerAction = startTracing;
    } else if (traceUi === 'tracing') {
      footerLabel = 'STOP EARLY';
      footerAction = finishTracing;
    } else {
      footerLabel =
        traceAttempt < traceAttempts ? 'NEXT ATTEMPT' : 'FINISH ACTIVITY';
      footerAction = saveTraceResult;
    }
  } else {
    if (tapUi === 'intro') {
      footerAction = startTapTrial;
    } else if (tapUi === 'waiting' || tapUi === 'ready') {
      footerLabel = '';
      footerDisabled = true;
      footerAction = () => {};
    } else {
      if (tapAttempt < tapAttempts) {
        footerLabel = 'NEXT TRIAL';
      } else if (mainPhase === 'tap_dominant') {
        footerLabel = 'NEXT PHASE';
      } else {
        footerLabel = 'START TRACING';
      }
      footerAction = saveTapResult;
    }
  }

  const tapProgressLabel =
    mainPhase !== 'tracing'
      ? `Trial ${tapAttempt} of ${tapAttempts}`
      : `Attempt ${traceAttempt} of ${traceAttempts}`;

  return (
    <WireScreen
      scroll={false}
      footer={
        footerLabel ? (
          <PrimaryButton
            label={footerLabel}
            onPress={footerAction}
            disabled={footerDisabled}
          />
        ) : undefined
      }>
      <ScreenHeader
        backLabel="BACK"
        onBack={() => router.back()}
        title="Reaction Board Challenge"
        subtitle="Keep the phone flat. One finger per phase."
      />

      <Text style={styles.phase}>{phaseTitle()}</Text>
      <Text style={styles.step}>{tapProgressLabel}</Text>
      <Text style={styles.hint}>{phaseHint()}</Text>

      <View
        style={styles.arena}
        onLayout={onArenaLayout}
        {...(mainPhase === 'tracing' && traceUi === 'tracing'
          ? panResponder.panHandlers
          : {})}>
        {mainPhase !== 'tracing' ? (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (tapUi === 'waiting') onEarlyTap();
              else if (tapUi === 'ready') onReactionTap();
            }}>
            {tapUi === 'waiting' ? (
              <View style={styles.waitBox}>
                <Text style={styles.waitText}>Wait for the button…</Text>
              </View>
            ) : null}
            {tapUi === 'ready' ? (
              <Pressable
                style={[
                  styles.tapButton,
                  { left: buttonPos.left, top: buttonPos.top },
                ]}
                onPress={onReactionTap}>
                <Text style={styles.tapButtonText}>TAP</Text>
              </Pressable>
            ) : null}
            {tapUi === 'result' && !falseStart && lastReactionMs != null ? (
              <View style={styles.resultBox}>
                <Text style={styles.resultMs}>{lastReactionMs}</Text>
                <Text style={styles.resultUnit}>ms</Text>
              </View>
            ) : null}
            {tapUi === 'intro' ? (
              <View style={styles.waitBox}>
                <Text style={styles.waitText}>
                  Press START TRIAL when ready.
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : (
          <>
            <View
              style={[
                styles.tracePath,
                {
                  opacity: traceUi === 'tracing' ? 0.35 : 0.2,
                },
              ]}
            />
            {(traceUi === 'tracing' || traceUi === 'result') && (
              <View
                style={[
                  styles.targetDot,
                  {
                    left: targetPos.x - 14,
                    top: targetPos.y - 14,
                  },
                ]}
              />
            )}
            {traceUi === 'intro' ? (
              <View style={styles.waitBox}>
                <Text style={styles.waitText}>
                  A shape will move across the screen. Trace it with your
                  finger.
                </Text>
              </View>
            ) : null}
            {traceUi === 'result' && liveAccuracy != null ? (
              <View style={styles.traceStats}>
                <Text style={styles.traceStatLine}>
                  Accuracy: {liveAccuracy}%
                </Text>
                <Text style={styles.traceStatLine}>
                  Avg delay: {liveDelay ?? 0} ms
                </Text>
              </View>
            ) : null}
            {traceUi === 'tracing' ? (
              <View style={styles.traceLive}>
                <Text style={styles.traceLiveText}>
                  {Math.round(traceProgress * 100)}% ·{' '}
                  {liveAccuracy != null ? `${liveAccuracy}% acc` : 'tracing…'}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      {tapSaved.length > 0 || traceSaved.length > 0 ? (
        <View style={styles.savedBlock}>
          <Text style={styles.savedTitle}>Recorded</Text>
          {tapSaved.map((r) => (
            <Text key={`${r.hand}-${r.attempt}`} style={styles.savedRow}>
              • {r.hand === 'dominant' ? 'P1' : 'P2'} trial {r.attempt}:{' '}
              {r.falseStart ? 'false start' : `${r.reactionTimeMs} ms`}
            </Text>
          ))}
          {traceSaved.map((r) => (
            <Text key={`trace-${r.attempt}`} style={styles.savedRow}>
              • Trace {r.attempt}: {r.accuracyPct}% · {r.avgDelayMs} ms delay
            </Text>
          ))}
        </View>
      ) : null}

      {allDone ? (
        <View style={styles.statusBlock}>
          <Text style={styles.statusLine}>✓ {cfg.captureDoneStatusA}</Text>
          <Text style={styles.statusLine}>✓ {cfg.captureDoneStatusB}</Text>
        </View>
      ) : null}
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  phase: {
    color: Wireframe.accentYellow,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  step: { color: '#aaa', fontSize: 12, marginBottom: 4 },
  hint: {
    color: Wireframe.panelBg,
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  arena: {
    flex: 1,
    minHeight: 280,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#555',
    overflow: 'hidden',
  },
  waitBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  waitText: {
    color: '#bbb',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  tapButton: {
    position: 'absolute',
    width: TAP_BUTTON,
    height: TAP_BUTTON,
    borderRadius: TAP_BUTTON / 2,
    backgroundColor: Wireframe.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  tapButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  resultBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultMs: {
    color: Wireframe.accentYellow,
    fontSize: 48,
    fontWeight: '800',
  },
  resultUnit: { color: '#aaa', fontSize: 16 },
  tracePath: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a3a1a',
  },
  targetDot: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4caf50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  traceLive: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
  },
  traceLiveText: {
    color: Wireframe.panelBg,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  traceStats: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 4,
  },
  traceStatLine: {
    color: Wireframe.panelBg,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  savedBlock: { marginTop: 12 },
  savedTitle: { color: '#aaa', fontSize: 12, marginBottom: 6 },
  savedRow: { color: Wireframe.panelBg, fontSize: 13, marginBottom: 4 },
  statusBlock: { marginTop: 12 },
  statusLine: { color: Wireframe.panelBg, fontSize: 14, marginBottom: 4 },
});
