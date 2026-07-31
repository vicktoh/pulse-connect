"use client"

import { useCallback, useEffect, useState } from "react"
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore"

import { db } from "@/lib/firebase/client"
import { submissionConverter } from "@/lib/firebase/converters"
import type { Submission } from "./submissions"

export type FeedState = "loading" | "ready" | "error"

/**
 * One live query for the whole board. Filtering and sorting stay client-side
 * on purpose:
 *   - Activity by Lab must count all five sectors regardless of the active
 *     filter, so a server-side sector filter would make it impossible.
 *   - The hero counts are over the whole approved set, not the filtered view.
 *   - Moving the permutations into Firestore would need eight composite
 *     indexes (sector x status x sort) for no gain at this volume.
 *
 * The `where` clause is not optional: rules reject any query they cannot prove
 * safe, so a listener without it is denied outright rather than filtered.
 */
export function useSubmissionsFeed() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [state, setState] = useState<FeedState>("loading")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const feed = query(
      collection(db, "submissions").withConverter(submissionConverter),
      where("moderation", "==", "approved"),
      orderBy("createdAt", "desc"),
      limit(200)
    )

    return onSnapshot(
      feed,
      (snapshot) => {
        setSubmissions(snapshot.docs.map((doc) => doc.data()))
        setState("ready")
      },
      (error) => {
        console.error("PULSE feed listener failed:", error)
        setState("error")
      }
    )
  }, [attempt])

  const retry = useCallback(() => {
    setState("loading")
    setAttempt((n) => n + 1)
  }, [])

  return { submissions, state, retry }
}
