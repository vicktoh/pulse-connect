export type EventStatus = "draft" | "live" | "closed"
export type EventExperience = "lobby" | "poll" | "wordcloud" | "leaderboard" | "tracker" | "prediction"
export type PromptType = "poll" | "wordcloud" | "prediction"
export type TrackerViewMode = "overview" | "lab" | "commitment" | "newest"

export type LabId = "health" | "water" | "education" | "social-protection" | "debt-accountability"
export type CommitmentStatus = "draft" | "review" | "published" | "withdrawn"
export type VerifiedStatus = "stalled" | "progressing" | "completed"
export type ReformSignalType = "committed-action" | "reform-opportunity" | "advocacy-priority" | "evidence-gap"
export type ConfirmationStatus = "yes" | "no" | "requires-confirmation"
export type TrackerReadiness = "ready" | "hold"

export type LabDefinition = {
  id: LabId
  name: string
  shortName: string
  icon: string
  accent: string
}

export const LABS: LabDefinition[] = [
  { id: "health", name: "Health", shortName: "Health", icon: "✚", accent: "#ff654f" },
  { id: "water", name: "Water", shortName: "Water", icon: "◒", accent: "#13c8d5" },
  { id: "education", name: "Education", shortName: "Education", icon: "A+", accent: "#f5aa2c" },
  { id: "social-protection", name: "Social Protection", shortName: "Social", icon: "♥", accent: "#a960ff" },
  { id: "debt-accountability", name: "Debt & Accountability", shortName: "Debt", icon: "₦", accent: "#9ce13b" },
]

export const PREDICTION_OPTIONS = [
  { id: "stalled", label: "Will stall" },
  { id: "progressing", label: "Will move" },
  { id: "completed", label: "Will be completed" },
] as const

export type EventSession = {
  id: string
  name: string
  code: string
  status: EventStatus
  activeExperience: EventExperience
  activePromptId: string | null
  trackerViewMode: TrackerViewMode
  trackerLab: LabId | null
  trackerCommitmentId: string | null
}

export type EventParticipant = {
  uid: string
  name: string
  sessionId: string
}

export type EventScore = {
  participantId: string
  participantName: string
  gameId: GameId
  score: number
}

export type LivePrompt = {
  id: string
  type: PromptType
  question: string
  options: { id: string; label: string }[]
  status: "active" | "closed"
  commitmentId: string | null
  countdownEndsAtMs: number | null
}

export type LiveResponse = {
  id: string
  promptId: string
  type: PromptType
  optionId: string | null
  word: string | null
  visible: boolean
}

export type PredictionSummary = {
  promptId: string
  stalled: number
  progressing: number
  completed: number
  total: number
}

export type ReformCommitment = {
  id: string
  lab: LabId
  signalNumber: number
  signalCode: string
  problem: string
  publicChange: string
  signalType: ReformSignalType
  statement: string
  leadActor: string
  confirmationStatus: ConfirmationStatus
  confirmationNote: string
  intendedOutcome: string
  milestoneDate: string
  evidenceOfProgress: string
  trackerReadiness: TrackerReadiness
  readBackConfirmed: boolean
  outstandingItems: string
  status: CommitmentStatus
  headline: boolean
  revision: number
  actualStatus: VerifiedStatus | null
  evidenceNote: string
  evidenceSources: string[]
  predictionSummary: PredictionSummary | null
  createdAtMs: number
  updatedAtMs: number
}

export type TrackerVote = {
  id: string
  commitmentId: string
  choice: VerifiedStatus
}

export type GameId =
  | "follow-the-naira"
  | "budget-or-bluff"
  | "look-again"
  | "four-pics-one-word"

export type GameDefinition = {
  id: GameId
  title: string
  strapline: string
  description: string
  href: string
  accent: string
  icon: string
  maxScore: number
  duration: string
}

export const GAME_CATALOG: GameDefinition[] = [
  {
    id: "follow-the-naira",
    title: "Follow the Naira",
    strapline: "Can the money reach the people?",
    description: "Navigate releases, procurement and last-mile delivery.",
    href: "/games/follow-the-naira",
    accent: "#13c8d5",
    icon: "₦",
    maxScore: 5000,
    duration: "3 min",
  },
  {
    id: "budget-or-bluff",
    title: "Budget or Bluff?",
    strapline: "Fact-check the confident claims.",
    description: "Spot the facts, spin and spectacular budget bluffs.",
    href: "/games/budget-or-bluff",
    accent: "#ff654f",
    icon: "!",
    maxScore: 8000,
    duration: "4 min",
  },
  {
    id: "look-again",
    title: "Look Again",
    strapline: "The problem is hiding in plain sight.",
    description: "Inspect public services and tap what is not working.",
    href: "/games/look-again",
    accent: "#a960ff",
    icon: "◎",
    maxScore: 1000,
    duration: "2 min",
  },
  {
    id: "four-pics-one-word",
    title: "Four Pics, One Word",
    strapline: "Connect the public-finance clues.",
    description: "Build four summit words before the clock runs out.",
    href: "/games/four-pics-one-word",
    accent: "#9ce13b",
    icon: "4",
    maxScore: 3000,
    duration: "3 min",
  },
]

export const GAME_MAX_SCORES = Object.fromEntries(
  GAME_CATALOG.map((game) => [game.id, game.maxScore]),
) as Record<GameId, number>
