"use client"

import Link from "next/link"
import { Check, LoaderCircle, Trophy } from "lucide-react"
import { useEffect, useState } from "react"

import { useEventPlayer } from "@/lib/events/event-player-provider"
import type { GameId } from "@/lib/events/types"
import styles from "./game-score-reporter.module.css"

export function GameScoreReporter({ gameId, score }: { gameId: GameId; score: number }) {
  const { participant, session, submitScore } = useEventPlayer()
  const [status, setStatus] = useState<"saving" | "saved" | "unchanged" | "error">("saving")

  useEffect(() => {
    if (!participant || !session) return
    let active = true
    void submitScore(gameId, score)
      .then((result) => {
        if (active) setStatus(result)
      })
      .catch(() => {
        if (active) setStatus("error")
      })
    return () => {
      active = false
    }
  }, [gameId, participant, score, session, submitScore])

  if (!participant || !session) return null

  return (
    <div className={styles.reporter} role="status" aria-live="polite">
      <span className={styles.icon}>
        {status === "saving" ? <LoaderCircle className={styles.spin} /> : status === "error" ? <Trophy /> : <Check />}
      </span>
      <div>
        <strong>
          {status === "saving"
            ? "Updating the live leaderboard…"
            : status === "error"
              ? "Score saved on this screen only"
              : status === "unchanged"
                ? "Your previous best still leads"
                : "New best score added!"}
        </strong>
        <small>{participant.name} · Room {session.code}</small>
      </div>
      <Link href={`/play?session=${session.code}`}>Games & standings</Link>
    </div>
  )
}
