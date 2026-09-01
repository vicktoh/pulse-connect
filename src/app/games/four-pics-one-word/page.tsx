import type { Metadata } from "next"

import { FourPicsOneWordGame } from "@/components/games/four-pics-one-word-game"

export const metadata: Metadata = {
  title: "Four Pics, One Word | PULSE Play",
  description:
    "Connect four photographs, beat the clock and uncover the public-finance word in this PULSE Summit game.",
}

export default function FourPicsOneWordPage() {
  return <FourPicsOneWordGame />
}
