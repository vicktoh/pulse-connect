"use client"

import { useEffect, useMemo, useState } from "react"
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore"

import { db } from "@/lib/firebase/client"
import { parseEventSession } from "@/lib/events/parse-event-session"
import { GAME_MAX_SCORES } from "@/lib/events/types"
import type {
  EventScore,
  GameId,
  LivePrompt,
  LiveResponse,
  EventSession,
} from "@/lib/events/types"

export function useEventSessions(enabled = true) {
  const [sessions, setSessions] = useState<EventSession[]>([])
  useEffect(() => {
    if (!enabled) return
    const sessionQuery = query(collection(db, "events"), orderBy("createdAt", "desc"), limit(20))
    return onSnapshot(sessionQuery, (snapshot) => {
      setSessions(snapshot.docs.map((item) => parseEventSession(item.id, item.data())))
    })
  }, [enabled])
  return sessions
}

export type LeaderboardEntry = {
  participantId: string
  name: string
  total: number
  games: Partial<Record<GameId, number>>
}

export function useEventLeaderboard(sessionId: string | null) {
  const [snapshotState, setSnapshotState] = useState<{ sessionId: string; scores: EventScore[] } | null>(null)

  useEffect(() => {
    if (!sessionId) return
    return onSnapshot(
      collection(db, "events", sessionId, "scores"),
      (snapshot) => {
        setSnapshotState({
          sessionId,
          scores: snapshot.docs.map((item) => {
            const data = item.data()
            return {
              participantId: String(data.participantId ?? ""),
              participantName: String(data.participantName ?? "Player"),
              gameId: data.gameId as GameId,
              score: Number(data.score ?? 0),
            }
          }),
        })
      },
      () => setSnapshotState({ sessionId, scores: [] }),
    )
  }, [sessionId])

  const scores = useMemo(
    () => snapshotState?.sessionId === sessionId ? snapshotState.scores : [],
    [sessionId, snapshotState],
  )
  const loading = Boolean(sessionId) && snapshotState?.sessionId !== sessionId

  const leaderboard = useMemo(() => {
    const players = new Map<string, LeaderboardEntry>()
    scores.forEach((item) => {
      const current = players.get(item.participantId) ?? {
        participantId: item.participantId,
        name: item.participantName,
        total: 0,
        games: {},
      }
      const previous = current.games[item.gameId] ?? 0
      if (item.score > previous) {
        current.games[item.gameId] = item.score
        const maxScore = GAME_MAX_SCORES[item.gameId]
        current.total += Math.round((item.score / maxScore) * 1000) - Math.round((previous / maxScore) * 1000)
      }
      players.set(item.participantId, current)
    })
    return [...players.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  }, [scores])

  return { leaderboard, scores, loading }
}

export function useParticipantCount(sessionId: string | null) {
  const [snapshotState, setSnapshotState] = useState<{ sessionId: string; count: number } | null>(null)
  useEffect(() => {
    if (!sessionId) return
    return onSnapshot(collection(db, "events", sessionId, "participants"), (snapshot) => {
      setSnapshotState({ sessionId, count: snapshot.size })
    })
  }, [sessionId])
  return snapshotState?.sessionId === sessionId ? snapshotState.count : 0
}

export function useLivePrompt(sessionId: string | null, promptId: string | null) {
  const promptKey = sessionId && promptId ? `${sessionId}/${promptId}` : null
  const [snapshotState, setSnapshotState] = useState<{ key: string; prompt: LivePrompt | null } | null>(null)
  useEffect(() => {
    if (!sessionId || !promptId) return
    return onSnapshot(doc(db, "events", sessionId, "prompts", promptId), (snapshot) => {
      if (!snapshot.exists()) {
        setSnapshotState({ key: `${sessionId}/${promptId}`, prompt: null })
        return
      }
      const data = snapshot.data()
      setSnapshotState({
        key: `${sessionId}/${promptId}`,
        prompt: {
          id: snapshot.id,
          type: data.type === "wordcloud" ? "wordcloud" : data.type === "prediction" ? "prediction" : "poll",
          question: String(data.question ?? ""),
          options: Array.isArray(data.options) ? data.options : [],
          status: data.status === "closed" ? "closed" : "active",
          commitmentId: typeof data.commitmentId === "string" ? data.commitmentId : null,
          countdownEndsAtMs: data.countdownEndsAt && typeof data.countdownEndsAt.toMillis === "function" ? data.countdownEndsAt.toMillis() : null,
        },
      })
    })
  }, [sessionId, promptId])
  return snapshotState?.key === promptKey ? snapshotState.prompt : null
}

export function useLiveResponses(sessionId: string | null, promptId: string | null) {
  const responseKey = sessionId && promptId ? `${sessionId}/${promptId}` : null
  const [snapshotState, setSnapshotState] = useState<{ key: string; responses: LiveResponse[] } | null>(null)
  useEffect(() => {
    if (!sessionId || !promptId) return
    const responseQuery = query(
      collection(db, "events", sessionId, "responses"),
      where("promptId", "==", promptId),
    )
    return onSnapshot(responseQuery, (snapshot) => {
      setSnapshotState({
        key: `${sessionId}/${promptId}`,
        responses: snapshot.docs.map((item) => {
          const data = item.data()
          return {
            id: item.id,
            promptId: String(data.promptId ?? ""),
            type: data.type === "wordcloud" ? "wordcloud" : data.type === "prediction" ? "prediction" : "poll",
            optionId: typeof data.optionId === "string" ? data.optionId : null,
            word: typeof data.word === "string" ? data.word : null,
            visible: data.visible !== false,
          }
        }),
      })
    })
  }, [sessionId, promptId])
  return snapshotState?.key === responseKey ? snapshotState.responses : []
}

export async function saveLiveResponse({
  sessionId,
  participantId,
  prompt,
  optionId,
  word,
}: {
  sessionId: string
  participantId: string
  prompt: LivePrompt
  optionId?: string
  word?: string
}) {
  await setDoc(doc(db, "events", sessionId, "responses", `${participantId}_${prompt.id}`), {
    promptId: prompt.id,
    type: prompt.type,
    optionId: prompt.type === "wordcloud" ? null : (optionId ?? null),
    word: prompt.type === "wordcloud" ? (word?.trim().toLowerCase().slice(0, 32) ?? null) : null,
    visible: true,
    createdAt: serverTimestamp(),
  })
}
