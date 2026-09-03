"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CircleDashed, Clock3, Network, Radio, Route, Search, ShieldCheck, SlidersHorizontal, Target, Users } from "lucide-react"

import { saveTrackerVote, useReformCommitments, useReformSynthesis, useTrackerVotes } from "@/lib/events/reform-tracker"
import { LABS, type EventParticipant, type EventSession, type ReformCommitment, type TrackerVote, type VerifiedStatus } from "@/lib/events/types"
import styles from "./audience-reform-tracker.module.css"
import { ReformSynthesisCarousel } from "./reform-synthesis-carousel"

const SIGNAL_LABELS: Record<ReformCommitment["signalType"], string> = { "committed-action": "Committed action", "reform-opportunity": "Reform opportunity", "advocacy-priority": "Advocacy priority", "evidence-gap": "Evidence gap" }
const LAB_IMAGES: Record<ReformCommitment["lab"], string> = { health: "/images/labs/health.webp", water: "/images/labs/water.webp", education: "/images/labs/education.webp", "social-protection": "/images/labs/social-protection.webp", "debt-accountability": "/images/labs/debt-accountability.webp" }
const VOTE_OPTIONS: { id: VerifiedStatus; label: string; detail: string }[] = [
  { id: "progressing", label: "Will move", detail: "The first milestone is likely to advance" },
  { id: "completed", label: "Will be completed", detail: "The milestone is likely to be delivered" },
  { id: "stalled", label: "Will stall", detail: "The action is likely to meet a blocker" },
]

