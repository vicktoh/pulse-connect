"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore"
import { FirebaseError } from "firebase/app"

import { useFirebaseAuth } from "@/lib/firebase/auth-provider"
import { db } from "@/lib/firebase/client"
import { parseEventSession } from "@/lib/events/parse-event-session"
import {
  GAME_MAX_SCORES,
  type EventParticipant,
  type EventSession,
  type GameId,
} from "@/lib/events/types"

const STORAGE_KEY = "pulse-event-player"

type JoinResult = { ok: true } | { ok: false; message: string }

type EventPlayerValue = {
  playerReady: boolean
  participant: EventParticipant | null
  session: EventSession | null
  joinSession: (name: string, sessionHint?: string | null) => Promise<JoinResult>
  leaveSession: () => void
  submitScore: (gameId: GameId, score: number) => Promise<"saved" | "unchanged">
}

const EventPlayerContext = createContext<EventPlayerValue | null>(null)

export function EventPlayerProvider({ children }: { children: React.ReactNode }) {
  const { authReady, ensureAnonymous } = useFirebaseAuth()
  const [participant, setParticipant] = useState<EventParticipant | null>(null)
  const [session, setSession] = useState<EventSession | null>(null)
  const [playerReady, setPlayerReady] = useState(false)

  useEffect(() => {
    if (!authReady) return
    let active = true
    window.queueMicrotask(() => {
      if (!active) return
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        try {
          const stored = JSON.parse(raw) as EventParticipant
          if (!stored.uid || !stored.name || !stored.sessionId) throw new Error("invalid")
          setParticipant(stored)
        } catch {
          window.localStorage.removeItem(STORAGE_KEY)
        }
      }
      setPlayerReady(true)
    })
    return () => { active = false }
  }, [authReady])

  useEffect(() => {
    if (!participant) return

    return onSnapshot(
      doc(db, "events", participant.sessionId),
      (snapshot) => {
        setSession(snapshot.exists() ? parseEventSession(snapshot.id, snapshot.data()) : null)
      },
      () => setSession(null),
    )
  }, [participant])

  const joinSession = useCallback(
    async (rawName: string, rawSessionHint?: string | null): Promise<JoinResult> => {
      const name = rawName.trim().replace(/\s+/g, " ")
      if (name.length < 2) return { ok: false, message: "Enter the name you want on the leaderboard." }

      try {
        const sessionHint = rawSessionHint?.trim().toUpperCase() || null
        let eventSnapshot

        if (sessionHint) {
          const hintedEvent = await getDoc(doc(db, "events", sessionHint))
          if (!hintedEvent.exists()) return { ok: false, message: "This event link is no longer available." }
          eventSnapshot = hintedEvent
        } else {
          const liveEvents = await getDocs(query(
            collection(db, "events"),
            where("status", "==", "live"),
            limit(1),
          ))
          eventSnapshot = liveEvents.docs[0]
          if (!eventSnapshot) return { ok: false, message: "The live room has not opened yet. Please try again shortly." }
        }

        const event = parseEventSession(eventSnapshot.id, eventSnapshot.data())
        if (event.status !== "live") return { ok: false, message: "This live room has already closed." }

        const user = await ensureAnonymous()
        const nextParticipant: EventParticipant = {
          uid: user.uid,
          name: name.slice(0, 40),
          sessionId: event.id,
        }

        await setDoc(
          doc(db, "events", event.id, "participants", user.uid),
          {
            uid: user.uid,
            name: nextParticipant.name,
            joinedAt: serverTimestamp(),
            lastSeenAt: serverTimestamp(),
          },
          { merge: true },
        )

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextParticipant))
        setParticipant(nextParticipant)
        setSession(event)
        return { ok: true }
      } catch (error) {
        if (error instanceof FirebaseError) {
          if (error.code === "permission-denied") {
            return { ok: false, message: "The live room is being prepared. Please refresh and try again." }
          }
          if (error.code === "auth/operation-not-allowed") {
            return { ok: false, message: "Anonymous event access is not enabled yet." }
          }
          if (error.code === "unavailable") {
            return { ok: false, message: "The network is unavailable. Check your connection and try again." }
          }
        }
        return { ok: false, message: "We could not join the live room. Please try again." }
      }
    },
    [ensureAnonymous],
  )

  const leaveSession = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    setParticipant(null)
    setSession(null)
  }, [])

  const submitScore = useCallback(
    async (gameId: GameId, rawScore: number) => {
      if (!participant) return "unchanged" as const
      const score = Math.max(0, Math.min(Math.round(rawScore), GAME_MAX_SCORES[gameId]))
      const scoreRef = doc(
        db,
        "events",
        participant.sessionId,
        "scores",
        `${participant.uid}_${gameId}`,
      )

      return runTransaction(db, async (transaction) => {
        const current = await transaction.get(scoreRef)
        if (current.exists() && Number(current.data().score) >= score) return "unchanged" as const
        transaction.set(scoreRef, {
          participantId: participant.uid,
          participantName: participant.name,
          gameId,
          score,
          playedAt: serverTimestamp(),
        })
        return "saved" as const
      })
    },
    [participant],
  )

  const value = useMemo(
    () => ({ playerReady, participant, session, joinSession, leaveSession, submitScore }),
    [playerReady, participant, session, joinSession, leaveSession, submitScore],
  )

  return <EventPlayerContext.Provider value={value}>{children}</EventPlayerContext.Provider>
}

export function useEventPlayer() {
  const value = useContext(EventPlayerContext)
  if (!value) throw new Error("useEventPlayer must be used inside EventPlayerProvider")
  return value
}
