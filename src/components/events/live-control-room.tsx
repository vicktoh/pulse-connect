"use client"

import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { useMemo, useState } from "react"
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc } from "firebase/firestore"
import { ArrowUpRight, Check, Copy, Eye, Gamepad2, Lock, MonitorUp, Plus, Power, QrCode, Radio, Send, Sparkles, Target, Timer, Trophy, Unlock } from "lucide-react"

import { db } from "@/lib/firebase/client"
import { useFirebaseAuth } from "@/lib/firebase/auth-provider"
import { useReformCommitments } from "@/lib/events/reform-tracker"
import { LABS, PREDICTION_OPTIONS, type LabId, type LivePrompt, type PromptType, type ReformCommitment, type TrackerViewMode } from "@/lib/events/types"
import { useEventLeaderboard, useEventSessions, useLivePrompt, useLiveResponses, useParticipantCount } from "@/lib/events/use-event-live-data"
import { useProducerLock } from "@/lib/events/use-producer-lock"
import styles from "./live-control-room.module.css"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://pulse-connect-9ab4c.web.app"

type BroadcastCue =
  | { kind: "experience"; experience: "lobby" | "leaderboard" }
  | { kind: "tracker"; mode: TrackerViewMode; lab: LabId | null; commitmentId: string | null }
  | { kind: "prompt"; promptType: "poll" | "wordcloud"; question: string; options: string[]; countdown: boolean }
  | { kind: "prediction"; commitmentId: string; countdown: boolean }

function createCode() {
  return `PULSE${Math.floor(10 + Math.random() * 90)}`
}

