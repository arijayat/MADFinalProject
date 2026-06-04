/** Reference text for Human Performance Lab — shown via “See description”. */
export const PERFORMANCE_DESCRIPTION_SECTIONS: {
  title: string;
  body: string[];
}[] = [
  {
    title: "Overview",
    body: [
      "Investigate how the human body moves by measuring speed, smoothness, and coordination during controlled stretching activities.",
      "Hold the device in one hand while performing guided movements; the app records vibration (m/s²) and time.",
    ],
  },
  {
    title: "Equipment",
    body: ["Open space to move safely"],
  },
  {
    title: "Steps",
    body: [
      "Hold the device firmly in one hand and unlock the vibration sensor.",
      "Movement 1: Rotate your hand in a circle, then a figure-8.",
      "Movement 2: Move your arm up and down steadily.",
      "Movement 3: Move your arm side to side steadily.",
      "Attempt 1: Perform all three movements slowly (no buzz feedback).",
      "Attempt 2: Repeat with vibration feedback when movement is not smooth.",
      "Compare predictions with measured peak vibration and duration.",
    ],
  },
  {
    title: "Write-up prompts",
    body: [
      "Which movement was hardest to keep vibration low?",
      "Were you right? Any surprises?",
    ],
  },
  {
    title: "Discussion (plain language)",
    body: [
      "Muscles and joints work together to create movement.",
      "Faster movements often reduce control; smoother movements show better coordination.",
      "The accelerometer measures how quickly and smoothly the body moves.",
    ],
  },
  {
    title: "Curriculum links",
    body: [
      "ACPPS051 — Movement skills",
      "ACPPS054 — Physical performance",
      "ACSSU176 — Structure and function of body systems",
    ],
  },
];