export function AudienceReformTracker({ session, participant }: { session: EventSession; participant: EventParticipant }) {
  const commitments = useReformCommitments(session.id).filter((item) => item.status === "published")
  const votes = useTrackerVotes(session.id)
  const synthesis = useReformSynthesis(session.id)
  const [view, setView] = useState<"signals" | "synthesis">("signals")
  const [lab, setLab] = useState<"all" | ReformCommitment["lab"]>(session.trackerLab ?? "all")
  const [status, setStatus] = useState<"all" | VerifiedStatus>("all")
  const [search, setSearch] = useState("")
  const [activeId, setActiveId] = useState<string | null>(session.trackerCommitmentId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  const visible = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase()
    return commitments.filter((item) => {
      if (lab !== "all" && item.lab !== lab) return false
      if (status !== "all" && item.actualStatus !== status) return false
      if (needle && ![item.statement, item.problem, item.publicChange, item.leadActor].some((value) => value.toLocaleLowerCase().includes(needle))) return false
      return true
    })
  }, [commitments, lab, search, status])
  const hostSelectedId = session.trackerViewMode === "commitment" ? session.trackerCommitmentId : null
  const effectiveActiveId = hostSelectedId ?? activeId
  const active = visible.find((item) => item.id === effectiveActiveId) ?? commitments.find((item) => item.id === effectiveActiveId) ?? visible[0] ?? null
  const activeIndex = active ? visible.findIndex((item) => item.id === active.id) : -1
  const myVote = active ? votes.find((item) => item.id === `${participant.uid}_${active.id}`) : null
  const activeVotes = active ? votes.filter((item) => item.commitmentId === active.id) : []

  useEffect(() => {
    if (!active) return
    carouselRef.current?.querySelector<HTMLElement>(`[data-signal-id="${active.id}"]`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
  }, [active])

  async function vote(choice: VerifiedStatus) {
    if (!active || myVote || busy) return
    setBusy(true)
    setError(null)
    try {
      await saveTrackerVote({ sessionId: session.id, participantId: participant.uid, commitmentId: active.id, choice })
    } catch {
      setError("Your vote did not send. Check your connection and try once more.")
    } finally {
      setBusy(false)
    }
  }

  function move(direction: -1 | 1) {
    if (!visible.length) return
    const next = activeIndex < 0 ? 0 : (activeIndex + direction + visible.length) % visible.length
    setActiveId(visible[next].id)
  }

  function resetFilters() { setLab("all"); setStatus("all"); setSearch(""); setActiveId(null) }

  return (
    <main className={styles.tracker}>
      <header className={styles.header}><div className={styles.brand}><span>PULSE</span><strong>Reform Tracker</strong></div><div className={styles.live}><i /><Radio /> LIVE WITH THE HOST</div><div className={styles.player}><small>JOINED AS</small><strong>{participant.name}</strong></div></header>

      <section className={styles.intro}><div><span>{view === "signals" ? "FROM THE LABS TO ACTION" : "THE SHARED REFORM PICTURE"}</span><h1>{view === "signals" ? <>Explore every<br /><em>reform signal.</em></> : <>See what the<br /><em>labs share.</em></>}</h1></div><p>{view === "signals" ? "Filter the live record, select any commitment, then review its details and call what happens next." : "Move through the overarching points connecting the lab conversations, then see the defining theme from each room."}</p></section>

      <nav className={styles.viewSwitch} aria-label="Choose tracker view"><button data-active={view === "signals" ? "true" : "false"} onClick={() => setView("signals")}><Target /> Reform Signals <b>{commitments.length}</b></button><button data-active={view === "synthesis" ? "true" : "false"} onClick={() => setView("synthesis")}><Network /> Shared Themes <b>{synthesis.filter((point) => point.kind === "cross-lab").length}</b></button></nav>

      {view === "synthesis" ? <ReformSynthesisCarousel points={synthesis} compact /> : <><section className={styles.filters}>
        <nav aria-label="Filter Reform Signals by lab"><button className={lab === "all" ? styles.activeLab : ""} onClick={() => { setLab("all"); setActiveId(null) }}><Target /> All <b>{commitments.length}</b></button>{LABS.map((item) => { const count = commitments.filter((commitment) => commitment.lab === item.id).length; return <button className={lab === item.id ? styles.activeLab : ""} style={{ "--lab-accent": item.accent } as React.CSSProperties} onClick={() => { setLab(item.id); setActiveId(null) }} key={item.id}>{item.shortName}<b>{count}</b></button> })}</nav>
        <div><label><Search /><input value={search} onChange={(event) => { setSearch(event.target.value); setActiveId(null) }} placeholder="Search signals or actors" /></label><label><SlidersHorizontal /><select value={status} onChange={(event) => { setStatus(event.target.value as "all" | VerifiedStatus); setActiveId(null) }}><option value="all">All progress</option><option value="progressing">Progressing</option><option value="completed">Completed</option><option value="stalled">Stalled</option></select></label>{(lab !== "all" || status !== "all" || search) && <button onClick={resetFilters}>Clear</button>}</div>
      </section>

      {!active ? <section className={styles.empty}><CircleDashed /><h2>No signals match this view.</h2><button onClick={resetFilters}>Show everything</button></section> : <>
        <section className={styles.carouselSection}>
          <div className={styles.carouselHeading}><div><span>LIVE OVERVIEW</span><h2>{visible.length} commitment{visible.length === 1 ? "" : "s"}</h2></div><div><button onClick={() => move(-1)} aria-label="Previous commitment"><ArrowLeft /></button><span>{Math.max(activeIndex + 1, 1)} / {visible.length}</span><button onClick={() => move(1)} aria-label="Next commitment"><ArrowRight /></button></div></div>
          <div className={styles.carousel} ref={carouselRef}>{visible.map((item) => <AudienceSignalCard item={item} votes={votes.filter((vote) => vote.commitmentId === item.id)} active={item.id === active.id} onOpen={() => setActiveId(item.id)} key={item.id} />)}</div>
        </section>

        <article className={styles.signal} style={{ "--lab-accent": (LABS.find((item) => item.id === active.lab) ?? LABS[0]).accent } as React.CSSProperties}>
          <div className={styles.signalMain}><div className={styles.signalMeta}><Image src={LAB_IMAGES[active.lab]} alt="" width={640} height={640} sizes="64px" /><span><b>{(LABS.find((item) => item.id === active.lab) ?? LABS[0]).name} Lab</b><small>Reform Signal {String(active.signalNumber).padStart(2, "0")} · {SIGNAL_LABELS[active.signalType]}</small></span></div><h2>{active.statement}</h2><div className={styles.storyGrid}><Detail icon={<CircleDashed />} label="THE PROBLEM" value={active.problem || "Problem detail will be added after validation."} /><Detail icon={<Route />} label="THE CHANGE PEOPLE SHOULD EXPERIENCE" value={active.publicChange || active.intendedOutcome} /><Detail icon={<Users />} label="WHO ACTS" value={active.leadActor} /><Detail icon={<Clock3 />} label="FIRST MILESTONE" value={`${active.intendedOutcome}${active.milestoneDate ? ` · ${formatDate(active.milestoneDate)}` : ""}`} /><Detail icon={<ShieldCheck />} label="CONFIRMATION" value={active.confirmationNote || confirmationLabel(active.confirmationStatus)} /><Detail icon={<CheckCircle2 />} label="EVIDENCE OF PROGRESS" value={active.evidenceOfProgress || "Evidence source to be confirmed."} /></div></div>
          <aside className={styles.votePanel}><span>PROMISE OR PROGRESS?</span><h3>What will this signal do next?</h3><p>One vote per attendee, per Reform Signal. Your first choice is final.</p>{!myVote ? <div className={styles.voteOptions}>{VOTE_OPTIONS.map((option) => <button disabled={busy} onClick={() => void vote(option.id)} data-choice={option.id} key={option.id}><i /><span><strong>{option.label}</strong><small>{option.detail}</small></span><ArrowRight /></button>)}</div> : <VoteResults votes={activeVotes} selected={myVote.choice} />}{error && <p className={styles.error}>{error}</p>}</aside>
        </article>
      </>}</>}
    </main>
  )
}

