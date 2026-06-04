/** Reference text for Parachute Drop — shown from intro via “See description”. */
export const PARACHUTE_DESCRIPTION_SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Overview",
    body: [
      "Design, build, and test parachutes to see how they slow a falling toy and reduce impact force.",
      "You will compare a baseline drop (no parachute) with two parachute designs, then check your predictions against measured fall times.",
    ],
  },
  {
    title: "Equipment",
    body: [
      "Small toy (e.g. army figurine)",
      "Table or elevated drop point",
      "Paper or plastic, string, scissors, tape",
      "Measuring tape or ruler",
    ],
  },
  {
    title: "Steps",
    body: [
      "Measure drop height (table edge to floor) and toy mass.",
      "Action 1: Drop the toy with no parachute (baseline).",
      "Action 2: Plastic canopy with four corners tied to the toy.",
      "Action 3: Build and test your best parachute design.",
      "Record each drop with the app camera, then enter fall time and landing details from slow-motion review.",
      "Compare predictions vs results and reflect on drag and g-force.",
    ],
  },
  {
    title: "Discussion (plain language)",
    body: [
      "Gravity pulls objects downward. A parachute increases air resistance (drag), which acts upward and slows the fall.",
      "A slower fall usually means a softer landing. Engineers improve designs by testing and redesigning.",
    ],
  },
  {
    title: "Forces & calculations (summary)",
    body: [
      "Weight = mass × g. Net force = weight − drag. Net force = mass × acceleration.",
      "From drop height and fall time: final velocity = distance ÷ time; acceleration = velocity ÷ time.",
      "Drag force ≈ weight − net force. G-force on landing uses impact speed and contact time (and rebound if the toy bounces).",
    ],
  },
  {
    title: "Curriculum links",
    body: [
      "Science: ACSSU076 / ACSSU117 — Forces affect motion; ACSIS124 — Planning investigations; ACSIS126 — Analysing data.",
      "Design & Technologies: ACTDEP036 — Generate, test, and improve solutions.",
      "Mathematics: ACMMG108 — Measuring speed; ACMSP147 — Comparing data and averages.",
    ],
  },
];
