export type ActivityId =
  | "parachute-drop"
  | "decibel-detector"
  | "hand-fan-challenge"
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
  /** Parachute Drop: record each design drop with the phone camera */
  parachuteDropActions?: string[];
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
    subtitle:
      "Design, build, and test parachutes—use your phone camera to time the fall and slow-motion landing.",
    hubDescription:
      "Engineering + physics: compare baseline and parachute drops, then calculate drag and g-force from video.",
    requirements: [
      "Mobile phone with STEMM Lab app",
      "Small toy (e.g. army figurine)",
      "Table or elevated drop point",
      "Paper or plastic, string, scissors, tape",
      "Measuring tape or ruler",
    ],
    gear: [
      "Mobile phone with STEMM Lab app",
      "Small toy (army figurine or similar)",
      "Table or elevated surface",
      "Paper or plastic (canopy)",
      "String, scissors, and tape",
      "Measuring tape or ruler",
    ],
    safety: [
      ...safetyDefault,
      "Drop only over a clear floor area with no people underneath.",
      "Use slow-motion video only to measure times—do not throw objects at anyone.",
    ],
    parachuteDropActions: [
      "Action 1: No parachute (baseline)",
      "Action 2: Plastic canopy, four corners tied to toy",
      "Action 3: Your best parachute design",
    ],
    predictionFields: [
      {
        key: "dropHeight",
        label: "Drop height (meters)",
        placeholder: "Measure from table edge to floor",
        kind: "number",
      },
      {
        key: "mass",
        label: "Mass of toy (grams)",
        placeholder: "e.g. 200",
        kind: "number",
      },
      {
        key: "action1_pred",
        label: "Action 1 — predicted fall time (s), no parachute",
        placeholder: "How long until first hit the ground?",
        kind: "number",
      },
      {
        key: "action2_pred",
        label: "Action 2 — predicted fall time (s), plastic design",
        placeholder: "How long until first hit the ground?",
        kind: "number",
      },
      {
        key: "action3_design",
        label: "Action 3 — describe your parachute design",
        placeholder: "e.g. larger nylon canopy, 6 strings",
        kind: "text",
      },
      {
        key: "action3_pred",
        label: "Action 3 — predicted fall time (seconds)",
        placeholder: "How long until first hit the ground?",
        kind: "number",
      },
      {
        key: "bounce",
        label: "Do you expect the toy to bounce on landing?",
        placeholder: "Select",
        kind: "dropdown",
        options: ["No bounce", "Bounce"],
      },
    ],
    dashboardVariables: [
      "Drop height (m)",
      "Mass of toy (g)",
      "Action 1: No parachute (baseline)",
      "Action 2: Plastic canopy design",
      "Action 3: Your best design",
      "Bounce on landing?",
    ],
    captureKind: "camera",
    captureIdleLabel: "READY",
    captureDoneLabel: "DONE",
    captureDoneStatusA: "Drop videos captured",
    captureDoneStatusB: "Fall & impact times saved",
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
  "hand-fan-challenge": {
    id: "hand-fan-challenge",
    title: "Hand Fan Challenge",
    subtitle: "Investigate how air movement affects flexible materials.",
    hubDescription:
      "Physics — test how fan design, material stiffness and distance affect bending using your phone camera.",
    requirements: [
      "Mobile phone with STEMM Lab app (camera + slow-motion)",
      "Paper and cardboard (different stiffnesses)",
      "Scissors",
      "Sticky tape",
      "Measuring tape or ruler",
      "Marker",
      "Hand fan (paper or cardboard) or built fan designs",
    ],
    gear: [
      "Mobile phone with STEMM Lab app (camera)",
      "Various paper/cardboard samples",
      "Scissors, sticky tape",
      "Measuring tape or ruler",
      "Protractor or angle app (optional)",
    ],
    safety: [
      ...safetyDefault,
      "Do not aim fans at people's faces or eyes.",
      "Keep fingers away from sharp edges when cutting materials.",
    ],
    predictionFields: [
      {
        key: "fanDesign",
        label: "Fan design",
        placeholder: "Describe your fan (folds, size, holes)",
        kind: "text",
      },
      {
        key: "material",
        label: "Material",
        placeholder: "e.g. thin printer paper, card stock",
        kind: "dropdown",
        options: [
          "Thin printer paper",
          "Standard card stock",
          "Thin cardboard",
          "Corrugated cardboard",
        ],
      },
      {
        key: "distance",
        label: "Distance from fan (cm)",
        placeholder: "Enter distance in cm",
        kind: "number",
      },
      {
        key: "predictedBend",
        label: "Predicted bend angle (degrees)",
        placeholder: "Enter predicted bend angle (°)",
        kind: "number",
      },
    ],
    dashboardVariables: [
      "Fan design",
      "Material",
      "Distance from fan (cm)",
      "Predicted bend angle (°)",
    ],
    captureKind: "camera",
    captureIdleLabel: "READY",
    captureDoneLabel: "DONE",
    captureDoneStatusA: "Video captured",
    captureDoneStatusB: "Bend measurement saved",
    leaderboardSubtitle: "Grade 6 Rankings - Hand Fan Challenge",
    showSlowMo: true,
    showRecordingTimer: true,
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
  "hand-fan-challenge",
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
