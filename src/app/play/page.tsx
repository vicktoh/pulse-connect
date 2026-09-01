import type { Metadata } from "next"
import { Suspense } from "react"

import { EventPlayLobby } from "@/components/events/event-play-lobby"

export const metadata: Metadata = {
  title: "Join PULSE Play",
  description: "Join the live PULSE Summit games, polls and audience leaderboard.",
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#061b34]" />}>
      <EventPlayLobby />
    </Suspense>
  )
}
