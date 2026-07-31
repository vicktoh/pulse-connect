import type { Sector, SubmissionStatus } from "./labs"

/**
 * Internal visibility gate, deliberately separate from the public `status`
 * vocabulary. `status` drives the pill a reader sees; `moderation` decides
 * whether they see the submission at all. Collapsing the two would either leak
 * a pending state into the public pill or lose the ability to have an
 * approved-but-not-yet-reviewed account.
 */
export const MODERATION_STATES = ["pending", "approved", "rejected"] as const
export type ModerationState = (typeof MODERATION_STATES)[number]

export type Submission = {
  /** Firestore document id. */
  id: string
  name: string
  role: string
  org: string
  sector: Sector
  status: SubmissionStatus
  moderation: ModerationState
  /** "What I observed" — max 400 chars. */
  observed: string
  /** "What changed it or could change it" — max 400 chars. */
  changed: string
  supportCount: number
  createdAt: Date
  publishedAt: Date | null
  /** Written by IBP staff only; enforced in firestore.rules. */
  ibpResponse: string | null
  authorUid: string
}

/**
 * The submitter's email never appears on a Submission — it lives in a separate
 * `submissionContacts/{submissionId}` document that only an admin can read,
 * because Firestore rules gate whole documents, not fields.
 */
export type SubmissionContact = {
  email: string
  submissionId: string
  authorUid: string
  createdAt: Date
}

/**
 * "12 July 2026". Pinned to UTC so the calendar day is identical for every
 * reader and cannot drift between a server render and a client hydration.
 */
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

export function formatSubmissionDate(date: Date) {
  return dateFormatter.format(date)
}
