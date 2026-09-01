"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore"
import { ArrowUpRight, CheckCircle2, CircleDashed, ExternalLink, Filter, Radio, Search, Target } from "lucide-react"

import { db } from "@/lib/firebase/client"
import { parseEventSession } from "@/lib/events/parse-event-session"
import { useReformCommitments } from "@/lib/events/reform-tracker"
import { LABS, type EventSession, type LabId, type VerifiedStatus } from "@/lib/events/types"
import filterStyles from "./public-reform-tracker-filters.module.css"
import styles from "./public-reform-tracker.module.css"

const STATUS_LABELS: Record<VerifiedStatus, string> = { stalled: "Stalled", progressing: "Progressing", completed: "Completed" }

export function PublicReformTracker() {
  const params = useSearchParams()
  const requestedSession = params.get("session")?.trim().toUpperCase() ?? null
  const [session, setSession] = useState<EventSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [lab, setLab] = useState<LabId | "all">("all")
  const [status, setStatus] = useState<VerifiedStatus | "all">("all")
  const [actor, setActor] = useState("")
  const commitments = useReformCommitments(session?.id ?? null)

  useEffect(() => {
    let active = true
    async function loadSession() {
      try {
        if (requestedSession) {
          const result = await getDoc(doc(db, "events", requestedSession))
          if (active && result.exists()) setSession(parseEventSession(result.id, result.data()))
        } else {
          const result = await getDocs(query(collection(db, "events"), where("status", "in", ["live", "closed"]), limit(20)))
          const parsed = result.docs.map((item) => parseEventSession(item.id, item.data()))
          if (active) setSession(parsed.find((item) => item.status === "live") ?? parsed[0] ?? null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadSession()
    return () => { active = false }
  }, [requestedSession])

  const filtered = useMemo(() => commitments.filter((item) => {
    if (lab !== "all" && item.lab !== lab) return false
    if (status !== "all" && item.actualStatus !== status) return false
    if (actor.trim() && !item.leadActor.toLocaleLowerCase().includes(actor.trim().toLocaleLowerCase())) return false
    return true
  }), [actor, commitments, lab, status])
  const verified = commitments.filter((item) => item.actualStatus).length
  const headlines = commitments.filter((item) => item.headline && item.status === "published").length

  if (loading) return <main className={styles.loading}><CircleDashed /></main>
  if (!session) return <main className={styles.missing}><Target /><h1>The tracker is being prepared.</h1><p>Published commitments will appear here after the PULSE Summit sessions begin.</p></main>

  return (
    <main className={styles.tracker}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}><span>PULSE</span><strong>REFORM TRACKER</strong></Link>
        <Link href={`/play?session=${session.code}`} className={styles.playLink}>Join PULSE Play <ArrowUpRight /></Link>
      </header>

      <section className={styles.hero}>
        <div><span className={styles.eyebrow}><Radio /> ACCOUNTABILITY, LIVE</span><h1>From public promise<br />to <em>verified progress.</em></h1><p>{session.name} commitments, audience expectations, and the evidence that follows—tracked through the next PULSE Summit.</p></div>
        <div className={styles.heroStats}><div><strong>{commitments.length}</strong><span>tracked commitments</span></div><div><strong>{headlines}</strong><span>headline promises</span></div><div><strong>{verified}</strong><span>verified updates</span></div></div>
      </section>

      <section className={`${styles.filters} ${filterStyles.filters}`}>
        <div><Filter /> FILTER THE TRACKER</div>
        <label>Lab<select value={lab} onChange={(event) => setLab(event.target.value as LabId | "all")}><option value="all">All five labs</option>{LABS.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label>Accountable actor<span className={filterStyles.searchField}><Search /><input value={actor} onChange={(event) => setActor(event.target.value)} placeholder="Search actor" /></span></label>
        <label>Verified status<select value={status} onChange={(event) => setStatus(event.target.value as VerifiedStatus | "all")}><option value="all">All statuses</option><option value="stalled">Stalled</option><option value="progressing">Progressing</option><option value="completed">Completed</option></select></label>
        <strong>{filtered.length} shown</strong>
      </section>

      {filtered.length === 0 ? <section className={styles.empty}><Target /><h2>No commitments match these filters.</h2></section> : (
        <section className={styles.grid}>{filtered.map((item) => {
          const labMeta = LABS.find((entry) => entry.id === item.lab) ?? LABS[0]
          const prediction = item.predictionSummary
          return <article className={styles.card} style={{ "--lab-accent": labMeta.accent } as React.CSSProperties} data-withdrawn={item.status === "withdrawn" ? "true" : "false"} key={item.id}>
            <div className={styles.cardTop}><span>{labMeta.icon} {labMeta.name}</span>{item.headline && <b>HEADLINE</b>}{item.status === "withdrawn" && <b>WITHDRAWN</b>}</div>
            <h2>{item.statement}</h2>
            <dl><div><dt>LEAD ACCOUNTABLE ACTOR</dt><dd>{item.leadActor}</dd></div><div><dt>INTENDED OUTCOME BY NEXT SUMMIT</dt><dd>{item.intendedOutcome}</dd></div></dl>
            {prediction && <div className={styles.prediction}><div><span>PROMISE OR PROGRESS?</span><small>{prediction.total} audience predictions</small></div>{(["stalled", "progressing", "completed"] as const).map((key) => { const value = prediction[key]; const percentage = prediction.total ? Math.round(value / prediction.total * 100) : 0; return <p key={key}><span>{key === "stalled" ? "Will stall" : key === "progressing" ? "Will progress" : "Will be completed"}</span><i><b style={{ width: `${percentage}%` }} /></i><strong>{percentage}%</strong></p> })}</div>}
            <div className={styles.verified} data-status={item.actualStatus ?? "pending"}>{item.actualStatus ? <><CheckCircle2 /><div><span>VERIFIED OUTCOME · {STATUS_LABELS[item.actualStatus]}</span><p>{item.evidenceNote}</p>{item.evidenceSources.map((source) => <a href={source} target="_blank" rel="noreferrer" key={source}>View evidence <ExternalLink /></a>)}</div></> : <><CircleDashed /><div><span>AWAITING VERIFIED UPDATE</span><p>This commitment is being tracked toward the next PULSE Summit.</p></div></>}</div>
            <footer>Revision {item.revision}</footer>
          </article>
        })}</section>
      )}
    </main>
  )
}
