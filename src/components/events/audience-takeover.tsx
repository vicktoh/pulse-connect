"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Check, Radio, Send, Timer, Vote } from "lucide-react"

import { useReformCommitment } from "@/lib/events/reform-tracker"
import { LABS, type EventParticipant, type LivePrompt, type LiveResponse } from "@/lib/events/types"
import { saveLiveResponse } from "@/lib/events/use-event-live-data"
import styles from "./audience-takeover.module.css"

export function AudienceTakeover({ sessionId, participant, prompt, responses }: { sessionId: string; participant: EventParticipant; prompt: LivePrompt | null; responses: LiveResponse[] }) {
  const [busy, setBusy] = useState(false)
  const [word, setWord] = useState("")
  const [error, setError] = useState<string | null>(null)
  const commitment = useReformCommitment(sessionId, prompt?.commitmentId ?? null)
  const myResponse = prompt ? responses.find((item) => item.id === `${participant.uid}_${prompt.id}`) : null
  const visible = useMemo(() => responses.filter((item) => item.visible), [responses])
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    visible.forEach((item) => { if (item.optionId) map.set(item.optionId, (map.get(item.optionId) ?? 0) + 1) })
    return map
  }, [visible])
  const words = useMemo(() => {
    const map = new Map<string, number>()
    visible.forEach((item) => { if (item.word) map.set(item.word, (map.get(item.word) ?? 0) + 1) })
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)
  }, [visible])

  async function respond(optionId?: string) {
    if (!prompt || busy || myResponse) return
    setBusy(true)
    setError(null)
    try {
      await saveLiveResponse({ sessionId, participantId: participant.uid, prompt, optionId, word })
    } catch {
      setError("Your response did not send. Check your connection and try once more.")
    } finally { setBusy(false) }
  }

  if (!prompt) return <main className={styles.takeover}><div className={styles.loading}><Radio /><h1>The host is opening a live moment…</h1></div></main>
  const lab = commitment ? LABS.find((item) => item.id === commitment.lab) : null
  const answered = Boolean(myResponse)

  return (
    <main className={styles.takeover} data-type={prompt.type}>
      <header><div className={styles.brand}><span>PULSE</span><strong>LIVE</strong></div><div className={styles.player}><small>PLAYING AS</small><strong>{participant.name}</strong></div></header>
      <section className={styles.stage}>
        <div className={styles.statusLine}><span><i /> LIVE WITH THE HOST</span>{prompt.countdownEndsAtMs && <Countdown endsAt={prompt.countdownEndsAtMs} />}</div>
        {prompt.type === "prediction" && commitment ? <div className={styles.commitment}><span style={{ "--lab-accent": lab?.accent } as React.CSSProperties}>{lab?.icon} {lab?.name}</span><h1>{commitment.statement}</h1><dl><div><dt>ACCOUNTABLE ACTOR</dt><dd>{commitment.leadActor}</dd></div><div><dt>OUTCOME BY NEXT PULSE SUMMIT</dt><dd>{commitment.intendedOutcome}</dd></div></dl></div> : <h1 className={styles.question}>{prompt.question}</h1>}

        {!answered ? prompt.type === "wordcloud" ? <form className={styles.wordEntry} onSubmit={(event) => { event.preventDefault(); void respond() }}><label htmlFor="live-word">Your one-word answer</label><input id="live-word" value={word} onChange={(event) => setWord(event.target.value.slice(0, 32))} placeholder="Type one word…" required autoFocus /><button disabled={busy}><Send /> Send to the room</button></form> : <div className={styles.options}>{prompt.options.map((option, index) => <button onClick={() => void respond(option.id)} disabled={busy} key={option.id}><span>{String.fromCharCode(65 + index)}</span><strong>{option.label}</strong><ArrowRight /></button>)}</div> : (
          <div className={styles.results}>
            <div className={styles.received}><Check /><span><strong>Your response is locked in.</strong><small>Results update live until the host closes this round.</small></span></div>
            {prompt.type === "wordcloud" ? <div className={styles.wordCloud}>{words.map(([entry, count], index) => <span data-color={index % 5} style={{ fontSize: `${1 + Math.min(count, 7) * .18}rem` }} key={entry}>{entry}</span>)}</div> : <div className={styles.resultBars}>{prompt.options.map((option) => { const count = counts.get(option.id) ?? 0; const percentage = visible.length ? Math.round(count / visible.length * 100) : 0; return <div data-selected={myResponse?.optionId === option.id ? "true" : "false"} key={option.id}><p><span>{option.label}</span><strong>{percentage}%</strong></p><i><b style={{ width: `${percentage}%` }} /></i><small>{count} vote{count === 1 ? "" : "s"}</small></div> })}</div>}
          </div>
        )}
        {error && <p className={styles.error}>{error}</p>}
        <footer><Vote /> One response per attendee · Your first choice is final</footer>
      </section>
    </main>
  )
}

function Countdown({ endsAt }: { endsAt: number }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 250); return () => window.clearInterval(timer) }, [])
  const seconds = Math.max(0, Math.ceil((endsAt - now) / 1000))
  return <span className={styles.timer}><Timer /> {seconds}s</span>
}
