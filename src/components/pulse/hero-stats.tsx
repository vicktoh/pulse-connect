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
          about the world, not as a loading state. */}
      <div
        key={value ?? "loading"}
        className="animate-in fade-in slide-in-from-bottom-1 font-heading text-[32px] leading-none font-semibold text-white duration-300 motion-reduce:animate-none"
      >
        {value ?? "—"}
      </div>
      <div className="mt-1 text-[11px] tracking-[0.08em] text-on-navy-muted uppercase">
        {label}
      </div>
    </div>
  )
}
