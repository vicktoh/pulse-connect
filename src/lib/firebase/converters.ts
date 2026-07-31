import {
  Timestamp,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from "firebase/firestore"

import type { Sector, SubmissionStatus } from "@/lib/pulse/labs"
import type {
  ModerationState,
  Submission,
  SubmissionContact,
} from "@/lib/pulse/submissions"

/**
 * A pending `serverTimestamp()` reads back as null in the local snapshot until
 * the server acknowledges the write, so a freshly submitted document briefly
 * has no createdAt. Falling back to now keeps sorting stable for that instant.
 */
function toDate(value: unknown): Date {
  return value instanceof Timestamp ? value.toDate() : new Date()
}

function toDateOrNull(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null
}

/**
 * The single place the Firestore wire shape meets the app type: document id
 * becomes `id`, Timestamps become Dates.
 */
export const submissionConverter: FirestoreDataConverter<Submission> = {
  toFirestore(submission) {
    // Writes go through explicit batch payloads (see submit-dialog and the
    // admin queue) so that each one matches the key whitelist in
    // firestore.rules exactly. This path is unused.
    return submission as DocumentData
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): Submission {
    const data = snapshot.data()
    return {
      id: snapshot.id,
      name: (data.name as string) ?? "",
      role: (data.role as string) ?? "",
      org: (data.org as string) ?? "",
      sector: data.sector as Sector,
      status: (data.status as SubmissionStatus) ?? "received",
      moderation: (data.moderation as ModerationState) ?? "pending",
      observed: (data.observed as string) ?? "",
      changed: (data.changed as string) ?? "",
      supportCount: (data.supportCount as number) ?? 0,
      createdAt: toDate(data.createdAt),
      publishedAt: toDateOrNull(data.publishedAt),
      ibpResponse: (data.ibpResponse as string | null) ?? null,
      authorUid: (data.authorUid as string) ?? "",
    }
  },
}

export const submissionContactConverter: FirestoreDataConverter<SubmissionContact> =
  {
    toFirestore(contact) {
      return contact as DocumentData
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): SubmissionContact {
      const data = snapshot.data()
      return {
        email: (data.email as string) ?? "",
        submissionId: (data.submissionId as string) ?? snapshot.id,
        authorUid: (data.authorUid as string) ?? "",
        createdAt: toDate(data.createdAt),
      }
    },
  }
