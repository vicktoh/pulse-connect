import type { Metadata } from "next"

import { LookAgainGame } from "@/components/games/look-again-game"

export const metadata: Metadata = {
  title: "Look Again | PULSE Play",
  description:
    "Inspect familiar public-service scenes, spot what is wrong, and race the clock in this PULSE Summit game.",
}

export default function LookAgainPage() {
  return <LookAgainGame />
}
