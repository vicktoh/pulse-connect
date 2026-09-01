import type { Metadata } from "next"
import { Suspense } from "react"

import { LiveProjector } from "@/components/events/live-projector"

export const metadata: Metadata = {
  title: "Live · PULSE Play",
  description: "The live PULSE Summit audience screen.",
  robots: { index: false, follow: false },
}

export default function LivePage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", background: "#061b34" }} />}>
      <LiveProjector />
    </Suspense>
  )
}
