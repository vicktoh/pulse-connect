import type { Metadata } from "next"

import { BudgetOrBluffGame } from "@/components/games/budget-or-bluff-game"

export const metadata: Metadata = {
  title: "Budget or Bluff? | PULSE Play",
  description:
    "A fast public-finance fact-checking game show from PULSE Summit 2026.",
}

export default function BudgetOrBluffPage() {
  return <BudgetOrBluffGame />
}
