"use client"

import { QRCodeSVG } from "qrcode.react"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { BarChart3, Gamepad2, QrCode, Radio, Target, Trophy, Users } from "lucide-react"

import { db } from "@/lib/firebase/client"
import { parseEventSession } from "@/lib/events/parse-event-session"
import { useReformCommitments } from "@/lib/events/reform-tracker"
import { LABS, type EventSession, type ReformCommitment } from "@/lib/events/types"
import {
  useEventLeaderboard,
  useLivePrompt,
  useLiveResponses,
  useParticipantCount,
} from "@/lib/events/use-event-live-data"
import styles from "./live-projector.module.css"
import trackerStyles from "./live-projector-tracker.module.css"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://pulse-connect-9ab4c.web.app"

export function LiveProjector() {
  const params = useSearchParams()
  const sessionId = params.get("session")?.trim().toUpperCase() ?? ""
  const [session, setSession] = useState<EventSession | null>(null)
  const [missing, setMissing] = useState(false)
  const activeSessionId = session ? sessionId : null
  const participantCount = useParticipantCount(activeSessionId)
  const { leaderboard } = useEventLeaderboard(activeSessionId)
  const prompt = useLivePrompt(activeSessionId, session?.activePromptId ?? null)
  const responses = useLiveResponses(activeSessionId, session?.activePromptId ?? null)
  const commitments = useReformCommitments(activeSessionId)

  useEffect(() => {
    if (!sessionId) return
    return onSnapshot(
      doc(db, "events", sessionId),
      (snapshot) => {
        setMissing(!snapshot.exists())
        setSession(snapshot.exists() ? parseEventSession(snapshot.id, snapshot.data()) : null)
      },
      () => {
        setSession(null)
        setMissing(true)
      },
    )
  }, [sessionId])

  const visibleResponses = useMemo(() => responses.filter((item) => item.visible), [responses])
  const pollCounts = useMemo(() => {
    const counts = new Map<string, number>()
    visibleResponses.forEach((item) => {
      if (item.optionId) counts.set(item.optionId, (counts.get(item.optionId) ?? 0) + 1)
    })
    return counts
  }, [visibleResponses])
  const words = useMemo(() => {
    const counts = new Map<string, number>()
    visibleResponses.forEach((item) => {
      if (item.word) counts.set(item.word, (counts.get(item.word) ?? 0) + 1)
    })
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)
  }, [visibleResponses])

  if (!sessionId) return <ProjectorMessage title="No session selected" detail="Open this screen from the live control room." />
  if (missing) return <ProjectorMessage title="Session not found" detail={`There is no event with the code ${sessionId}.`} />
  if (!session) return <ProjectorMessage title="Connecting to the room…" detail={sessionId} />

  const joinUrl = `${APP_URL}/play?session=${session.code}`

  return (
    <main className={styles.projector}>
      <header className={styles.topbar}>
        <div className={styles.brand}><span>PULSE</span><strong>PLAY</strong></div>
        <div className={styles.liveBadge}><i /> LIVE NOW</div>
        <div className={styles.roomCount}><Users /> {participantCount.toLocaleString()} joined</div>
      </header>

      {session.activeExperience === "lobby" && (
        <section className={styles.joinView}>
          <div className={styles.joinCopy}>
            <span className={styles.eyebrow}><QrCode /> JOIN THE ROOM</span>
            <h1>Scan. Pick a name.<br /><em>Play the summit.</em></h1>
            <p>Play quick games, answer live questions and climb the room leaderboard.</p>
            <div className={styles.joinSteps}><span>1</span> Scan the code <i /> <span>2</span> Enter your name <i /> <span>3</span> Start playing</div>
          </div>
          <div className={styles.qrShell}>
            <div className={styles.qrTop}><Radio /> JOIN LIVE</div>
            <QRCodeSVG value={joinUrl} size={330} bgColor="#fff7eb" fgColor="#061b34" level="M" marginSize={2} />
            <span>SCAN TO JOIN</span>
            <strong style={{ maxWidth: 330, margin: "8px 0 5px", textAlign: "center", fontSize: 32, lineHeight: 1, letterSpacing: -1 }}>Pick a name &amp; play</strong>
            <small>No password or session code needed</small>
          </div>
        </section>
      )}

      {session.activeExperience === "leaderboard" && (
        <section className={styles.leaderboardView}>
          <div className={styles.viewHeading}><span><Trophy /> ROOM LEADERBOARD</span><h1>Who’s setting the <em>pace?</em></h1></div>
          {leaderboard.length === 0 ? (
            <div className={styles.emptyState}><Gamepad2 /><h2>The board is warming up</h2><p>Play any game to claim the first spot.</p></div>
          ) : (
            <div className={styles.leaderboardList}>
              {leaderboard.slice(0, 10).map((entry, index) => (
                <div className={styles.leaderRow} data-podium={index < 3 ? "true" : "false"} key={entry.participantId}>
                  <span>{index + 1}</span><strong>{entry.name}</strong><small>{Object.keys(entry.games).length} game{Object.keys(entry.games).length === 1 ? "" : "s"}</small><b>{entry.total.toLocaleString()}</b>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {session.activeExperience === "poll" && prompt?.type === "poll" && (
        <section className={styles.questionView}>
          <div className={styles.viewHeading}><span><BarChart3 /> LIVE POLL · {visibleResponses.length} VOTES</span><h1>{prompt.question}</h1></div>
          <div className={styles.pollGrid}>
            {prompt.options.map((option, index) => {
              const count = pollCounts.get(option.id) ?? 0
              const percentage = visibleResponses.length ? Math.round((count / visibleResponses.length) * 100) : 0
              return (
                <div className={styles.pollOption} key={option.id}>
                  <div><span>{String.fromCharCode(65 + index)}</span><strong>{option.label}</strong><b>{percentage}%</b></div>
                  <i><span style={{ width: `${percentage}%` }} /></i>
                  <small>{count} vote{count === 1 ? "" : "s"}</small>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {session.activeExperience === "wordcloud" && prompt?.type === "wordcloud" && (
        <section className={styles.questionView}>
          <div className={styles.viewHeading}><span><Radio /> LIVE WORD CLOUD · {visibleResponses.length} ANSWERS</span><h1>{prompt.question}</h1></div>
          {words.length === 0 ? (
            <div className={styles.emptyState}><Radio /><h2>Words will bloom here</h2><p>Send an answer from your phone.</p></div>
          ) : (
            <div className={styles.wordCloud}>
              {words.map(([word, count], index) => {
                const largest = words[0]?.[1] ?? 1
                const scale = 0.72 + (count / largest) * 1.18
                return <span key={word} data-color={index % 5} style={{ fontSize: `${scale}em` }}>{word}</span>
              })}
            </div>
          )}
        </section>
      )}

      {session.activeExperience === "tracker" && (
        <TrackerScreen session={session} commitments={commitments.filter((item) => item.status === "published")} />
      )}

      {session.activeExperience === "prediction" && prompt?.type === "prediction" && (
        <PredictionScreen
          commitment={commitments.find((item) => item.id === prompt.commitmentId) ?? null}
          counts={pollCounts}
          total={visibleResponses.length}
        />
      )}

      <footer className={styles.footer}><span>{session.name}</span><strong>Public finance, but make it a game show.</strong></footer>
    </main>
  )
}

function TrackerScreen({ session, commitments }: { session: EventSession; commitments: ReformCommitment[] }) {
  const selectedLab = LABS.find((item) => item.id === session.trackerLab) ?? LABS[0]
  const selectedCommitment = commitments.find((item) => item.id === session.trackerCommitmentId) ?? null
  const visibleCommitments = session.trackerViewMode === "newest"
    ? commitments.slice(0, 4)
    : commitments.filter((item) => item.lab === selectedLab.id).slice(0, 4)

  if (session.trackerViewMode === "commitment") {
    return <section className={trackerStyles.trackerView}>{selectedCommitment ? <CommitmentSpotlight commitment={selectedCommitment} /> : <TrackerEmpty />}</section>
  }

  if (session.trackerViewMode === "overview") {
    return <section className={trackerStyles.trackerView}>
      <TrackerHeading title={<>Five labs. One public <em>accountability trail.</em></>} count={commitments.length} />
      <div className={trackerStyles.labGrid}>{LABS.map((lab) => { const items = commitments.filter((item) => item.lab === lab.id); return <article className={trackerStyles.labCard} style={{ "--lab-accent": lab.accent } as React.CSSProperties} key={lab.id}><span>{lab.icon} {lab.name}</span><strong>{items.length}</strong><small>published commitments</small><p>{items.find((item) => item.headline)?.statement ?? items[0]?.statement ?? "Commitments will appear as the lab reports."}</p></article> })}</div>
    </section>
  }

  return <section className={trackerStyles.trackerView}>
    <TrackerHeading title={session.trackerViewMode === "newest" ? <>Just added to the <em>Reform Tracker.</em></> : <>{selectedLab.name} lab <em>commitments.</em></>} count={visibleCommitments.length} />
    {visibleCommitments.length ? <div className={trackerStyles.commitmentGrid}>{visibleCommitments.map((item) => <CompactCommitment commitment={item} key={item.id} />)}</div> : <TrackerEmpty />}
  </section>
}

function TrackerHeading({ title, count }: { title: React.ReactNode; count: number }) {
  return <div className={trackerStyles.trackerHeading}><div><span><Target /> PULSE REFORM TRACKER · LIVE</span><h1>{title}</h1></div><div className={trackerStyles.trackerCount}><strong>{count}</strong><span>ON SCREEN</span></div></div>
}

function CompactCommitment({ commitment }: { commitment: ReformCommitment }) {
  const lab = LABS.find((item) => item.id === commitment.lab) ?? LABS[0]
  return <article className={trackerStyles.commitmentCard} style={{ "--lab-accent": lab.accent } as React.CSSProperties}><span>{lab.icon} {lab.name}{commitment.headline ? " · HEADLINE" : ""}</span><h2>{commitment.statement}</h2><footer><div><small>LEAD ACTOR</small><strong>{commitment.leadActor}</strong></div><div><small>OUTCOME BY NEXT SUMMIT</small><strong>{commitment.intendedOutcome}</strong></div></footer></article>
}

function CommitmentSpotlight({ commitment }: { commitment: ReformCommitment }) {
  const lab = LABS.find((item) => item.id === commitment.lab) ?? LABS[0]
  return <article className={trackerStyles.spotlight} style={{ "--lab-accent": lab.accent } as React.CSSProperties}><div><span><Target /> {lab.name.toUpperCase()} LAB · PUBLISHED COMMITMENT</span><h2>{commitment.statement}</h2></div><dl className={trackerStyles.spotlightFacts}><div><dt>ONE LEAD ACCOUNTABLE ACTOR</dt><dd>{commitment.leadActor}</dd></div><div><dt>INTENDED OUTCOME BY NEXT PULSE SUMMIT</dt><dd>{commitment.intendedOutcome}</dd></div></dl></article>
}

function PredictionScreen({ commitment, counts, total }: { commitment: ReformCommitment | null; counts: Map<string, number>; total: number }) {
  if (!commitment) return <section className={trackerStyles.predictionView}><TrackerEmpty /></section>
  const lab = LABS.find((item) => item.id === commitment.lab) ?? LABS[0]
  const choices = [{ id: "stalled", label: "Will stall" }, { id: "progressing", label: "Will progress" }, { id: "completed", label: "Will be completed" }]
  return <section className={trackerStyles.predictionView}><span className={trackerStyles.predictionKicker}><Radio /> PROMISE OR PROGRESS? · LIVE RESULTS</span><article className={trackerStyles.predictionStage} style={{ "--lab-accent": lab.accent } as React.CSSProperties}><div className={trackerStyles.predictionCopy}><span className={trackerStyles.predictionKicker}>{lab.icon} {lab.name.toUpperCase()} LAB</span><h1>{commitment.statement}</h1><p>{commitment.leadActor} · Outcome due by the next PULSE Summit</p></div><div className={trackerStyles.predictionResults}>{choices.map((choice) => { const count = counts.get(choice.id) ?? 0; const percent = total ? Math.round(count / total * 100) : 0; return <div className={trackerStyles.resultRow} key={choice.id}><p><span>{choice.label}</span><strong>{percent}%</strong></p><i><span style={{ width: `${percent}%` }} /></i><small>{count} prediction{count === 1 ? "" : "s"}</small></div> })}<div className={trackerStyles.predictionTotal}><Users /> {total} audience prediction{total === 1 ? "" : "s"}</div></div></article></section>
}

function TrackerEmpty() {
  return <div className={trackerStyles.emptyTracker}><div><Target /><h2>The tracker is ready for its next commitment.</h2><p>Publish from the rapporteur desk, then take it live.</p></div></div>
}

function ProjectorMessage({ title, detail }: { title: string; detail: string }) {
  return <main className={styles.message}><Radio /><h1>{title}</h1><p>{detail}</p></main>
}
