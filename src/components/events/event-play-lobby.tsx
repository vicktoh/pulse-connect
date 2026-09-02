"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import {
  ArrowRight,
  Check,
  Gamepad2,
  LogOut,
  Radio,
  Sparkles,
  Trophy,
  Users,
  Vote,
} from "lucide-react"

import { useEventPlayer } from "@/lib/events/event-player-provider"
import { GAME_CATALOG } from "@/lib/events/types"
import {
  useEventLeaderboard,
  useLivePrompt,
  useLiveResponses,
  useParticipantCount,
} from "@/lib/events/use-event-live-data"
import styles from "./event-play-lobby.module.css"
import { AudienceTakeover } from "./audience-takeover"
import { AudienceReformTracker } from "./audience-reform-tracker"

export function EventPlayLobby() {
  const searchParams = useSearchParams()
  const { playerReady, participant, session, joinSession, leaveSession } = useEventPlayer()
  const sessionHint = searchParams.get("session")?.toUpperCase() ?? null
  const [name, setName] = useState("")
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const sessionId = participant?.sessionId ?? null
  const { leaderboard } = useEventLeaderboard(sessionId)
  const participantCount = useParticipantCount(sessionId)
  const prompt = useLivePrompt(sessionId, session?.activePromptId ?? null)
  const responses = useLiveResponses(sessionId, session?.activePromptId ?? null)
  const myScores = useMemo(
    () => leaderboard.find((entry) => entry.participantId === participant?.uid)?.games ?? {},
    [leaderboard, participant?.uid],
  )

  async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (joining) return
    setJoining(true)
    setJoinError(null)
    try {
      const result = await joinSession(name, sessionHint)
      if (!result.ok) setJoinError(result.message)
    } catch {
      setJoinError("We could not join the room. Check your connection and try again.")
    } finally {
      setJoining(false)
    }
  }

  if (!playerReady) return <main className={styles.shell}><div className={styles.loadingCard} /></main>

  if (!participant || !session) {
    return (
      <main className={styles.shell}>
        <div className={styles.joinDecor} aria-hidden="true"><span>?</span><span>₦</span><span>!</span></div>
        <section className={styles.joinCard}>
          <div className={styles.brand}><b>PULSE</b><span>PLAY</span></div>
          <span className={styles.eyebrow}>THE SUMMIT IS LIVE</span>
          <h1>Join the room.<br /><em>Play the room.</em></h1>
          <p>Pick the name you want on the leaderboard. That’s all you need to enter the live room.</p>
          <form onSubmit={handleJoin}>
            <label htmlFor="player-name">Choose your player name</label>
            <input
              id="player-name"
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, 40))}
              placeholder="e.g. Ada K."
              autoComplete="name"
              required
            />
            {joinError && <p className={styles.error} role="alert">{joinError}</p>}
            <button type="submit" disabled={joining}>
              {joining ? "Joining…" : "Enter PULSE Play"} <ArrowRight />
            </button>
          </form>
          <small>No password. You join anonymously and only your player name appears publicly.</small>
        </section>
      </main>
    )
  }

  if (
    (session.activeExperience === "poll" || session.activeExperience === "wordcloud" || session.activeExperience === "prediction")
    && session.activePromptId
  ) {
    return <AudienceTakeover sessionId={session.id} participant={participant} prompt={prompt} responses={responses} />
  }

  if (session.activeExperience === "tracker") {
    return <AudienceReformTracker session={session} participant={participant} />
  }

  return (
    <main className={styles.lobby}>
      <header className={styles.lobbyHeader}>
        <div className={styles.brand}><b>PULSE</b><span>PLAY</span></div>
        <div className={styles.playerChip}>
          <span>{participant.name.slice(0, 1).toUpperCase()}</span>
          <div><small>Playing as</small><strong>{participant.name}</strong></div>
        </div>
        <button className={styles.leaveButton} type="button" onClick={leaveSession} aria-label="Leave this event session"><LogOut /></button>
      </header>

      <section className={styles.lobbyHero}>
        <div>
          <span className={styles.liveBadge}><i /> ROOM {session.code}</span>
          <h1>Pick a game.<br /><em>Make your move.</em></h1>
          <p>{session.name} · Your best score from every game counts.</p>
        </div>
        <div className={styles.roomStats}>
          <div><Users /><strong>{participantCount}</strong><span>in the room</span></div>
          <div><Trophy /><strong>{leaderboard.findIndex((item) => item.participantId === participant.uid) + 1 || "—"}</strong><span>your rank</span></div>
        </div>
      </section>

      {session.activeExperience === "leaderboard" && (
        <section className={styles.liveMoment}>
          <div className={styles.liveMomentTitle}>
            <span><Radio /> LIVE WITH THE HOST</span>
            <strong>{session.activeExperience === "leaderboard" ? "The leaderboard is on screen" : "Audience question"}</strong>
          </div>
          <LeaderboardPreview leaderboard={leaderboard.slice(0, 5)} participantId={participant.uid} />
        </section>
      )}

      <section className={styles.gameSection}>
        <div className={styles.sectionHeading}><div><Gamepad2 /><span>PLAY ANY GAME</span></div><small>Best scores only</small></div>
        <div className={styles.gameGrid}>
          {GAME_CATALOG.map((game, index) => {
            const best = myScores[game.id]
            return (
              <Link href={game.href} className={styles.gameCard} style={{ "--game-accent": game.accent } as React.CSSProperties} key={game.id}>
                <span className={styles.gameNumber}>0{index + 1}</span>
                <div className={styles.gameIcon}>{game.icon}</div>
                <span className={styles.gameStrap}>{game.strapline}</span>
                <h2>{game.title}</h2>
                <p>{game.description}</p>
                <div className={styles.gameMeta}>
                  <span>{game.duration}</span>
                  {best !== undefined ? <strong><Check /> Best: {best.toLocaleString()}</strong> : <strong>Play now <ArrowRight /></strong>}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className={styles.leaderboardSection}>
        <div className={styles.sectionHeading}><div><Trophy /><span>ROOM LEADERBOARD</span></div><small>Live totals</small></div>
        <LeaderboardPreview leaderboard={leaderboard.slice(0, 10)} participantId={participant.uid} />
      </section>
      <Link href={`/reform-tracker?session=${session.code}`} className={styles.emptyBoard}><Vote /> View the public PULSE Reform Tracker <ArrowRight /></Link>
    </main>
  )
}

function LeaderboardPreview({
  leaderboard,
  participantId,
}: {
  leaderboard: { participantId: string; name: string; total: number }[]
  participantId: string
}) {
  if (leaderboard.length === 0) return <div className={styles.emptyBoard}><Sparkles /> Be the first name on the board.</div>
  return (
    <div className={styles.leaderboard}>
      {leaderboard.map((entry, index) => (
        <div className={entry.participantId === participantId ? styles.me : ""} key={entry.participantId}>
          <span>{index + 1}</span><strong>{entry.name}</strong><b>{entry.total.toLocaleString()} pts</b>
        </div>
      ))}
    </div>
  )
}
