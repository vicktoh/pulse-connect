import { Fragment } from "react"

const STEPS = [
  { strong: "Share what you witnessed", rest: " in your sector or community" },
  { strong: "IBP reviews", rest: " and publishes within 48 hours" },
  { strong: "Others respond", rest: ' with "I have seen this too"' },
  { strong: "The strongest accounts", rest: " shape the next PULSE cycle" },
]

export function HowItWorks() {
  return (
    <div className="border-b border-line bg-white px-[5vw] py-7">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-10">
        <span className="shrink-0 text-[10px] font-bold tracking-[0.18em] text-grey-light uppercase">
          How it works
        </span>
        <div className="flex flex-wrap gap-4 sm:gap-8">
          {STEPS.map((step, i) => (
            <Fragment key={step.strong}>
              {i > 0 && (
                <span
                  aria-hidden
                  className="hidden text-[18px] text-line-strong sm:inline"
                >
                  ›
                </span>
              )}
              <div className="flex items-center gap-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-navy-midnight text-[11px] font-extrabold text-white">
                  {i + 1}
                </div>
                <div className="text-[13px] text-grey">
                  <strong className="font-semibold text-ink">
                    {step.strong}
                  </strong>
                  {step.rest}
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
