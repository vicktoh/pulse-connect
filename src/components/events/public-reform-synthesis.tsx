"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore"
import { ArrowLeft, ArrowUpRight, CircleDashed } from "lucide-react"

import { db } from "@/lib/firebase/client"
import { parseEventSession } from "@/lib/events/parse-event-session"
import { useReformSynthesis } from "@/lib/events/reform-tracker"
import type { EventSession } from "@/lib/events/types"
import { ReformSynthesisCarousel } from "./reform-synthesis-carousel"
import styles from "./public-reform-synthesis.module.css"

export function PublicReformSynthesis() {
  const params = useSearchParams()
  const requestedSession = params.get("session")?.trim().toUpperCase() ?? null
  const [session, setSession] = useState<EventSession | null>(null)
  const [loading, setLoading] = useState(true)
  const points = useReformSynthesis(session?.id ?? null)

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

  if (loading) return <main className={styles.loading}><CircleDashed /></main>
  if (!session) return <main className={styles.missing}><h1>The synthesis is being prepared.</h1><Link href="/reform-tracker">Return to the Reform Tracker</Link></main>

  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href={`/reform-tracker?session=${session.code}`} className={styles.brand}><span>PULSE</span><strong>Reform Tracker</strong></Link>
      <div><Link href={`/reform-tracker?session=${session.code}`}><ArrowLeft /> All Reform Signals</Link><Link href={`/play?session=${session.code}`}>Join PULSE Play <ArrowUpRight /></Link></div>
    </header>
    <ReformSynthesisCarousel points={points} />
    <footer className={styles.footer}><span>PULSE · CROSS-LAB SYNTHESIS</span><p>Insights are editorial synthesis, linked to the published Reform Signals.</p></footer>
  </main>
}
