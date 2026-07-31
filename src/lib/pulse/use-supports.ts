"use client"

import { useCallback, useEffect, useState } from "react"
import {
  collection,
  doc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore"

import { useFirebaseAuth } from "@/lib/firebase/auth-provider"
import { db } from "@/lib/firebase/client"

/**
 * "I have seen this too".
 *
 * Each toggle is a single atomic batch carrying both halves: the ledger
 * document at supports/{submissionId}_{uid} and the ±1 on supportCount.
 * firestore.rules refuses to move the counter unless the matching ledger
 * document appears (+1) or disappears (-1) in the same write, which is what
 * makes the count trustworthy without Cloud Functions.
 *
 * No optimistic state is kept here: Firestore's latency compensation already
 * applies the pending write to the local snapshot, so the number moves
 * instantly and rolls back on its own if the server rejects the batch.
 */
const NO_SUPPORTS: ReadonlySet<string> = new Set()

export function useSupports() {
  const { user, ensureAnonymous } = useFirebaseAuth()
  // The ledger is stamped with the uid it belongs to, so signing out or
  // switching accounts empties it during render rather than via an effect.
  const [ledger, setLedger] = useState<{
    uid: string
    ids: ReadonlySet<string>
  } | null>(null)
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    // A returning visitor's anonymous session is restored from IndexedDB, so
    // their support survives a reload — which the old in-memory Set did not.
    const ledgerQuery = query(
      collection(db, "supports"),
      where("uid", "==", user.uid)
    )

    return onSnapshot(
      ledgerQuery,
      (snapshot) => {
        setLedger({
          uid: user.uid,
          ids: new Set(
            snapshot.docs.map((d) => d.data().submissionId as string)
          ),
        })
      },
      (listenError) => {
        console.error("PULSE supports listener failed:", listenError)
      }
    )
  }, [user])

  const supported =
    user && ledger?.uid === user.uid ? ledger.ids : NO_SUPPORTS

  const toggleSupport = useCallback(
    async (submissionId: string) => {
      if (pending.has(submissionId)) return

      setPending((prev) => new Set(prev).add(submissionId))
      setError(null)

      try {
        const visitor = await ensureAnonymous()
        const ledgerRef = doc(
          db,
          "supports",
          `${submissionId}_${visitor.uid}`
        )
        const submissionRef = doc(db, "submissions", submissionId)
        const isSupported = supported.has(submissionId)

        const batch = writeBatch(db)
        if (isSupported) {
          batch.delete(ledgerRef)
          batch.update(submissionRef, { supportCount: increment(-1) })
        } else {
          batch.set(ledgerRef, {
            submissionId,
            uid: visitor.uid,
            createdAt: serverTimestamp(),
          })
          batch.update(submissionRef, { supportCount: increment(1) })
        }
        await batch.commit()
      } catch (commitError) {
        console.error("PULSE support write failed:", commitError)
        setError("We could not record that just now. Please try again.")
      } finally {
        setPending((prev) => {
          const next = new Set(prev)
          next.delete(submissionId)
          return next
        })
      }
    },
    [ensureAnonymous, pending, supported]
  )

  return { supported, pending, toggleSupport, supportError: error }
}
