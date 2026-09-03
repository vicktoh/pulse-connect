"use client"

import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore"
import { ArrowRight, ArrowUpRight, CheckCircle2, CircleDashed, ExternalLink, Network, Radio, Search, SlidersHorizontal, Target, X } from "lucide-react"

import { db } from "@/lib/firebase/client"
import { parseEventSession } from "@/lib/events/parse-event-session"
import { useReformCommitments } from "@/lib/events/reform-tracker"
import { LABS, type EventSession, type LabId, type ReformCommitment, type VerifiedStatus } from "@/lib/events/types"
import styles from "./public-reform-tracker.module.css"

const STATUS_LABELS: Record<VerifiedStatus, string> = { stalled: "Stalled", progressing: "Progressing", completed: "Completed" }
const SIGNAL_LABELS: Record<ReformCommitment["signalType"], string> = { "committed-action": "Committed action", "reform-opportunity": "Reform opportunity", "advocacy-priority": "Advocacy priority", "evidence-gap": "Evidence gap" }
const LAB_IMAGES: Record<LabId, string> = { health: "/images/labs/health.webp", water: "/images/labs/water.webp", education: "/images/labs/education.webp", "social-protection": "/images/labs/social-protection.webp", "debt-accountability": "/images/labs/debt-accountability.webp" }

export function PublicReformTracker() {
  const params = useSearchParams()
  const requestedSession = params.get("session")?.trim().toUpperCase() ?? null
  const [session, setSession] = useState<EventSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [lab, setLab] = useState<LabId | "all">("all")
  const [status, setStatus] = useState<VerifiedStatus | "all">("all")
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
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

  useEffect(() => {
    if (!selectedId) return
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") setSelectedId(null) }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", closeOnEscape)
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", closeOnEscape) }
  }, [selectedId])

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase()
    return commitments.filter((item) => {
      if (lab !== "all" && item.lab !== lab) return false
      if (status !== "all" && item.actualStatus !== status) return false
      if (needle && ![item.statement, item.problem, item.publicChange, item.leadActor, item.signalCode].some((value) => value.toLocaleLowerCase().includes(needle))) return false
      return true
    })
  }, [commitments, lab, search, status])
  const selected = commitments.find((item) => item.id === selectedId) ?? null
  const verified = commitments.filter((item) => item.actualStatus).length
  const headlines = commitments.filter((item) => item.headline && item.status === "published").length

  if (loading) return <main className={styles.loading}><CircleDashed /></main>
  if (!session) return <main className={styles.missing}><Target /><h1>The tracker is being prepared.</h1><p>Published commitments will appear here after the PULSE Summit sessions begin.</p></main>

  return (
    <main className={styles.tracker}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}><span>PULSE</span><strong>Reform Tracker</strong></Link>
        <div className={styles.headerMeta}><span><i /> Live public record</span><Link href={`/play?session=${session.code}`}>Join PULSE Play <ArrowUpRight /></Link></div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}><span className={styles.eyebrow}><Radio /> FROM THE LABS TO ACTION</span><h1>Follow every<br /><em>reform signal.</em></h1><p>A simple view of who committed to what, the first milestone, and how progress will be evidenced.</p><Link className={styles.synthesisLink} href={`/reform-tracker/themes?session=${session.code}`}><span><Network /><b>See the cross-lab synthesis</b><small>Five overarching points connecting the Reform Signals</small></span><ArrowRight /></Link></div>
        <div className={styles.statRow}><div><strong>{commitments.length}</strong><span>Signals</span></div><div><strong>{headlines}</strong><span>Headlines</span></div><div><strong>{verified}</strong><span>Verified</span></div><div><strong>5</strong><span>Labs</span></div></div>
      </section>

      <section className={styles.labIndex} aria-label="Browse by lab">
        {LABS.map((item) => {
          const count = commitments.filter((commitment) => commitment.lab === item.id).length
          const isActive = lab === item.id
          return <button className={styles.labCard} data-active={isActive ? "true" : "false"} style={{ "--accent": item.accent } as React.CSSProperties} onClick={() => setLab(isActive ? "all" : item.id)} key={item.id}><Image src={LAB_IMAGES[item.id]} alt="" width={640} height={640} sizes="(max-width: 700px) 62px, 76px" /><span><b>{item.name}</b><small>{count} signal{count === 1 ? "" : "s"}</small></span><i><ArrowRight /></i></button>
        })}
      </section>

      <section className={styles.indexHeading}>
        <div><span>REFORM SIGNALS</span><h2>{lab === "all" ? "The complete picture" : LABS.find((item) => item.id === lab)?.name}</h2></div>
        <div className={styles.controls}><label><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search signals or actors" /></label><label><SlidersHorizontal /><select value={status} onChange={(event) => setStatus(event.target.value as VerifiedStatus | "all")}><option value="all">All progress</option><option value="stalled">Stalled</option><option value="progressing">Progressing</option><option value="completed">Completed</option></select></label>{(lab !== "all" || status !== "all" || search) && <button onClick={() => { setLab("all"); setStatus("all"); setSearch("") }}>Clear</button>}</div>
      </section>

      {filtered.length === 0 ? <section className={styles.empty}><Target /><h2>No signals match this view.</h2><button onClick={() => { setLab("all"); setStatus("all"); setSearch("") }}>Show everything</button></section> : <section className={styles.signalGrid}>{filtered.map((item) => <SignalCard item={item} onOpen={() => setSelectedId(item.id)} key={item.id} />)}</section>}

      <footer className={styles.footer}><span>PULSE · PUBLIC ACCOUNTABILITY</span><p>Last updated live by event rapporteurs.</p></footer>
      {selected && <SignalDrawer item={selected} onClose={() => setSelectedId(null)} />}
    </main>
  )
}