function AudienceSignalCard({ item, votes, active, onOpen }: { item: ReformCommitment; votes: TrackerVote[]; active: boolean; onOpen: () => void }) {
  const lab = LABS.find((entry) => entry.id === item.lab) ?? LABS[0]
  const outlook = VOTE_OPTIONS.map((option) => ({ ...option, percentage: votes.length ? Math.round(votes.filter((vote) => vote.choice === option.id).length / votes.length * 100) : 0 }))
  return <button className={styles.signalCard} data-active={active ? "true" : "false"} data-signal-id={item.id} style={{ "--lab-accent": lab.accent } as React.CSSProperties} onClick={onOpen}><header><Image src={LAB_IMAGES[item.lab]} alt="" width={640} height={640} sizes="58px" /><span><b>{lab.name}</b><small>REFORM SIGNAL {String(item.signalNumber).padStart(2, "0")}</small></span><i>{item.actualStatus ?? "Tracking"}</i></header><h3>{item.statement}</h3><p>{item.publicChange || item.intendedOutcome}</p><dl><div><dt>WHO ACTS</dt><dd>{item.leadActor}</dd></div><div><dt>FIRST MILESTONE</dt><dd>{formatDate(item.milestoneDate)}</dd></div></dl><div className={styles.cardOutlook}><span>{votes.length ? `${votes.length} LIVE VOTES` : "VOTING OPEN"}</span><section>{outlook.map((option) => <i data-choice={option.id} style={{ width: `${votes.length ? option.percentage : 33.333}%` }} key={option.id} />)}</section><footer>{outlook.map((option) => <small key={option.id}>{option.label.replace("Will be ", "")} {votes.length ? `${option.percentage}%` : ""}</small>)}</footer></div></button>
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <section className={styles.detail}><div>{icon}<span>{label}</span></div><p>{value}</p></section> }
function VoteResults({ votes, selected }: { votes: { choice: VerifiedStatus }[]; selected: VerifiedStatus }) { return <div className={styles.results}><div className={styles.received}><Check /><span><strong>Vote received</strong><small>Live room results</small></span></div>{VOTE_OPTIONS.map((option) => { const count = votes.filter((vote) => vote.choice === option.id).length; const percentage = votes.length ? Math.round(count / votes.length * 100) : 0; return <div className={styles.result} data-selected={selected === option.id ? "true" : "false"} data-choice={option.id} key={option.id}><p><span>{option.label}</span><strong>{percentage}%</strong></p><i><b style={{ width: `${percentage}%` }} /></i><small>{count} vote{count === 1 ? "" : "s"}</small></div> })}</div> }
function formatDate(value: string) { if (!value) return "Date to be confirmed"; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(date) }
function confirmationLabel(value: ReformCommitment["confirmationStatus"]) { if (value === "yes") return "Confirmed by an actor with authority."; if (value === "no") return "Not confirmed."; return "Requires confirmation from an actor with authority." }
