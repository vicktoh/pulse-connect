import type { Metadata } from "next"
import { Suspense } from "react"

import { PublicReformSynthesis } from "@/components/events/public-reform-synthesis"

export const metadata: Metadata = {
  title: "Cross-Lab Synthesis · PULSE Reform Tracker",
  description: "Explore the shared themes and overarching insights connecting the PULSE Reform Signals.",
}

export default function ReformSynthesisPage() {
  return <Suspense fallback={<main style={{ minHeight: "100vh", background: "#f7f1e6" }} />}><PublicReformSynthesis /></Suspense>
}
