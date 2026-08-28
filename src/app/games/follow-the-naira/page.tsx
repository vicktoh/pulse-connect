import type { Metadata } from "next"

import { FollowTheNairaGame } from "@/components/games/follow-the-naira-game"

export const metadata: Metadata = {
  title: "Follow the Naira | PULSE Play",
  description:
    "A fast, colourful public-finance game show from PULSE Summit 2026.",
}

export default function FollowTheNairaPage() {
  return <FollowTheNairaGame />
}