export function LiveControlRoom() {
  const { user, signOutUser } = useFirebaseAuth()
  const sessions = useEventSessions()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const session = sessions.find((item) => item.id === selectedId) ?? sessions.find((item) => item.status === "live") ?? sessions[0] ?? null
  const sessionId = session?.id ?? null
  const [sessionName, setSessionName] = useState("PULSE Summit Live")
  const [sessionCode, setSessionCode] = useState(createCode)
  const [promptType, setPromptType] = useState<"poll" | "wordcloud">("poll")
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState("Yes\nNo\nNot sure")
  const [countdown, setCountdown] = useState(true)
  const [trackerMode, setTrackerMode] = useState<TrackerViewMode>("overview")
  const [trackerLab, setTrackerLab] = useState<LabId>("health")
  const [trackerCommitmentId, setTrackerCommitmentId] = useState("")
  const [cue, setCue] = useState<BroadcastCue>({ kind: "experience", experience: "lobby" })
  const [busy, setBusy] = useState(false)
  const [sessionNotice, setSessionNotice] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const participantCount = useParticipantCount(sessionId)
  const { leaderboard } = useEventLeaderboard(sessionId)
  const activePrompt = useLivePrompt(sessionId, session?.activePromptId ?? null)
  const responses = useLiveResponses(sessionId, session?.activePromptId ?? null)
  const commitments = useReformCommitments(sessionId, true)
  const published = commitments.filter((item) => item.status === "published")
  const headlines = published.filter((item) => item.headline)
  const joinUrl = session ? `${APP_URL}/play?session=${session.code}` : ""
  const producer = useProducerLock(sessionId)

  const pollCounts = useMemo(() => {
    const counts = new Map<string, number>()
    responses.filter((item) => item.visible && item.optionId).forEach((item) => counts.set(item.optionId!, (counts.get(item.optionId!) ?? 0) + 1))
    return counts
  }, [responses])
  const words = useMemo(() => {
    const counts = new Map<string, number>()
    responses.filter((item) => item.visible && item.word).forEach((item) => counts.set(item.word!, (counts.get(item.word!) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [responses])

  async function createSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = sessionCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)
    if (!code || !sessionName.trim() || busy) return
    setBusy(true)
    setSessionNotice(null)
    try {
      const sessionRef = doc(db, "events", code)
      const existing = await getDoc(sessionRef)
      if (existing.exists()) {
        setSelectedId(code)
        setSessionNotice(`${code} already exists, so that room has been opened. Use a different room ID to create another.`)
        return
      }
      await setDoc(sessionRef, {
        name: sessionName.trim().slice(0, 80), code, status: "live", activeExperience: "lobby", activePromptId: null,
        trackerViewMode: "overview", trackerLab: null, trackerCommitmentId: null,
        createdAt: serverTimestamp(), createdBy: user?.uid ?? "",
      })
      setSelectedId(code)
      setSessionNotice(`${code} is live and ready for attendees.`)
      setSessionCode(createCode())
    } catch (error) {
      const message = error instanceof Error && error.message.includes("permission")
        ? "Firebase rejected the room. Refresh your admin session, then try a fresh room ID."
        : "The room could not be created. Check your connection and try again."
      setSessionNotice(message)
    } finally { setBusy(false) }
  }

  function prepareQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const preparedOptions = options.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 6)
    if (!question.trim() || (promptType === "poll" && preparedOptions.length < 2)) return
    setCue({ kind: "prompt", promptType, question: question.trim().slice(0, 180), options: preparedOptions, countdown })
  }

  function prepareTracker() {
    setCue({ kind: "tracker", mode: trackerMode, lab: trackerMode === "lab" ? trackerLab : null, commitmentId: trackerMode === "commitment" ? trackerCommitmentId || null : null })
  }

  async function takeLive() {
    if (!sessionId || !producer.isOwner || busy) return
    setBusy(true)
    try {
      if (cue.kind === "experience") {
        await updateDoc(doc(db, "events", sessionId), { activeExperience: cue.experience, activePromptId: null, updatedAt: serverTimestamp() })
      } else if (cue.kind === "tracker") {
        await updateDoc(doc(db, "events", sessionId), { activeExperience: "tracker", activePromptId: null, trackerViewMode: cue.mode, trackerLab: cue.lab, trackerCommitmentId: cue.commitmentId, updatedAt: serverTimestamp() })
      } else {
        const commitment = cue.kind === "prediction" ? commitments.find((item) => item.id === cue.commitmentId) : null
        if (cue.kind === "prediction" && !commitment) return
        const type: PromptType = cue.kind === "prediction" ? "prediction" : cue.promptType
        const prompt = await addDoc(collection(db, "events", sessionId, "prompts"), {
          type,
          question: cue.kind === "prediction" ? "Promise or Progress?" : cue.question,
          options: cue.kind === "prediction" ? PREDICTION_OPTIONS.map((item) => ({ ...item })) : cue.promptType === "poll" ? cue.options.map((label, index) => ({ id: `option-${index + 1}`, label: label.slice(0, 80) })) : [],
          commitmentId: commitment?.id ?? null,
          status: "active",
          countdownEndsAt: cue.countdown ? Timestamp.fromMillis(Date.now() + 30_000) : null,
          createdAt: serverTimestamp(),
          createdBy: user?.uid ?? "",
        })
        await updateDoc(doc(db, "events", sessionId), { activeExperience: type, activePromptId: prompt.id, updatedAt: serverTimestamp() })
        if (cue.kind === "prompt") setQuestion("")
      }
    } finally { setBusy(false) }
  }

  async function endInteraction() {
    if (!sessionId || !activePrompt || !producer.isOwner || busy) return
    setBusy(true)
    try {
      await updateDoc(doc(db, "events", sessionId, "prompts", activePrompt.id), { status: "closed", closedAt: serverTimestamp() })
      if (activePrompt.type === "prediction" && activePrompt.commitmentId) {
        await updateDoc(doc(db, "events", sessionId, "commitments", activePrompt.commitmentId), {
          predictionSummary: { promptId: activePrompt.id, stalled: pollCounts.get("stalled") ?? 0, progressing: pollCounts.get("progressing") ?? 0, completed: pollCounts.get("completed") ?? 0, total: responses.filter((item) => item.visible).length },
          updatedAt: serverTimestamp(),
        })
      }
      await updateDoc(doc(db, "events", sessionId), { activeExperience: "lobby", activePromptId: null, updatedAt: serverTimestamp() })
      setCue({ kind: "experience", experience: "lobby" })
    } finally { setBusy(false) }
  }

  async function closeSession() {
    if (!sessionId || !producer.isOwner || !window.confirm("End this event session and freeze attendee scoring?")) return
    await updateDoc(doc(db, "events", sessionId), { status: "closed", activeExperience: "leaderboard", activePromptId: null, updatedAt: serverTimestamp() })
  }

  return (
    <main className={styles.controlRoom}>
      <header className={styles.controlHeader}><div><span>PULSE PLAY</span><strong>Broadcast control</strong></div><div><small>{user?.email}</small><button type="button" onClick={signOutUser}>Sign out</button></div></header>
      <div className={styles.controlGrid}>
        <aside className={styles.sessionRail}>
          <span className={styles.railLabel}>EVENT SESSIONS</span>
          <div className={styles.sessionList}>{sessions.map((item) => <button type="button" className={item.id === session?.id ? styles.selectedSession : ""} onClick={() => setSelectedId(item.id)} key={item.id}><i className={item.status === "live" ? styles.liveDot : ""} /><span><strong>{item.code}</strong><small>{item.name}</small></span></button>)}</div>
          <form className={styles.newSession} onSubmit={createSession}><strong><Plus /> New session</strong><label htmlFor="event-name">Event name</label><input id="event-name" value={sessionName} onChange={(event) => setSessionName(event.target.value)} /><label htmlFor="event-code">New room ID · must be unique</label><input id="event-code" value={sessionCode} onChange={(event) => setSessionCode(event.target.value.toUpperCase())} />{sessionNotice && <p role="status" style={{ margin: 0, color: "#9b3323", fontSize: 11, fontWeight: 850, lineHeight: 1.4 }}>{sessionNotice}</p>}<button type="submit" disabled={busy}>{busy ? "Opening…" : "Create & open"}</button></form>
        </aside>

        {!session ? <section className={styles.noSession}><Radio /><h1>Create the first live session</h1><p>The QR, games, tracker and audience tools will appear here.</p></section> : (
          <section className={styles.dashboard}>
            <div className={styles.sessionTopline}><div><span><i /> {session.status.toUpperCase()} SESSION</span><h1>{session.name}</h1><p>{participantCount} attendees joined · {published.length} commitments published</p></div><div className={styles.sessionActions}><Link href={`/live?session=${session.code}`} target="_blank"><MonitorUp /> Open projector <ArrowUpRight /></Link><button type="button" onClick={() => void closeSession()}><Power /> End session</button></div></div>

            <section className={producer.isOwner ? styles.producerOwned : styles.producerLock}><div>{producer.isOwner ? <Unlock /> : <Lock />}<span><strong>{producer.isOwner ? "YOU HAVE LIVE CONTROL" : producer.available ? "LIVE CONTROL IS AVAILABLE" : "ANOTHER DEVICE IS ON AIR"}</strong><small>{producer.isOwner ? "Your preview is private until you take it live." : producer.lock?.label ?? "Claim control before broadcasting."}</small></span></div>{producer.isOwner ? <button onClick={() => void producer.releaseControl()}>Release control</button> : <button onClick={() => { const force = !producer.available && window.confirm("Force takeover from the current producer device?"); if (producer.available || force) void producer.takeControl(force) }}>{producer.available ? "Take live control" : "Force takeover"}</button>}</section>

            <div className={styles.studioGrid}>
              <section className={styles.cuePanel}>
                <PanelHeading icon={<Eye />} title="BUILD THE NEXT SCREEN" detail="Preview queue" />
                <div className={styles.quickCues}><button onClick={() => setCue({ kind: "experience", experience: "lobby" })}><QrCode /> Join QR</button><button onClick={() => setCue({ kind: "experience", experience: "leaderboard" })}><Trophy /> Leaderboard</button></div>
                <div className={styles.builderBlock}><span>REFORM TRACKER VIEW</span><div className={styles.modeSwitch}>{(["overview", "newest", "lab", "commitment"] as TrackerViewMode[]).map((mode) => <button className={trackerMode === mode ? styles.activeChoice : ""} onClick={() => setTrackerMode(mode)} key={mode}>{mode}</button>)}</div>{trackerMode === "lab" && <select value={trackerLab} onChange={(event) => setTrackerLab(event.target.value as LabId)}>{LABS.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>}{trackerMode === "commitment" && <select value={trackerCommitmentId} onChange={(event) => setTrackerCommitmentId(event.target.value)}><option value="">Select a published commitment</option>{published.map((item) => <option value={item.id} key={item.id}>{item.statement}</option>)}</select>}<button className={styles.prepareButton} onClick={prepareTracker} disabled={trackerMode === "commitment" && !trackerCommitmentId}><Target /> Load tracker preview</button></div>
                <form className={styles.builderBlock} onSubmit={prepareQuestion}><span>NEW AUDIENCE MOMENT</span><div className={styles.modeSwitch}><button type="button" className={promptType === "poll" ? styles.activeChoice : ""} onClick={() => setPromptType("poll")}>Poll</button><button type="button" className={promptType === "wordcloud" ? styles.activeChoice : ""} onClick={() => setPromptType("wordcloud")}>Word cloud</button></div><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Question for the room" maxLength={180} required />{promptType === "poll" && <textarea value={options} onChange={(event) => setOptions(event.target.value)} rows={4} aria-label="Poll options, one per line" />}<label className={styles.countdownToggle}><input type="checkbox" checked={countdown} onChange={(event) => setCountdown(event.target.checked)} /><Timer /> Show optional 30-second countdown</label><button className={styles.prepareButton} type="submit"><Sparkles /> Load question preview</button></form>
                <div className={styles.builderBlock}><span>PROMISE OR PROGRESS · {headlines.length} HEADLINES</span><div className={styles.headlineList}>{headlines.length ? headlines.map((item) => <button onClick={() => setCue({ kind: "prediction", commitmentId: item.id, countdown })} key={item.id}><b>{LABS.find((labItem) => labItem.id === item.lab)?.shortName}</b><span>{item.statement}</span><ArrowUpRight /></button>) : <p>Mark up to three published commitments per lab as headlines in the Reform Tracker desk.</p>}</div></div>
              </section>

              <section className={styles.previewPanel}><PanelHeading icon={<MonitorUp />} title="PREVIEW" detail="Not visible to audience" /><BroadcastPreview cue={cue} commitments={commitments} /><button className={styles.takeLive} onClick={() => void takeLive()} disabled={!producer.isOwner || busy}><Send /> {busy ? "Sending…" : "Take live"}</button>{!producer.isOwner && <small className={styles.controlHint}>Claim live control to broadcast this preview.</small>}</section>

              <section className={styles.onAirPanel}><PanelHeading icon={<Radio />} title="ON AIR NOW" detail={`${responses.length} responses`} /><div className={styles.onAirTitle}><i /><strong>{session.activeExperience === "prediction" ? "Promise or Progress" : session.activeExperience}</strong></div>{activePrompt ? <LiveResponseView prompt={activePrompt} pollCounts={pollCounts} words={words} total={responses.filter((item) => item.visible).length} /> : <div className={styles.panelEmpty}>The venue screen is showing {session.activeExperience === "tracker" ? "the Reform Tracker" : session.activeExperience}.</div>}{activePrompt && <button className={styles.endInteraction} onClick={() => void endInteraction()} disabled={!producer.isOwner || busy}><Check /> Close interaction & return phones</button>}</section>

              <section className={styles.sideStats}><div className={styles.qrMini}><QRCodeSVG value={joinUrl} size={118} bgColor="#fff7eb" fgColor="#061b34" level="M" marginSize={1} /><span><strong>{participantCount}</strong> joined<button type="button" onClick={() => { void navigator.clipboard.writeText(joinUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1200) }}><Copy /> {copied ? "Copied" : "Copy QR link"}</button></span></div><div className={styles.topPlayers}><span><Gamepad2 /> TOP PLAYERS</span>{leaderboard.slice(0, 5).map((entry, index) => <p key={entry.participantId}><b>{index + 1}</b><strong>{entry.name}</strong><span>{entry.total.toLocaleString()}</span></p>)}</div><Link className={styles.trackerDeskLink} href="/admin/reform-tracker"><Target /> Open rapporteur & review desk <ArrowUpRight /></Link></section>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function PanelHeading({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className={styles.panelHeading}><div>{icon}<span>{title}</span></div><small>{detail}</small></div>
}

function BroadcastPreview({ cue, commitments }: { cue: BroadcastCue; commitments: ReformCommitment[] }) {
  if (cue.kind === "experience") return <div className={styles.previewStage}><span>{cue.experience === "lobby" ? "JOIN SCREEN" : "GAME RESULTS"}</span><h2>{cue.experience === "lobby" ? "Scan. Pick a name. Play." : "Room leaderboard"}</h2><p>{cue.experience === "lobby" ? "Venue QR and attendee count" : "Top ten normalized game scores"}</p></div>
  if (cue.kind === "tracker") { const commitment = commitments.find((item) => item.id === cue.commitmentId); return <div className={styles.previewStage} data-kind="tracker"><span>REFORM TRACKER · {cue.mode.toUpperCase()}</span><h2>{commitment?.statement ?? (cue.lab ? LABS.find((item) => item.id === cue.lab)?.name : cue.mode === "newest" ? "Newest commitments" : "All five labs")}</h2><p>{commitment?.leadActor ?? "Published commitments from the breakout sessions"}</p></div> }
  if (cue.kind === "prediction") { const commitment = commitments.find((item) => item.id === cue.commitmentId); return <div className={styles.previewStage} data-kind="prediction"><span>PROMISE OR PROGRESS?</span><h2>{commitment?.statement ?? "Select a headline commitment"}</h2><p>{commitment?.leadActor} · Outcome by the next PULSE Summit</p></div> }
  return <div className={styles.previewStage} data-kind="question"><span>{cue.promptType === "poll" ? "LIVE POLL" : "WORD CLOUD"}</span><h2>{cue.question}</h2><p>{cue.promptType === "poll" ? cue.options.join(" · ") : "One answer per attendee"}</p></div>
}

function LiveResponseView({ prompt, pollCounts, words, total }: { prompt: LivePrompt; pollCounts: Map<string, number>; words: [string, number][]; total: number }) {
  return <div className={styles.responseView}><h2>{prompt.question}</h2>{prompt.type !== "wordcloud" ? prompt.options.map((option) => { const count = pollCounts.get(option.id) ?? 0; const percent = total ? Math.round((count / total) * 100) : 0; return <div className={styles.resultBar} key={option.id}><div><span>{option.label}</span><strong>{percent}%</strong></div><i><b style={{ width: `${percent}%` }} /></i></div> }) : words.length ? <div className={styles.wordCloud}>{words.slice(0, 24).map(([word, count], index) => <span style={{ fontSize: `${0.8 + Math.min(count, 8) * 0.16}rem`, color: ["#13c8d5", "#ff654f", "#9ce13b", "#f5aa2c"][index % 4] }} key={word}>{word}</span>)}</div> : <div className={styles.panelEmpty}>Words will appear here in real time.</div>}</div>
}
