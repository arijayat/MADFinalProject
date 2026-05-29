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
    StyleSheet,
    Text,
    View
} from "react-native";

import { DropVideoReview } from "@/components/activity/DropVideoReview";
import { ScreenHeader } from "@/components/wireframe/BackNav";
import { PrimaryButton } from "@/components/wireframe/PrimaryButton";
import { WireScreen } from "@/components/wireframe/WireScreen";
import type { ActivityConfig } from "@/constants/activities";
import { Wireframe } from "@/constants/wireframe-theme";
import { useActivitySession } from "@/contexts/ActivitySessionContext";

type Props = {
  cfg: ActivityConfig;
};

type Phase = "preview" | "recording" | "review";

type RecordingResult = { uri: string };

export function FanChallengeCaptureScreen({ cfg }: Props) {
  const router = useRouter();
  const { clearCapture } = useActivitySession();
  const cameraRef = useRef<CameraView>(null);
  const recordingPromiseRef = useRef<Promise<
    RecordingResult | undefined
  > | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [phase, setPhase] = useState<Phase>("preview");
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isSlowMo, setIsSlowMo] = useState(false);

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

    let cam = cameraPermission?.granted;
    if (!cam) {
      const req = await requestCameraPermission();
      cam = req.granted;
    }

    let mic = micPermission?.granted;
    if (!mic) {
      const req = await requestMicPermission();
      mic = req.granted;
    }

    if (!cam || !mic) {
      Alert.alert(
        "Permissions denied",
        "Camera and microphone permissions are required.",
      );
      return false;
    }

    return true;
  }, [
    cameraPermission,
    requestCameraPermission,
    micPermission,
    requestMicPermission,
  ]);

  const startRecording = useCallback(async () => {
    if (!cameraReady) {
      Alert.alert("Camera not ready", "Please wait for the camera to initialize.");
      return;
    }

    const ok = await ensurePermissions();
    if (!ok) return;

    if (!cameraRef.current) return;

    try {
      recordingPromiseRef.current = cameraRef.current.recordAsync({
        quality: "1080p",
        mute: false,
      });

      setPhase("recording");
      setTick(0);
      timerRef.current = setInterval(() => setTick((t) => t + 1), 1000);

      if (cfg.showSlowMo) {
        setIsSlowMo(true);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to start recording: " + String(err));
    }
  }, [ensurePermissions, cfg.showSlowMo, cameraReady]);

  const stopRecording = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!recordingPromiseRef.current) return;

    try {
      const result = await recordingPromiseRef.current;
      recordingPromiseRef.current = null;

      if (result?.uri) {
        setVideoUri(result.uri);
        setPhase("review");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to stop recording: " + String(err));
    }
  }, []);

  let content: ReactNode = null;
  let footer: ReactNode = null;

  if (phase === "preview") {
    content = (
      <>
        <ScreenHeader
          backLabel="BACK"
          onBack={() => router.back()}
          title="Hand Fan Challenge"
          subtitle="Record the fan in action"
        />
        <View style={styles.previewWrap}>
          <CameraView
            ref={cameraRef}
            facing="back"
            mute={false}
            zoom={0}
            onCameraReady={() => setCameraReady(true)}
            style={styles.camera}
          />
          <View style={styles.camRow}>
            <Text style={styles.tagRed}>{cfg.captureIdleLabel}</Text>
            {cfg.showSlowMo ? (
              <Text style={styles.tagGrey}>SLOW-MO MODE</Text>
            ) : (
              <View />
            )}
          </View>
        </View>
      </>
    );
    footer = <PrimaryButton label="START RECORDING" onPress={startRecording} />;
  } else if (phase === "recording") {
    content = (
      <>
        <ScreenHeader
          backLabel="BACK"
          onBack={() => {
            if (timerRef.current) clearInterval(timerRef.current);
            setPhase("preview");
          }}
          title="Hand Fan Challenge"
          subtitle="Recording..."
        />
        <View style={styles.previewWrap}>
          <CameraView
            ref={cameraRef}
            facing="back"
            mute={false}
            zoom={0}
            onCameraReady={() => setCameraReady(true)}
            style={styles.camera}
          />
          <View style={styles.recordingBar}>
            <Text style={styles.recording}>RECORDING</Text>
            <Text style={styles.timer}>{formatTime(tick)}</Text>
          </View>
          <View style={styles.camRow}>
            <Text style={styles.tagRed}>{cfg.captureDoneLabel}</Text>
            {cfg.showSlowMo ? (
              <Text style={styles.tagGrey}>SLOW-MO MODE</Text>
            ) : (
              <View />
            )}
          </View>
        </View>
      </>
    );
    footer = <PrimaryButton label="STOP RECORDING" onPress={stopRecording} />;
  } else if (phase === "review" && videoUri) {
    content = (
      <>
        <ScreenHeader
          backLabel="RE-RECORD"
          onBack={() => {
            setVideoUri(null);
            setPhase("preview");
          }}
          title="Playback"
          subtitle={
            cfg.showSlowMo
              ? "Use slow-motion to measure the angle at the furthest bend"
              : "Review your recording"
          }
        />
        <DropVideoReview uri={videoUri} />
        <View style={styles.reviewHint}>
          {cfg.showSlowMo ? (
            <Text style={styles.reviewText}>
              Drag the timeline to pause on the frame showing the maximum bend
              angle, then manually measure the angle.
            </Text>
          ) : (
            <Text style={styles.reviewText}>
              Review your recording to ensure the bend was captured clearly.
            </Text>
          )}
        </View>
      </>
    );
    footer = (
      <PrimaryButton
        label="SAVE & CONTINUE"
        onPress={() => router.push(`/activity/${cfg.id}/dashboard`)}
      />
    );
  }

  return <WireScreen footer={footer}>{content}</WireScreen>;
}

const styles = StyleSheet.create({
  previewWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 9 / 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  camRow: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  tagRed: {
    backgroundColor: "#d32f2f",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  tagGrey: {
    backgroundColor: "#666",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  recordingBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#d32f2f",
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
  },
  recording: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: "monospace",
  },
  timer: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "monospace",
  },
  reviewHint: {
    padding: 16,
    backgroundColor: Wireframe.panelBg,
    borderRadius: 8,
    marginTop: 16,
  },
  reviewText: {
    color: Wireframe.textColor,
    fontSize: 14,
    lineHeight: 20,
  },
});
