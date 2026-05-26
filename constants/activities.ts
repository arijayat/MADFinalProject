export type ActivityId =
  | "parachute-drop"
  | "decibel-detector"
  | "catapult-launch"
  | "vibration-analysis"
  | "reaction-time"
  | "surface-smoothness"
  | "breathing-pattern";

export type PredictionField =
  | {
      key: string;
      label: string;
      placeholder: string;
      kind: "text" | "number";
    }
  | {
      key: string;
      label: string;
      placeholder: string;
      kind: "dropdown";
      options: string[];
    };

export type CaptureKind =
  | "camera"
  | "decibel"
  | "vibration_hz"
  | "waveform"
  | "reaction";

export interface ActivityConfig {
  id: ActivityId;
  title: string;
  subtitle: string;
  hubDescription: string;
  requirements: string[];
  gear: string[];
  safety: string[];
  predictionFields: PredictionField[];
  dashboardVariables: string[];
  captureKind: CaptureKind;
  /** Unit label for meter readout when idle */
  captureIdleLabel: string;
  /** Unit label for meter readout when done */
  captureDoneLabel: string;
  captureDoneStatusA: string;
  captureDoneStatusB: string;
  leaderboardSubtitle: string;
  showSlowMo?: boolean;
  showRecordingTimer?: boolean;
  /** Sound Pollution Hunter: measure each classroom action with the microphone */
  decibelActions?: string[];
}

const safetyDefault = [
  "Always perform experiments in a safe, supervised area.",
  "Wear safety goggles if launching or dropping objects.",
  "Keep spectators at a safe distance during tests.",
];

