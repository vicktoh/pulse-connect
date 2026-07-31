import { HeroStats } from "@/components/pulse/hero-stats"
import { SubmitDialog } from "@/components/pulse/submit-dialog"

export function Hero() {
  return (
    <section className="gradient-rule relative overflow-hidden bg-navy-midnight px-[5vw] pt-[52px] pb-11">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-end justify-between gap-10 max-[900px]:flex-col max-[900px]:items-start">
        <div className="max-w-[580px]">
          <div className="mb-4 flex items-center gap-2.5 text-[10px] font-bold tracking-[0.22em] text-amber uppercase">
            PULSE Community
            <span
              aria-hidden
              className="inline-block h-px w-10 bg-amber opacity-35"
            />
          </div>
          <h1 className="mb-3.5 text-[clamp(26px,4vw,40px)] text-white">
            The best ideas come
            <br />
            <em className="text-amber italic">from the ground.</em>
          </h1>
          <p className="mb-7 text-[15px] leading-[1.75] text-on-navy">
            The people closest to the gap often know exactly what needs to
            change. If you have seen a public finance breakdown up close, or
            witnessed something that worked, this is the space to put it on
            record. Your experience belongs in this conversation.
          </p>
          <SubmitDialog />
        </div>

        <div className="flex flex-col items-end gap-5 max-[900px]:flex-row max-[900px]:items-start">
          <HeroStats />
        </div>
      </div>
    </section>
  )
}
