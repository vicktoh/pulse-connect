"use client"

import { useEffect, useMemo, useState } from "react"
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase/firestore"

import { db } from "@/lib/firebase/client"
import type {
  CommitmentStatus,
  LabId,
  PredictionSummary,
  ReformCommitment,
  VerifiedStatus,
} from "@/lib/events/types"

function timestampMillis(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis()
  }
  return 0
}

function parseCommitment(item: DocumentSnapshot<DocumentData>): ReformCommitment {
  const data = item.data() ?? {}
  const prediction = data.predictionSummary as Partial<PredictionSummary> | null | undefined
  return {
    id: item.id,
    lab: data.lab as LabId,
    statement: String(data.statement ?? ""),
    leadActor: String(data.leadActor ?? ""),
    intendedOutcome: String(data.intendedOutcome ?? ""),
    status: data.status as CommitmentStatus,
    headline: data.headline === true,
    revision: Number(data.revision ?? 1),
    actualStatus: (data.actualStatus ?? null) as VerifiedStatus | null,
    evidenceNote: String(data.evidenceNote ?? ""),
    evidenceSources: Array.isArray(data.evidenceSources) ? data.evidenceSources.map(String) : [],
    predictionSummary: prediction ? {
      promptId: String(prediction.promptId ?? ""),
      stalled: Number(prediction.stalled ?? 0),
      progressing: Number(prediction.progressing ?? 0),
      completed: Number(prediction.completed ?? 0),
      total: Number(prediction.total ?? 0),
    } : null,
    createdAtMs: timestampMillis(data.createdAt),
    updatedAtMs: timestampMillis(data.updatedAt),
  }
}

export function useReformCommitments(sessionId: string | null, admin = false) {
  const key = sessionId ? `${sessionId}/${admin ? "admin" : "public"}` : null
  const [snapshotState, setSnapshotState] = useState<{ key: string; items: ReformCommitment[] } | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const base = collection(db, "events", sessionId, "commitments")
    const source = admin ? base : query(base, where("status", "in", ["published", "withdrawn"]))
    return onSnapshot(
      source,
      (snapshot) => {
        setSnapshotState({
          key: `${sessionId}/${admin ? "admin" : "public"}`,
          items: snapshot.docs.map(parseCommitment),
        })
      },
      () => setSnapshotState({ key: `${sessionId}/${admin ? "admin" : "public"}`, items: [] }),
    )
  }, [admin, sessionId])

  return useMemo(
    () => snapshotState?.key === key
      ? [...snapshotState.items].sort((a, b) => b.updatedAtMs - a.updatedAtMs || a.statement.localeCompare(b.statement))
      : [],
    [key, snapshotState],
  )
}

export function useReformCommitment(sessionId: string | null, commitmentId: string | null) {
  const key = sessionId && commitmentId ? `${sessionId}/${commitmentId}` : null
  const [snapshotState, setSnapshotState] = useState<{ key: string; item: ReformCommitment | null } | null>(null)

  useEffect(() => {
    if (!sessionId || !commitmentId) return
    return onSnapshot(
      doc(db, "events", sessionId, "commitments", commitmentId),
      (snapshot) => {
        setSnapshotState({
          key: `${sessionId}/${commitmentId}`,
          item: snapshot.exists() ? parseCommitment(snapshot) : null,
        })
      },
      () => setSnapshotState({ key: `${sessionId}/${commitmentId}`, item: null }),
    )
  }, [commitmentId, sessionId])

  return snapshotState?.key === key ? snapshotState.item : null
}

export type CommitmentMeta = {
  rapporteurName: string
  withdrawnReason: string | null
}

export function useCommitmentMeta(sessionId: string | null) {
  const [snapshotState, setSnapshotState] = useState<{ key: string; items: Map<string, CommitmentMeta> } | null>(null)

  useEffect(() => {
    if (!sessionId) return
    return onSnapshot(
      collection(db, "events", sessionId, "commitmentMeta"),
      (snapshot) => {
        setSnapshotState({
          key: sessionId,
          items: new Map(snapshot.docs.map((item) => [item.id, {
            rapporteurName: String(item.data().rapporteurName ?? ""),
            withdrawnReason: item.data().withdrawnReason ? String(item.data().withdrawnReason) : null,
          }])),
        })
      },
      () => setSnapshotState({ key: sessionId, items: new Map() }),
    )
  }, [sessionId])

  return snapshotState?.key === sessionId ? snapshotState.items : new Map<string, CommitmentMeta>()
}
