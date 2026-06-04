/** Reference text for Hand Fan Challenge — shown from intro via “See description”. */
export const FAN_DESCRIPTION_SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Overview",
    body: [
      "Test how air movement from hand fans affects flexible materials.",
      "Record video at 15 cm, 30 cm, and 45 cm, then measure maximum bend angles in slow motion.",
    ],
  },
  {
    title: "Equipment",
    body: [
      "Paper and cardboard (different stiffnesses)",
      "Scissors and sticky tape",
      "Measuring tape or ruler",
      "Marker (optional)",
      "Hand fan (paper or cardboard) or built fan designs",
    ],
  },
  {
    title: "Steps",
    body: [
      "Stand a paper strip upright on the table (e.g. 3 cm × 10 cm, taped at the fold).",
      "Wave the fan for about 20 seconds at 15 cm, then 30 cm, then 45 cm.",
      "Record each trial with the app camera; capture both the fan wave and vertical paper movement.",
      "Review in slow motion and enter the maximum bend angle at each distance.",
      "Repeat with stiffer cardboard and compare results.",
    ],
  },
  {
    title: "Write-up prompts",
    body: [
      "Predict which fan design moves the paper the most.",
      "How does material stiffness affect bend angle?",
      "How does fan design influence air movement?",
      "How does distance from the fan affect bending?",
    ],
  },
  {
    title: "Force estimate (classroom model)",
    body: [
      "Moving air applies force; flexible paper bends. Approximate: F ≈ k × θ",
      "F = force (N), k = stiffness (N/rad) from material table, θ = bend angle in radians.",
      "Example: thin paper k = 0.05, 30° ≈ 0.524 rad → F ≈ 0.026 N.",
      "Stiffer materials need more force for the same angle.",
    ],
  },
  {
    title: "Stiffness k (N/rad) — classroom values",
    body: [
      "Thin printer paper: 0.05",
      "Standard card stock: 0.2",
      "Thin cardboard: 0.5",
      "Corrugated cardboard: 2.5 (mid-range of 2–3)",
    ],
  },
  {
    title: "Curriculum links",
    body: ["ACSSU076 — Forces and motion"],
  },
];
