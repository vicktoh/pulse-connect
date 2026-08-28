import { HeroStats } from "@/components/pulse/hero-stats"
import { SubmitDialog } from "@/components/pulse/submit-dialog"

/**
 * The one orchestrated entrance on the page.
 *
 * PRODUCT.md puts this band in the brand register and everything below it in
 * the product register, so the choreography stops at the hero's lower edge: a
 * reader who scrolls to the feed is reading, not watching. Four beats at 90ms,
 * finishing inside half a second, all on opacity and transform so nothing here
 * delays interaction with the call to action.
 */
export function Hero() {
  return (
    <section
      className="gradient-rule relative overflow-hidden bg-navy-midnight px-[5vw] pt-[52px] pb-11"
      style={{ "--stagger-step": "90ms" } as React.CSSProperties}
    >
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-end justify-between gap-10 max-[900px]:flex-col max-[900px]:items-start">
        <div className="max-w-[580px]">
          <div
            className="stagger mb-4 flex animate-rise items-center gap-2.5 text-[10px] font-bold tracking-[0.22em] text-amber uppercase"
            style={{ "--i": 0 } as React.CSSProperties}
          >
            PULSE Community
            <span
              aria-hidden
              className="inline-block h-px w-10 bg-amber opacity-35"
            />
          </div>
          <h1
            className="stagger mb-3.5 animate-rise text-[clamp(26px,4vw,40px)] text-white"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            The best ideas come
            <br />
            <em className="text-amber italic">from the ground.</em>
          </h1>
          <p
            className="stagger mb-7 animate-rise text-[15px] leading-[1.75] text-on-navy"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            The people closest to the gap often know exactly what needs to
            change. If you have seen a public finance breakdown up close, or
            witnessed something that worked, this is the space to put it on
            record. Your experience belongs in this conversation.
          </p>
          <div
            className="stagger animate-rise"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            <SubmitDialog />
          </div>
        </div>

        <div
          className="stagger flex animate-rise flex-col items-end gap-5 max-[900px]:flex-row max-[900px]:items-start"
          style={{ "--i": 3 } as React.CSSProperties}
        >
          <HeroStats />
        </div>
      </div>
    </section>
  )
}