export const ACTIVITIES: Record<ActivityId, ActivityConfig> = {
  "parachute-drop": {
    id: "parachute-drop",
    title: "Parachute Drop",
    subtitle: "Measure the fall rate of different parachute designs.",
    hubDescription: "Measure the fall rate of different parachute designs.",
    requirements: ["Parachute", "Action Figure", "Measuring Tape"],
    gear: ["Parachute", "Action Figure", "Measuring Tape", "Stopwatch"],
    safety: safetyDefault,
    predictionFields: [
      {
        key: "mass",
        label: "Mass of Toy (grams)",
        placeholder: "Enter mass of toy (grams)",
        kind: "number",
      },
      {
        key: "diameter",
        label: "Parachute Diameter (cm)",
        placeholder: "Enter parachute diameter (cm)",
        kind: "number",
      },
      {
        key: "material",
        label: "Material Type",
        placeholder: "Select Material Type",
        kind: "dropdown",
        options: ["Plastic", "Fabric", "Paper", "Nylon"],
      },
      {
        key: "fallTime",
        label: "Predicted fall time (seconds)",
        placeholder: "Enter predicted fall time (seconds)",
        kind: "number",
      },
    ],
    dashboardVariables: [
      "Mass of toy (grams)",
      "Parachute diameter (cm)",
      "Material type",
      "Predicted fall time (seconds)",
    ],
    captureKind: "camera",
    captureIdleLabel: "READY",
    captureDoneLabel: "DONE",
    captureDoneStatusA: "Video Captured",
    captureDoneStatusB: "GPS Tagged",
    leaderboardSubtitle: "Grade 6 Rankings - Parachute Drop",
    showSlowMo: true,
    showRecordingTimer: true,
  },
  "decibel-detector": {
    id: "decibel-detector",
    title: "Decibel Detector",
    subtitle:
      "Measure and compare sound levels from different classroom actions.",
    hubDescription:
      "Measure and compare sound levels from different classroom actions.",
    requirements: [
      "Mobile phone with STEMM Lab app",
      "Classroom sound sources",
      "Measuring Tape",
    ],
    gear: ["Mobile phone with STEMM Lab app", "Measuring Tape"],
    safety: safetyDefault,
    decibelActions: [
      "Action 1 (e.g. dropping a book on the table)",
      "Action 2 (e.g. talking)",
      "Action 3 (e.g. stamping your feet)",
    ],
    predictionFields: [
      {
        key: "action1_pred",
        label: "Action 1 — louder or softer than quiet room?",
        placeholder: "Select prediction",
        kind: "dropdown",
        options: ["Louder", "Softer", "About the same"],
      },
      {
        key: "action2_pred",
        label: "Action 2 — louder or softer than Action 1?",
        placeholder: "Select prediction",
        kind: "dropdown",
        options: ["Louder", "Softer", "About the same"],
      },
      {
        key: "action3_pred",
        label: "Action 3 — louder or softer than Action 2?",
        placeholder: "Select prediction",
        kind: "dropdown",
        options: ["Louder", "Softer", "About the same"],
      },
      {
        key: "location",
        label: "Location / zone in classroom",
        placeholder: "e.g. front of room, back corner",
        kind: "text",
      },
    ],
    dashboardVariables: [
      "Action 1 (e.g. dropping a book on the table)",
      "Action 2 (e.g. talking)",
      "Action 3 (e.g. stamping your feet)",
      "Location / zone",
    ],
    captureKind: "decibel",
    captureIdleLabel: "—",
    captureDoneLabel: "—",
    captureDoneStatusA: "Sound levels captured",
    captureDoneStatusB: "Readings saved for all actions",
    leaderboardSubtitle: "Grade 6 Rankings - Sound Pollution Hunter",
  },
  "catapult-launch": {
    id: "catapult-launch",
    title: "Catapult Launch",
    subtitle: "Measure projectile distance and trajectory.",
    hubDescription: "Measure projectile distance and trajectory.",
    requirements: ["Catapult", "Projectile", "Measuring Tape"],
    gear: ["Catapult", "Projectile", "Measuring Tape", "Protractor"],
    safety: safetyDefault,
    predictionFields: [
      {
        key: "angle",
        label: "Launch angle (degrees)",
        placeholder: "Enter launch angle (degrees)",
        kind: "number",
      },
      {
        key: "mass",
        label: "Projectile mass (grams)",
        placeholder: "Enter projectile mass (grams)",
        kind: "number",
      },
      {
        key: "distance",
        label: "Predicted distance (meters)",
        placeholder: "Enter predicted distance (meters)",
        kind: "number",
      },
    ],
    dashboardVariables: [
      "Launch angle (degrees)",
      "Projectile mass (grams)",
      "Predicted distance (meters)",
    ],
    captureKind: "camera",
    captureIdleLabel: "READY",
    captureDoneLabel: "DONE",
    captureDoneStatusA: "Video Captured",
    captureDoneStatusB: "GPS Tagged",
    leaderboardSubtitle: "Grade 6 Rankings - Catapult Launch",
    showSlowMo: true,
  },
  "vibration-analysis": {
    id: "vibration-analysis",
    title: "Vibration Analysis",
    subtitle: "Measure vibration intensity on different surfaces.",
    hubDescription: "Measure vibration intensity on different surfaces.",
    requirements: ["Smartphone", "Various surfaces", "Vibration Sources"],
    gear: ["Various surfaces", "Smartphone", "Vibration sources"],
    safety: safetyDefault,
    predictionFields: [
      {
        key: "surface",
        label: "Surface material",
        placeholder: "Enter surface material",
        kind: "text",
      },
      {
        key: "vibeSource",
        label: "Vibration source",
        placeholder: "Enter vibration source",
        kind: "text",
      },
      {
        key: "level",
        label: "Predicted vibration level",
        placeholder: "Enter predicted vibration level",
        kind: "text",
      },
    ],
    dashboardVariables: [
      "Surface material",
      "Vibration source",
      "Predicted Vibration",
    ],
    captureKind: "vibration_hz",
    captureIdleLabel: "0 Hz",
    captureDoneLabel: "40 Hz",
    captureDoneStatusA: "Vibration Level Captured",
    captureDoneStatusB: "GPS Tagged",
    leaderboardSubtitle: "Grade 6 Rankings - Vibration Analysis",
  },
  "reaction-time": {
    id: "reaction-time",
    title: "Reaction Time",
    subtitle: "Test reflex speed with visual stimuli.",
    hubDescription: "Test reflex speed with visual stimuli.",
    requirements: ["Timer", "Smartphone"],
    gear: ["Timer", "Smartphone"],
    safety: safetyDefault,
    predictionFields: [
      {
        key: "member",
        label: "Team member name",
        placeholder: "Enter team member name",
        kind: "text",
      },
      {
        key: "rt",
        label: "Predicted reaction time (ms)",
        placeholder: "Enter predicted reaction time (ms)",
        kind: "number",
      },
    ],
    dashboardVariables: ["Team member name", "Predicted reaction time (ms)"],
    captureKind: "reaction",
    captureIdleLabel: "",
    captureDoneLabel: "",
    captureDoneStatusA: "Reaction time Captured",
    captureDoneStatusB: "GPS Tagged",
    leaderboardSubtitle: "Grade 6 Rankings - Reaction Time",
  },
  "surface-smoothness": {
    id: "surface-smoothness",
    title: "Surface Smoothness",
    subtitle: "Measure friction using accelerometer waveforms.",
    hubDescription: "Measure friction using accelerometer waveforms.",
    requirements: ["Various surfaces", "Smartphone", "Ruler"],
    gear: ["Various surfaces", "Smartphone", "Ruler"],
    safety: safetyDefault,
    predictionFields: [
      {
        key: "surface",
        label: "Surface type",
        placeholder: "Enter surface type",
        kind: "text",
      },
      {
        key: "friction",
        label: "Expected friction level (1-10)",
        placeholder: "Enter expected friction level (1-10)",
        kind: "number",
      },
    ],
    dashboardVariables: ["Surface type", "Expected Friction Level (1-10)"],
    captureKind: "waveform",
    captureIdleLabel: "",
    captureDoneLabel: "",
    captureDoneStatusA: "Waveform Captured",
    captureDoneStatusB: "GPS Tagged",
    leaderboardSubtitle: "Grade 6 Rankings - Surface Smoothness",
  },
  "breathing-pattern": {
    id: "breathing-pattern",
    title: "Breathing Pattern",
    subtitle: "Analyze breathing rate before and after exercise.",
    hubDescription: "Analyze breathing rate before and after exercise.",
    requirements: ["Timer", "Smartphone"],
    gear: ["Timer", "Smartphone"],
    safety: safetyDefault,
    predictionFields: [
      {
        key: "activity",
        label: "Activity type",
        placeholder: "Enter activity type",
        kind: "text",
      },
      {
        key: "bpm",
        label: "Predicted BPM",
        placeholder: "Enter predicted BPM",
        kind: "number",
      },
    ],
    dashboardVariables: ["Activity type", "Predicted BPM"],
    captureKind: "waveform",
    captureIdleLabel: "",
    captureDoneLabel: "",
    captureDoneStatusA: "Waveform Captured",
    captureDoneStatusB: "GPS Tagged",
    leaderboardSubtitle: "Grade 6 Rankings - Breathing Pattern",
  },
};

export const HUB_ACTIVITY_ORDER: ActivityId[] = [
  "parachute-drop",
  "decibel-detector",
  "catapult-launch",
  "vibration-analysis",
  "reaction-time",
  "surface-smoothness",
  "breathing-pattern",
];

export function getActivity(id: string): ActivityConfig | undefined {
  return ACTIVITIES[id as ActivityId];
}

export const LEADERBOARD_SAMPLE = [
  { rank: 1, team: "Science Squad", id: "#1234", score: 99 },
  { rank: 2, team: "Newton's Crew", id: "#2345", score: 98 },
  { rank: 3, team: "Lab Rats", id: "#3455", score: 97 },
  { rank: 4, team: "Atom Smashers", id: "#2233", score: 92 },
];