function SignalCard({ item, onOpen }: { item: ReformCommitment; onOpen: () => void }) {
  const lab = LABS.find((entry) => entry.id === item.lab) ?? LABS[0]
  const prediction = item.predictionSummary
  return <article className={styles.signalCard} style={{ "--accent": lab.accent } as React.CSSProperties} data-withdrawn={item.status === "withdrawn" ? "true" : "false"}><button onClick={onOpen} aria-label={`Open details for ${item.statement}`}><div className={styles.cardHeader}><Image src={LAB_IMAGES[item.lab]} alt="" width={640} height={640} sizes="54px" /><div><span>{lab.name}</span></div><i>{item.actualStatus ? STATUS_LABELS[item.actualStatus] : "Tracking"}</i></div><h3>{item.statement}</h3><p className={styles.change}>{item.publicChange || item.intendedOutcome}</p><dl><div><dt>WHO ACTS</dt><dd>{item.leadActor}</dd></div><div><dt>FIRST MILESTONE</dt><dd>{formatDate(item.milestoneDate)}</dd></div></dl>{prediction ? <PredictionStrip prediction={prediction} /> : <div className={styles.awaiting}><CircleDashed /> Audience forecast pending</div>}<div className={styles.cardFooter}><span>{SIGNAL_LABELS[item.signalType]}</span><strong>View signal <ArrowRight /></strong></div></button></article>
}

function PredictionStrip({ prediction }: { prediction: NonNullable<ReformCommitment["predictionSummary"]> }) {
  const values = (["progressing", "completed", "stalled"] as const).map((key) => ({ key, percentage: prediction.total ? Math.round(prediction[key] / prediction.total * 100) : 0 }))
  return <div className={styles.prediction}><div className={styles.predictionLabel}><span>Audience outlook</span><small>{prediction.total} votes</small></div><div className={styles.stackedBar}>{values.map(({ key, percentage }) => <i data-choice={key} style={{ width: `${percentage}%` }} key={key} />)}</div><div className={styles.legend}>{values.map(({ key, percentage }) => <span data-choice={key} key={key}><i />{key === "progressing" ? "Move" : key === "completed" ? "Complete" : "Stall"} <b>{percentage}%</b></span>)}</div></div>
}

function SignalDrawer({ item, onClose }: { item: ReformCommitment; onClose: () => void }) {
  const lab = LABS.find((entry) => entry.id === item.lab) ?? LABS[0]
  return <div className={styles.drawerLayer} role="dialog" aria-modal="true" aria-label={`Details for ${item.statement}`}><button className={styles.backdrop} onClick={onClose} aria-label="Close signal details" /><article className={styles.drawer} style={{ "--accent": lab.accent } as React.CSSProperties}><header><div><Image src={LAB_IMAGES[item.lab]} alt="" width={640} height={640} sizes="58px" /><span><b>{lab.name} Lab</b><small>{SIGNAL_LABELS[item.signalType]}</small></span></div><button onClick={onClose} aria-label="Close"><X /></button></header><div className={styles.drawerBody}><span className={styles.signalNumber}>REFORM SIGNAL {String(item.signalNumber).padStart(2, "0")}</span><h2>{item.statement}</h2><Detail label="The problem" value={item.problem || "Detail pending validation."} /><Detail label="The change people should experience" value={item.publicChange || item.intendedOutcome} featured /><div className={styles.detailPair}><Detail label="Who acts" value={item.leadActor} /><Detail label="First milestone" value={`${item.intendedOutcome}${item.milestoneDate ? ` · ${formatDate(item.milestoneDate)}` : ""}`} /></div><div className={styles.detailPair}><Detail label="Confirmation" value={item.confirmationNote || confirmationLabel(item.confirmationStatus)} /><Detail label="Evidence of progress" value={item.evidenceOfProgress || "Evidence source to be confirmed."} /></div>{item.outstandingItems && <Detail label="Outstanding items" value={item.outstandingItems} />}{item.predictionSummary && <PredictionStrip prediction={item.predictionSummary} />}<div className={styles.verified} data-status={item.actualStatus ?? "pending"}>{item.actualStatus ? <><CheckCircle2 /><div><span>VERIFIED OUTCOME · {STATUS_LABELS[item.actualStatus]}</span><p>{item.evidenceNote}</p>{item.evidenceSources.map((source) => <a href={source} target="_blank" rel="noreferrer" key={source}>View evidence <ExternalLink /></a>)}</div></> : <><CircleDashed /><div><span>AWAITING VERIFIED UPDATE</span><p>This signal is being tracked toward the next PULSE Summit.</p></div></>}</div><small className={styles.revision}>Revision {item.revision} · {item.readBackConfirmed ? "Read-back confirmed" : "Read-back pending"}</small></div></article></div>
}

function Detail({ label, value, featured = false }: { label: string; value: string; featured?: boolean }) { return <section className={styles.detail} data-featured={featured ? "true" : "false"}><span>{label}</span><p>{value}</p></section> }
function formatDate(value: string) { if (!value) return "Date to be confirmed"; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(date) }
function confirmationLabel(value: ReformCommitment["confirmationStatus"]) { if (value === "yes") return "Confirmed by an actor with authority."; if (value === "no") return "Not confirmed."; return "Requires confirmation from an actor with authority." }
