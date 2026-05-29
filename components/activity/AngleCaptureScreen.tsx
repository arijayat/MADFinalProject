import {
    CameraView,
    useCameraPermissions,
    useMicrophonePermissions,
} from "expo-camera";
import { useRouter } from "expo-router";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import {
    Alert,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { DropVideoReview } from "@/components/activity/DropVideoReview";
import { ScreenHeader } from "@/components/wireframe/BackNav";
import { PrimaryButton } from "@/components/wireframe/PrimaryButton";
import { WireScreen } from "@/components/wireframe/WireScreen";
import type { ActivityConfig } from "@/constants/activities";
import { Wireframe } from "@/constants/wireframe-theme";
import {
    useActivitySession,
    type AngleReading,
} from "@/contexts/ActivitySessionContext";

type Props = {
  cfg: ActivityConfig;
};

type Phase = "preview" | "recording" | "review" | "angle-entry";

type RecordingResult = { uri: string };

export function AngleCaptureScreen({ cfg }: Props) {
  const router = useRouter();
  const { setAngleReadings, clearCapture } = useActivitySession();
  const actions = cfg.angleActions ?? ["Measurement"];
  const cameraRef = useRef<CameraView>(null);
  const recordingPromiseRef = useRef<Promise<
    RecordingResult | undefined
  > | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [actionIndex, setActionIndex] = useState(0);
  const [saved, setSaved] = useState<AngleReading[]>([]);
  const [phase, setPhase] = useState<Phase>("preview");
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [angleInput, setAngleInput] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allDone = saved.length >= actions.length;
  const currentLabel = actions[actionIndex] ?? actions[actions.length - 1];

  useEffect(() => {
    clearCapture(cfg.id);
  }, [cfg.id, clearCapture]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const ensurePermissions = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Use a phone",
        "Video capture requires the iOS or Android app on a real device.",
      );
      return false;
    }
    if (!cameraPermission?.granted) {
      const cam = await requestCameraPermission();
      if (!cam.granted) {
        Alert.alert(
          "Camera needed",
          "Allow camera access to record angle measurements.",
        );
        return false;
      }
    }
    if (!micPermission?.granted) {
      const mic = await requestMicPermission();
      if (!mic.granted) {
        Alert.alert(
          "Microphone optional",
          "You can still record video without microphone audio.",
        );
      }
    }
    return true;
  }, [
    cameraPermission?.granted,
    micPermission?.granted,
    requestCameraPermission,
    requestMicPermission,
  ]);

  const startRecording = useCallback(async () => {
    if (!(await ensurePermissions())) return;
    setVideoUri(null);
    setPhase("recording");
    setTick(0);
    timerRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    try {
      recordingPromiseRef.current =
        cameraRef.current?.recordAsync({ maxDuration: 30 }) ?? null;
    } catch {
      Alert.alert(
        "Could not record",
        "Try again with the camera positioned correctly.",
      );
      setPhase("preview");
    }
  }, [ensurePermissions]);

  const stopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      cameraRef.current?.stopRecording();
    } catch {
      /* already stopped */
    }
    try {
      const result = await recordingPromiseRef.current;
      recordingPromiseRef.current = null;
      if (result?.uri) {
        setVideoUri(result.uri);
        setPhase("review");
      } else {
        Alert.alert("No video saved", "Try recording again.");
        setPhase("preview");
      }
    } catch {
      recordingPromiseRef.current = null;
      Alert.alert("Could not save video", "Try recording again.");
      setPhase("preview");
    }
  }, []);

  const goToAngleEntry = useCallback(() => {
    setPhase("angle-entry");
    setAngleInput("");
  }, []);

  const reRecord = useCallback(() => {
    setVideoUri(null);
    setPhase("preview");
  }, []);

  const saveAngle = useCallback(() => {
    const angle = parseFloat(angleInput);
    if (!Number.isFinite(angle) || angle < 0 || angle > 360) {
      Alert.alert("Invalid angle", "Enter an angle between 0 and 360 degrees.");
      return;
    }

    const reading: AngleReading = {
      label: currentLabel,
      angleDegrees: angle,
      videoUri: videoUri ?? undefined,
    };
    const nextSaved = [...saved, reading];
    setSaved(nextSaved);
    setVideoUri(null);

    if (actionIndex + 1 < actions.length) {
      setActionIndex((i) => i + 1);
      setPhase("preview");
    } else {
      setAngleReadings(cfg.id, nextSaved);
      setPhase("preview");
    }
  }, [
    angleInput,
    videoUri,
    saved,
    actionIndex,
    actions.length,
    currentLabel,
    setAngleReadings,
    cfg.id,
  ]);

  let footerLabel = "START RECORDING";
  let footerAction: () => void = startRecording;

  if (allDone) {
    footerLabel = "VIEW RESULTS";
    footerAction = () => router.push(`/activity/${cfg.id}/dashboard`);
  } else if (phase === "recording") {
    footerLabel = "STOP RECORDING";
    footerAction = stopRecording;
  } else if (phase === "review") {
    footerLabel = "MEASURE ANGLE";
    footerAction = goToAngleEntry;
  } else if (phase === "angle-entry") {
    footerLabel = "SAVE ANGLE";
    footerAction = saveAngle;
  }

  const renderContent = (): ReactNode => {
    if (allDone) {
      return (
        <View style={styles.content}>
          <Text style={styles.title}>✓ All measurements complete!</Text>
          <Text style={styles.subtitle}>
            {saved.length} angle measurement{saved.length !== 1 ? "s" : ""}{" "}
            recorded.
          </Text>
          {saved.map((reading, i) => (
            <View key={i} style={styles.savedItem}>
              <Text style={styles.savedLabel}>{reading.label}</Text>
              <Text style={styles.savedValue}>{reading.angleDegrees}°</Text>
            </View>
          ))}
        </View>
      );
    }

    if (phase === "angle-entry") {
      return (
        <View style={styles.content}>
          <Text style={styles.title}>Enter Angle Measurement</Text>
          <Text style={styles.subtitle}>
            Review the video and measure the angle in degrees (0-360°)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter angle (degrees)"
            placeholderTextColor={Wireframe.colors.neutral[500]}
            value={angleInput}
            onChangeText={setAngleInput}
            keyboardType="decimal-pad"
            maxLength={6}
          />
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]}
              onPress={reRecord}
            >
              <Text style={styles.secondaryButtonText}>RE-RECORD</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
          </View>
        </View>
      );
    }

    if (phase === "review" && videoUri) {
      return (
        <View style={styles.content}>
          <Text style={styles.title}>Review Video</Text>
          <Text style={styles.subtitle}>
            Watch the recording and prepare to measure the angle
          </Text>
          <DropVideoReview videoUri={videoUri} />
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]}
              onPress={reRecord}
            >
              <Text style={styles.secondaryButtonText}>RE-RECORD</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.content}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          mode="video"
          facing="back"
        />
        {phase === "recording" && (
          <View style={styles.recordingOverlay}>
            <View style={styles.recordingBadge}>
              <Text style={styles.recordingIndicator}>● REC</Text>
              <Text style={styles.recordingTime}>{formatTime(tick)}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <WireScreen
      scroll={false}
      header={
        <ScreenHeader
          title={cfg.title}
          subtitle={`${currentLabel} (${actionIndex + 1}/${actions.length})`}
          onBack={() => router.back()}
        />
      }
      footer={<PrimaryButton label={footerLabel} onPress={footerAction} />}
    >
      {renderContent()}
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 12,
  },
  camera: {
    flex: 1,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  recordingOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    pointerEvents: "none",
  },
  recordingBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recordingIndicator: {
    color: "#FF0000",
    fontSize: 14,
    fontWeight: "bold",
  },
  recordingTime: {
    color: "#FFF",
    fontSize: 12,
    marginTop: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Wireframe.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Wireframe.textMuted,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Wireframe.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
    color: Wireframe.text,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Wireframe.border,
    borderRadius: 4,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Wireframe.text,
  },
  savedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    marginBottom: 8,
  },
  savedLabel: {
    fontSize: 14,
    color: Wireframe.textMuted,
  },
  savedValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Wireframe.text,
  },
});
