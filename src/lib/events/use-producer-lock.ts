"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { deleteDoc, doc, onSnapshot, runTransaction, Timestamp, updateDoc } from "firebase/firestore"

import { db } from "@/lib/firebase/client"

const DEVICE_KEY = "pulse-producer-device"
const LEASE_MS = 60_000

function getDeviceId() {
  if (typeof window === "undefined") return "server"
  const stored = window.localStorage.getItem(DEVICE_KEY)
  if (stored) return stored
  const next = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `device-${Date.now()}`
  window.localStorage.setItem(DEVICE_KEY, next)
  return next
}

type ProducerLock = { deviceId: string; label: string; expiresAtMs: number }

export function useProducerLock(sessionId: string | null) {
  const [deviceId] = useState(getDeviceId)
  const [lock, setLock] = useState<ProducerLock | null>(null)
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!sessionId) return
    return onSnapshot(doc(db, "events", sessionId, "control", "producer"), (snapshot) => {
      const data = snapshot.data()
      setLock(snapshot.exists() ? {
        deviceId: String(data?.deviceId ?? ""),
        label: String(data?.label ?? "Producer console"),
        expiresAtMs: data?.expiresAt instanceof Timestamp ? data.expiresAt.toMillis() : 0,
      } : null)
    })
  }, [sessionId])

  const isOwner = Boolean(lock && lock.deviceId === deviceId && lock.expiresAtMs > now)
  const available = !lock || lock.expiresAtMs <= now

  const takeControl = useCallback(async (force = false) => {
    if (!sessionId) return false
    const ref = doc(db, "events", sessionId, "control", "producer")
    return runTransaction(db, async (transaction) => {
      const current = await transaction.get(ref)
      const data = current.data()
      const expiresAtMs = data?.expiresAt instanceof Timestamp ? data.expiresAt.toMillis() : 0
      if (!force && current.exists() && data?.deviceId !== deviceId && expiresAtMs > Date.now()) return false
      transaction.set(ref, {
        deviceId,
        label: "Live control room",
        expiresAt: Timestamp.fromMillis(Date.now() + LEASE_MS),
        updatedAt: Timestamp.now(),
      })
      return true
    })
  }, [deviceId, sessionId])

  useEffect(() => {
    if (!sessionId || !isOwner) return
    const timer = window.setInterval(() => {
      void updateDoc(doc(db, "events", sessionId, "control", "producer"), {
        expiresAt: Timestamp.fromMillis(Date.now() + LEASE_MS),
        updatedAt: Timestamp.now(),
      })
    }, 25_000)
    return () => window.clearInterval(timer)
  }, [isOwner, sessionId])

  const releaseControl = useCallback(async () => {
    if (!sessionId || !isOwner) return
    await deleteDoc(doc(db, "events", sessionId, "control", "producer"))
  }, [isOwner, sessionId])

  return useMemo(() => ({ isOwner, available, lock, takeControl, releaseControl }), [available, isOwner, lock, releaseControl, takeControl])
}
