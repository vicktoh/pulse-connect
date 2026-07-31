import { Button } from "@/components/ui/button"

/**
 * Reuses the empty-state geometry so a failure reads as a state of the board
 * rather than as a rupture in the page.
 *
 * Deliberately colourless: DESIGN.md §2 reserves Alarm Red for the Health
 * sector and says it "signals urgency, never error". A red-tinted panel here
 * would read as a Health submission, not as a problem.
 */
export function BoardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="px-5 py-15 text-center">
      <div className="mb-3.5 text-4xl">📡</div>
      <div className="mb-2 font-heading text-xl text-ink">
        We could not reach the record.
      </div>
      <p className="mx-auto mb-5 max-w-[380px] text-sm text-grey">
        Something went wrong loading the community board. Your connection may
        have dropped.
      </p>
      <Button variant="pill" size="pill" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
