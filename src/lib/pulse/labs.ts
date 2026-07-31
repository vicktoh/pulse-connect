/**
 * Sector ("Lab") and status vocabularies for the PULSE Community board.
 *
 * Sector colour is load-bearing: the same value drives the card's left rail,
 * the avatar tile, the sector tag and the sidebar activity bar. See DESIGN.md
 * §2 "Sector Signals".
 */

export const SECTORS = ["health", "education", "wash", "social", "debt"] as const
export type Sector = (typeof SECTORS)[number]

export const SUBMISSION_STATUSES = ["received", "review", "cited"] as const
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]

type LabMeta = {
  /** Short label used in tags and the sidebar. */
  label: string
  /** Full label used in the submission form. */
  formLabel: string
  icon: string
  /** Raw hex — sector colour is applied inline because it is data, not theme. */
  color: string
}

export const LABS: Record<Sector, LabMeta> = {
  health: {
    label: "Health",
    formLabel: "Health",
    icon: "🏥",
    color: "#E03020",
  },
  education: {
    label: "Education",
    formLabel: "Education",
    icon: "📚",
    color: "#004080",
  },
  wash: {
    label: "WASH",
    formLabel: "Water, Sanitation and Hygiene",
    icon: "💧",
    color: "#0891B2",
  },
  social: {
    label: "Social Protection",
    formLabel: "Social Protection",
    icon: "🛡️",
    color: "#7C3AED",
  },
  debt: {
    label: "Debt",
    formLabel: "Debt and Accountability",
    icon: "⚖️",
    color: "#F0A030",
  },
}

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  received: "Received",
  review: "Under Review",
  cited: "Cited by IBP",
}

/** Pill treatment per status: a 12%-opacity tint of the status' own colour. */
export const STATUS_CLASSES: Record<SubmissionStatus, string> = {
  received: "bg-paper-3 text-grey-light",
  review: "bg-amber/12 text-amber-dark",
  cited: "bg-verified/12 text-[#15803d]",
}

/** Active-state fill for a sector filter pill. */
export const LAB_FILTER_ACTIVE: Record<Sector, string> = {
  health: "bg-lab-health border-lab-health text-white",
  education: "bg-lab-education border-lab-education text-white",
  wash: "bg-lab-wash border-lab-wash text-white",
  social: "bg-lab-social border-lab-social text-white",
  // The one exception: amber never carries white text.
  debt: "bg-lab-debt border-lab-debt text-navy-midnight",
}
