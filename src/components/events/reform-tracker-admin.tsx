"use client"

import { useMemo, useState } from "react"
import {
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore"
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Download,
  Eye,
  FilePenLine,
  Plus,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react"

import { useFirebaseAuth } from "@/lib/firebase/auth-provider"
import { db } from "@/lib/firebase/client"
import { useCommitmentMeta, useReformCommitments, type CommitmentMeta } from "@/lib/events/reform-tracker"
import { LABS, type LabId, type ReformCommitment, type VerifiedStatus } from "@/lib/events/types"
import { useEventSessions } from "@/lib/events/use-event-live-data"
import metaStyles from "./reform-tracker-meta.module.css"
import styles from "./reform-tracker-admin.module.css"

type DeskTab = "capture" | "review" | "published"
type CommitmentForm = { statement: string; leadActor: string; intendedOutcome: string }

const EMPTY_FORM: CommitmentForm = { statement: "", leadActor: "", intendedOutcome: "" }
const PROFILE_KEY = "pulse-rapporteur-profile"
const DRAFT_KEY = "pulse-commitment-draft"

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "") as T
  } catch {
    return fallback
  }
}

function publicRecord(commitment: ReformCommitment) {
  return {
    lab: commitment.lab,
    statement: commitment.statement,
    leadActor: commitment.leadActor,
    intendedOutcome: commitment.intendedOutcome,
    status: commitment.status,
    headline: commitment.headline,
    revision: commitment.revision,
    actualStatus: commitment.actualStatus,
    evidenceNote: commitment.evidenceNote,
    evidenceSources: commitment.evidenceSources,
    predictionSummary: commitment.predictionSummary,
  }
}

function isEvidenceUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

