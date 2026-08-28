"use client"

import { useBoard } from "@/components/pulse/submissions-provider"

export function HeroStats() {
  const { submissions, state } = useBoard()
  const ready = state === "ready"

  return (
    <>
      <Stat
        value={ready ? submissions.length : null}
        label="Experiences shared"
      />
      <Stat
        value={ready ? submissions.filter((s) => s.status === "cited").length : null}
        label="Cited by IBP"
      />
    </>
  )
}

function Stat({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="text-right max-[900px]:text-left">
      {/* An em-dash while loading, never 0 — a civic evidence board flashing
          "0 Experiences shared" before correcting itself reads as a claim
          about the world, not as a loading state.

          The figure rolls up into place rather than counting up from zero, for
          the same reason: a tally that races through numbers it was never at is
          animating a claim. It arrives at the count it always had. */}
      <div className="grid justify-items-end overflow-hidden font-heading text-[32px] leading-none font-semibold text-white max-[900px]:justify-items-start">
        <span key={value ?? "loading"} className="animate-roll-up [grid-area:1/1]">
          {value ?? "—"}
        </span>
      </div>
      <div className="mt-1 text-[11px] tracking-[0.08em] text-on-navy-muted uppercase">
        {label}
      </div>
    </div>
  )
}
