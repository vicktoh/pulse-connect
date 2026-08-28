/**
 * Placeholder cards held while the first snapshot lands.
 *
 * Geometry matches the real submission card exactly — same radius, same
 * asymmetric padding (26px left to clear the rail), same block metrics — so
 * the real cards replace these in place with no reflow.
 *
 * The rail is neutral Defined Hairline rather than a sector colour: sector
 * colour is load-bearing in this system (DESIGN.md §2), and inventing one for
 * a submission whose sector is not yet known would be a false signal.
 *
 * The placeholder sweeps rather than throbs. A pulse on the whole block reads
 * as a slab breathing; a single composited highlight travelling left to right
 * reads as work in progress and has a direction to it. Each card's sweep is
 * offset from the one above so the three do not move as one object.
 */
function Line({ className }: { className?: string }) {
  return <div className={`h-3 rounded-full bg-paper-3 ${className ?? ""}`} />
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      style={{ "--i": index } as React.CSSProperties}
      className="skeleton stagger mb-4 animate-rise rounded-lg border border-line bg-white"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-line-strong" />

      <div className="flex items-start justify-between gap-3 pt-5 pr-[22px] pl-[26px]">
        <div className="flex items-center gap-2.5">
          <div className="size-9 shrink-0 rounded-[8px] bg-paper-3" />
          <div className="space-y-1.5">
            <Line className="w-32" />
            <Line className="h-2.5 w-44" />
          </div>
        </div>
        <div className="h-5 w-20 rounded-full bg-paper-3" />
      </div>

      <div className="pt-3.5 pr-[22px] pb-[18px] pl-[26px]">
        <Line className="mb-2.5 h-2 w-24" />
        <div className="mb-3.5 space-y-2">
          <Line className="w-full" />
          <Line className="w-full" />
          <Line className="w-3/4" />
        </div>
        <Line className="mb-2.5 h-2 w-40" />
        <div className="space-y-2">
          <Line className="h-2.5 w-full" />
          <Line className="h-2.5 w-5/6" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-paper-3 pt-3 pr-[22px] pb-3.5 pl-[26px]">
        <div className="h-5 w-24 rounded-full bg-paper-3" />
        <div className="h-6 w-40 rounded-full bg-paper-3" />
      </div>
    </div>
  )
}

export function BoardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading community accounts">
      <SkeletonCard index={0} />
      <SkeletonCard index={1} />
      <SkeletonCard index={2} />
    </div>
  )
}