export function ReformTrackerAdmin() {
  const { user } = useFirebaseAuth()
  const sessions = useEventSessions()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const session = sessions.find((item) => item.id === selectedId)
    ?? sessions.find((item) => item.status === "live")
    ?? sessions[0]
    ?? null
  const commitments = useReformCommitments(session?.id ?? null, true)
  const commitmentMeta = useCommitmentMeta(session?.id ?? null)
  const initialProfile = readLocal(PROFILE_KEY, { lab: "health" as LabId, rapporteurName: "" })
  const [lab, setLab] = useState<LabId>(initialProfile.lab)
  const [rapporteurName, setRapporteurName] = useState(initialProfile.rapporteurName)
  const [tab, setTab] = useState<DeskTab>("capture")
  const [form, setForm] = useState<CommitmentForm>(() => readLocal(DRAFT_KEY, EMPTY_FORM))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const labCommitments = useMemo(
    () => commitments.filter((item) => item.lab === lab),
    [commitments, lab],
  )
  const draftItems = labCommitments.filter((item) => item.status === "draft")
  const reviewItems = labCommitments.filter((item) => item.status === "review")
  const publishedItems = labCommitments.filter((item) => item.status === "published" || item.status === "withdrawn")
  const headlineCount = commitments.filter((item) => item.lab === lab && item.status === "published" && item.headline).length

  function persistProfile(nextLab: LabId, nextName: string) {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ lab: nextLab, rapporteurName: nextName }))
  }

  function chooseLab(nextLab: LabId) {
    setLab(nextLab)
    persistProfile(nextLab, rapporteurName)
  }

  function changeName(nextName: string) {
    setRapporteurName(nextName)
    persistProfile(lab, nextName)
  }

  function changeForm(field: keyof CommitmentForm, value: string) {
    const next = { ...form, [field]: value }
    setForm(next)
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
  }

  function clearForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    window.localStorage.removeItem(DRAFT_KEY)
  }

  async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !form.statement.trim() || !rapporteurName.trim() || busy) return
    setBusy(true)
    setNotice(null)
    try {
      const batch = writeBatch(db)
      const current = commitments.find((item) => item.id === editingId)
      const commitmentRef = current
        ? doc(db, "events", session.id, "commitments", current.id)
        : doc(collection(db, "events", session.id, "commitments"))
      const clean = {
        lab,
        statement: form.statement.trim().slice(0, 180),
        leadActor: form.leadActor.trim().slice(0, 80),
        intendedOutcome: form.intendedOutcome.trim().slice(0, 180),
      }

      if (current) {
        const materiallyChanged = current.statement !== clean.statement
          || current.leadActor !== clean.leadActor
          || current.intendedOutcome !== clean.intendedOutcome
        if ((current.status === "published" || current.status === "withdrawn") && materiallyChanged) {
          batch.set(doc(collection(commitmentRef, "revisions")), {
            ...publicRecord(current),
            archivedAt: serverTimestamp(),
          })
        }
        batch.update(commitmentRef, {
          ...clean,
          lab,
          revision: materiallyChanged ? current.revision + 1 : current.revision,
          predictionSummary: materiallyChanged && current.predictionSummary ? null : current.predictionSummary,
          updatedAt: serverTimestamp(),
        })
        batch.set(doc(db, "events", session.id, "commitmentMeta", current.id), {
          rapporteurName: rapporteurName.trim().slice(0, 80),
          adminUid: user?.uid ?? "",
          updatedAt: serverTimestamp(),
        }, { merge: true })
      } else {
        batch.set(commitmentRef, {
          ...clean,
          status: "draft",
          headline: false,
          revision: 1,
          actualStatus: null,
          evidenceNote: "",
          evidenceSources: [],
          predictionSummary: null,
          publishedAt: null,
          verifiedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        batch.set(doc(db, "events", session.id, "commitmentMeta", commitmentRef.id), {
          rapporteurName: rapporteurName.trim().slice(0, 80),
          adminUid: user?.uid ?? "",
          withdrawnReason: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
      await batch.commit()
      clearForm()
      setNotice(current ? "Changes saved." : "Draft saved. Ready for the next commitment.")
    } finally {
      setBusy(false)
    }
  }

  function editCommitment(item: ReformCommitment) {
    setEditingId(item.id)
    setForm({ statement: item.statement, leadActor: item.leadActor, intendedOutcome: item.intendedOutcome })
    setLab(item.lab)
    setTab("capture")
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ statement: item.statement, leadActor: item.leadActor, intendedOutcome: item.intendedOutcome }))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function changeStatus(item: ReformCommitment, status: "draft" | "review" | "published") {
    if (!session || busy) return
    if ((status === "review" || status === "published") && (!item.leadActor || !item.intendedOutcome)) {
      setNotice("Add the accountable actor and measurable outcome before review.")
      return
    }
    setBusy(true)
    try {
      await updateDoc(doc(db, "events", session.id, "commitments", item.id), {
        status,
        publishedAt: status === "published" ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      })
      setNotice(status === "published" ? "Commitment published to the tracker." : status === "review" ? "Sent for editorial review." : "Returned to drafts.")
    } finally {
      setBusy(false)
    }
  }

  async function toggleHeadline(item: ReformCommitment) {
    if (!session || item.status !== "published") return
    if (!item.headline && headlineCount >= 3) {
      setNotice("This lab already has three headline commitments.")
      return
    }
    await updateDoc(doc(db, "events", session.id, "commitments", item.id), {
      headline: !item.headline,
      updatedAt: serverTimestamp(),
    })
  }

  async function withdraw(item: ReformCommitment) {
    if (!session) return
    const reason = window.prompt("Private reason for withdrawing this commitment:")?.trim()
    if (!reason) return
    const batch = writeBatch(db)
    batch.update(doc(db, "events", session.id, "commitments", item.id), {
      status: "withdrawn",
      headline: false,
      updatedAt: serverTimestamp(),
    })
    batch.set(doc(db, "events", session.id, "commitmentMeta", item.id), {
      withdrawnReason: reason.slice(0, 300),
      updatedAt: serverTimestamp(),
    }, { merge: true })
    await batch.commit()
  }

  async function deleteDraft(item: ReformCommitment) {
    if (!session || item.status !== "draft" || !window.confirm("Delete this draft? This cannot be undone.")) return
    const batch = writeBatch(db)
    batch.delete(doc(db, "events", session.id, "commitments", item.id))
    batch.delete(doc(db, "events", session.id, "commitmentMeta", item.id))
    await batch.commit()
  }

  function exportCsv() {
    const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`
    const headings = ["Lab", "Commitment", "Lead actor", "Intended outcome", "Status", "Headline", "Prediction: stalled", "Prediction: progressing", "Prediction: completed", "Verified status", "Evidence note", "Evidence sources"]
    const rows = commitments.map((item) => [
      LABS.find((entry) => entry.id === item.lab)?.name ?? item.lab,
      item.statement,
      item.leadActor,
      item.intendedOutcome,
      item.status,
      item.headline ? "Yes" : "No",
      item.predictionSummary?.stalled ?? 0,
      item.predictionSummary?.progressing ?? 0,
      item.predictionSummary?.completed ?? 0,
      item.actualStatus ?? "",
      item.evidenceNote,
      item.evidenceSources.join(" | "),
    ])
    const csv = [headings, ...rows].map((row) => row.map(quote).join(",")).join("\n")
    const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = href
    link.download = `${session?.code ?? "pulse"}-reform-tracker.csv`
    link.click()
    URL.revokeObjectURL(href)
  }

  return (
    <main className={styles.desk}>
      <header className={styles.deskHeader}>
        <div><span>PULSE REFORM TRACKER</span><h1>Rapporteur desk</h1></div>
        <button type="button" onClick={exportCsv} disabled={!commitments.length}><Download /> Export CSV</button>
      </header>

      <section className={styles.contextBar}>
        <label>Live event<select value={session?.id ?? ""} onChange={(event) => setSelectedId(event.target.value)}>{sessions.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.code}</option>)}</select></label>
        <label><UserRound /> Rapporteur<input value={rapporteurName} onChange={(event) => changeName(event.target.value.slice(0, 80))} placeholder="Your name (admin only)" /></label>
        <div className={styles.labChooser}><span>PINNED LAB</span><div>{LABS.map((item) => <button type="button" className={lab === item.id ? styles.activeLab : ""} style={{ "--lab-accent": item.accent } as React.CSSProperties} onClick={() => chooseLab(item.id)} key={item.id}>{item.icon} {item.shortName}</button>)}</div></div>
      </section>

      <nav className={styles.tabs}>
        <button className={tab === "capture" ? styles.activeTab : ""} onClick={() => setTab("capture")}><FilePenLine /> Capture <b>{draftItems.length}</b></button>
        <button className={tab === "review" ? styles.activeTab : ""} onClick={() => setTab("review")}><ClipboardCheck /> Review <b>{reviewItems.length}</b></button>
        <button className={tab === "published" ? styles.activeTab : ""} onClick={() => setTab("published")}><Eye /> Published <b>{publishedItems.length}</b></button>
      </nav>

      {notice && <div className={styles.notice}><Check /> {notice}<button type="button" onClick={() => setNotice(null)}><X /></button></div>}

      {tab === "capture" && (
        <div className={styles.captureGrid}>
          <form className={styles.captureForm} onSubmit={saveDraft}>
            <div className={styles.formTitle}><div><Plus /><span>{editingId ? "EDIT COMMITMENT" : "QUICK CAPTURE"}</span></div><small>Drafts can begin with the statement only.</small></div>
            <Field label="Commitment statement" value={form.statement} max={180} placeholder="What did the stakeholder commit to doing?" onChange={(value) => changeForm("statement", value)} large />
            <Field label="One lead accountable actor" value={form.leadActor} max={80} placeholder="e.g. Federal Ministry of Health" onChange={(value) => changeForm("leadActor", value)} />
            <Field label="Intended measurable outcome" value={form.intendedOutcome} max={180} placeholder="What observable change should exist by the next PULSE Summit?" onChange={(value) => changeForm("intendedOutcome", value)} large />
            <div className={styles.formActions}>{editingId && <button type="button" onClick={clearForm}><RotateCcw /> Cancel edit</button>}<button className={styles.primaryAction} type="submit" disabled={busy || !session || !rapporteurName.trim() || !form.statement.trim()}><Save /> {editingId ? "Save changes" : "Save & add another"}</button></div>
          </form>
          <CommitmentList title="Drafts from this lab" items={draftItems} metadata={commitmentMeta} empty="No drafts yet. Capture the first commitment while the room is talking." actions={(item) => <><button onClick={() => editCommitment(item)}><FilePenLine /> Edit</button><button onClick={() => void changeStatus(item, "review")}><Send /> Send to review</button><button className={styles.dangerButton} onClick={() => void deleteDraft(item)}><Trash2 /></button></>} />
        </div>
      )}

      {tab === "review" && <CommitmentList title="Editorial review" items={reviewItems} metadata={commitmentMeta} empty="Nothing is waiting for review." detailed actions={(item) => <><button onClick={() => editCommitment(item)}><FilePenLine /> Edit wording</button><button onClick={() => void changeStatus(item, "draft")}><RotateCcw /> Return</button><button className={styles.publishButton} onClick={() => void changeStatus(item, "published")}><Check /> Publish</button></>} />}

      {tab === "published" && (
        <CommitmentList title={`${LABS.find((item) => item.id === lab)?.name} tracker · ${headlineCount}/3 headlines`} items={publishedItems} metadata={commitmentMeta} empty="No commitments have been published for this lab." detailed actions={(item) => item.status === "withdrawn" ? <span className={styles.withdrawnTag}>Withdrawn</span> : <><button onClick={() => editCommitment(item)}><FilePenLine /> Revise</button><button className={item.headline ? styles.headlineOn : ""} onClick={() => void toggleHeadline(item)}><Star /> {item.headline ? "Headline" : "Make headline"}</button><button className={styles.dangerButton} onClick={() => void withdraw(item)}>Withdraw</button></>}>{(item) => item.status === "published" && <EvidenceEditor sessionId={session?.id ?? ""} commitment={item} />}</CommitmentList>
      )}
    </main>
  )
}

function Field({ label, value, max, placeholder, onChange, large = false }: { label: string; value: string; max: number; placeholder: string; onChange: (value: string) => void; large?: boolean }) {
  return <label className={styles.field}><span>{label}<small>{value.length}/{max}</small></span>{large ? <textarea value={value} onChange={(event) => onChange(event.target.value.slice(0, max))} placeholder={placeholder} rows={4} /> : <input value={value} onChange={(event) => onChange(event.target.value.slice(0, max))} placeholder={placeholder} />}</label>
}

function CommitmentList({ title, items, metadata, empty, actions, children, detailed = false }: { title: string; items: ReformCommitment[]; metadata: Map<string, CommitmentMeta>; empty: string; actions: (item: ReformCommitment) => React.ReactNode; children?: (item: ReformCommitment) => React.ReactNode; detailed?: boolean }) {
  return <section className={styles.commitmentPanel}><div className={styles.listTitle}><span>{title}</span><b>{items.length}</b></div>{items.length === 0 ? <div className={styles.emptyList}><Sparkles /> {empty}</div> : <div className={styles.commitmentList}>{items.map((item) => { const meta = metadata.get(item.id); return <article className={styles.commitmentCard} data-withdrawn={item.status === "withdrawn" ? "true" : "false"} key={item.id}><div className={styles.cardTop}><span>REV {item.revision}</span>{item.headline && <b><Star /> HEADLINE</b>}</div><h2>{item.statement}</h2><span className={metaStyles.rapporteur}><UserRound /> {meta?.rapporteurName || "Rapporteur not recorded"}</span>{detailed && <div className={styles.commitmentFacts}><p><span>ACCOUNTABLE ACTOR</span><strong>{item.leadActor || "Not entered"}</strong></p><p><span>MEASURABLE OUTCOME</span><strong>{item.intendedOutcome || "Not entered"}</strong></p></div>}{meta?.withdrawnReason && <p className={metaStyles.privateReason}><strong>PRIVATE WITHDRAWAL REASON</strong>{meta.withdrawnReason}</p>}<div className={styles.cardActions}>{actions(item)}</div>{children?.(item)}</article> })}</div>}</section>
}

function EvidenceEditor({ sessionId, commitment }: { sessionId: string; commitment: ReformCommitment }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<VerifiedStatus | "">(commitment.actualStatus ?? "")
  const [note, setNote] = useState(commitment.evidenceNote)
  const [source, setSource] = useState(commitment.evidenceSources[0] ?? "")
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!status || !note.trim() || !isEvidenceUrl(source.trim()) || !sessionId) return
    setSaving(true)
    try {
      await updateDoc(doc(db, "events", sessionId, "commitments", commitment.id), {
        actualStatus: status,
        evidenceNote: note.trim().slice(0, 600),
        evidenceSources: [source.trim().slice(0, 500)],
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return <div className={styles.evidence}><button type="button" onClick={() => setOpen((value) => !value)}><ArrowRight /> {commitment.actualStatus ? "Update verified progress" : "Add verified progress"}</button>{open && <div className={styles.evidenceForm}><select value={status} onChange={(event) => setStatus(event.target.value as VerifiedStatus | "")}><option value="">Select status</option><option value="stalled">Stalled</option><option value="progressing">Progressing</option><option value="completed">Completed</option></select><textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 600))} placeholder="Evidence note" rows={3} /><input value={source} onChange={(event) => setSource(event.target.value.slice(0, 500))} placeholder="https://source-link…" type="url" /><button type="button" disabled={saving || !status || !note.trim() || !isEvidenceUrl(source.trim())} onClick={() => void save()}><Check /> Publish verified status</button></div>}</div>
}
