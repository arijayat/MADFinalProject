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
  | "reaction"
  | "none";

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
  /** Vibration Analysis: test each earthquake-resistant design with accelerometer */
  vibrationDesignActions?: string[];
  /** Human Performance Lab: guided hand movements measured with accelerometer */
  movementActions?: string[];
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
    subtitle:
      "Record how air movement affects flexible materials and measure angles from video frames.",
    hubDescription:
      "Physics — test how fan design, material stiffness and distance affect bending using the app to record video and measure angles from slow-motion frames.",
    requirements: [
      "Mobile phone with STEMM Lab app",
      "Paper and cardboard (different stiffnesses)",
      "Scissors",
      "Sticky tape",
      "Measuring tape or ruler",
      "Marker",
      "Hand fan (paper or cardboard) or built fan designs",
    ],
    gear: [
      "Mobile phone with STEMM Lab app",
      "Various paper/cardboard samples",
      "Scissors, sticky tape",
      "Measuring tape or ruler",
      "Protractor or angle reference (optional)",
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
        label: "Predicted maximum bend angle (degrees)",
        placeholder: "Enter predicted bend angle (°)",
        kind: "number",
      },
    ],
    dashboardVariables: [
      "Fan design",
      "Material",
      "Distance from fan (cm)",
      "Predicted maximum bend angle (°)",
    ],
    captureKind: "camera",
    captureIdleLabel: "READY",
    captureDoneLabel: "DONE",
    captureDoneStatusA: "Video recording captured",
    captureDoneStatusB: "Angle measurements from frames saved",
    leaderboardSubtitle: "Grade 6 Rankings - Hand Fan Challenge",
    showSlowMo: true,
    showRecordingTimer: true,
  },
  "vibration-analysis": {
    id: "vibration-analysis",
    title: "Earthquake-Resistant Structure",
    subtitle:
      "Design earthquake-resistant platforms and measure how well they dampen vibrations with your phone sensors.",
    hubDescription:
      "Engineering + Earth Science: build dampening structures, then use the accelerometer and level sensor to compare stability during simulated earthquakes.",
    requirements: [
      "Mobile phone with STEMM Lab app",
      "Cardboard, paper, scissors, sticky tape",
      "Plastic or paper cups (4–6)",
      "Table or flat surface to shake gently",
    ],
    gear: [
      "Mobile phone with STEMM Lab app",
      "Cardboard and paper (accordion folds)",
      "Scissors and sticky tape",
      "Plastic or paper cups (4–6 pillars)",
      "Table or flat surface",
    ],
    safety: [
      ...safetyDefault,
      "Shake the table gently—do not lift, throw, or drop the structure.",
      "Keep the phone screen-up and centered on the cardboard platform during each test.",
      "Hold the phone steady only when checking level—not during vibration capture.",
    ],
    vibrationDesignActions: [
      "Design 1: 4 accordion folds + 4 pillars",
      "Design 2: 10 accordion folds + 4 pillars",
      "Design 3: Your best design (e.g. 3 folds + 6 pillars)",
    ],
    predictionFields: [
      {
        key: "design1_pred",
        label: "Design 1 — predicted max tilt (degrees)",
        placeholder: "How much will the phone tilt? e.g. 5",
        kind: "number",
      },
      {
        key: "design2_pred",
        label: "Design 2 — predicted max tilt (degrees)",
        placeholder: "More folds — less movement?",
        kind: "number",
      },
      {
        key: "design3_desc",
        label: "Design 3 — describe your structure",
        placeholder: "e.g. 3 folds + 6 pillars, extra cardboard layer",
        kind: "text",
      },
      {
        key: "design3_pred",
        label: "Design 3 — predicted max tilt (degrees)",
        placeholder: "Your best design prediction",
        kind: "number",
      },
      {
        key: "mostStable",
        label: "Which design will move the least?",
        placeholder: "Select prediction",
        kind: "dropdown",
        options: ["Design 1", "Design 2", "Design 3"],
      },
    ],
    dashboardVariables: [
      "Design 1: 4 folds + 4 pillars",
      "Design 2: 10 folds + 4 pillars",
      "Design 3: Your best design",
      "Most stable design (prediction)",
    ],
    captureKind: "vibration_hz",
    captureIdleLabel: "—",
    captureDoneLabel: "—",
    captureDoneStatusA: "Vibration readings captured",
    captureDoneStatusB: "Level & tilt data saved for all designs",
    leaderboardSubtitle: "Grade 6 Rankings - Vibration Analysis",
  },
  "surface-smoothness": {
    id: "surface-smoothness",
    title: "Human Performance Lab",
    subtitle:
      "Stretch Speed & Gracefulness — measure movement smoothness with your phone’s vibration sensor (Medical Science + Biomechanics).",
    hubDescription:
      "Investigate how the body moves by measuring speed, smoothness, and coordination during controlled stretching and hand movements.",
    requirements: [
      "Mobile phone with STEMM Lab app",
      "Open space to move safely",
    ],
    gear: [
      "Mobile phone with STEMM Lab app",
      "Open space to move safely",
    ],
    safety: [
      ...safetyDefault,
      "Hold the phone firmly—do not swing it near other people or objects.",
      "Move slowly and stay in an open area with enough room for arm movements.",
      "Stop immediately if you feel pain or dizziness.",
    ],
    movementActions: [
      "Movement 1: Circle / figure-8 (rotate hand while holding phone)",
      "Movement 2: Up and down",
      "Movement 3: Side to side",
    ],
    predictionFields: [
      {
        key: "move1_pred",
        label: "Movement 1 — predicted vibration (absolute)",
        placeholder: "e.g. low, medium, or a number",
        kind: "text",
      },
      {
        key: "move2_pred",
        label: "Movement 2 — predicted vibration (absolute)",
        placeholder: "e.g. low, medium, or a number",
        kind: "text",
      },
      {
        key: "move3_pred",
        label: "Movement 3 — predicted vibration (absolute)",
        placeholder: "e.g. low, medium, or a number",
        kind: "text",
      },
      {
        key: "hardest_move",
        label: "Which movement will be hardest to keep vibration low?",
        placeholder: "Select prediction",
        kind: "dropdown",
        options: ["Movement 1", "Movement 2", "Movement 3"],
      },
      {
        key: "attempt1_pred",
        label: "Attempt 1 — predict smoothness outcome",
        placeholder: "e.g. ±1 cm",
        kind: "text",
      },
      {
        key: "attempt2_pred",
        label: "Attempt 2 — predict outcome (time + movement)",
        placeholder: "e.g. 5 mm in 20 seconds",
        kind: "text",
      },
      {
        key: "attempt3_pred",
        label: "Attempt 3 — predict outcome (time + movement)",
        placeholder: "e.g. 5 mm in 5 seconds",
        kind: "text",
      },
    ],
    dashboardVariables: [
      "Movement 1: Circle / figure-8",
      "Movement 2: Up and down",
      "Movement 3: Side to side",
      "Hardest to keep vibration low (prediction)",
      "Attempt 1 smoothness",
      "Attempt 2 (time + movement)",
      "Attempt 3 (time + movement)",
    ],
    captureKind: "vibration_hz",
    captureIdleLabel: "—",
    captureDoneLabel: "—",
    captureDoneStatusA: "Movement vibrations captured",
    captureDoneStatusB: "Speed & smoothness readings saved",
    leaderboardSubtitle: "Grade 6 Rankings - Human Performance Lab",
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
  "surface-smoothness",
  "reaction-time",
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
