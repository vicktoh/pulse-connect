import type { Metadata } from "next"
import { Suspense } from "react"

import { PublicReformTracker } from "@/components/events/public-reform-tracker"

export const metadata: Metadata = {
  title: "PULSE Reform Tracker",
  description: "Track public-finance commitments from promise to verified progress.",
}

export default function ReformTrackerPage() {
  return <Suspense fallback={<main style={{ minHeight: "100vh", background: "#fff7eb" }} />}><PublicReformTracker /></Suspense>
}
