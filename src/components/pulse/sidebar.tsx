import { ActivityByLab } from "@/components/pulse/activity-by-lab"

function SidebarCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-5 overflow-hidden rounded-lg border border-line bg-white">
      <header className="gradient-rule relative bg-navy-midnight px-5 py-4">
        <h2 className="font-heading text-base font-semibold text-white">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-[3px] text-xs text-on-navy-muted">{subtitle}</p>
        ) : null}
      </header>
      <div className="px-5 py-[18px]">{children}</div>
    </section>
  )
}

/** TODO(cms): pull digest entries from the CMS. */
const DIGEST = [
  {
    title: "First community digest coming after the summit",
    meta: "Publishing after September 3 · Watch this space",
  },
  {
    title: "Have something to share? Help shape PULSE 2027",
    meta: "Submissions open now",
  },
]

const GUIDELINES = [
  "Share from direct experience, field observation, or credible evidence",
  "Be specific: name the sector, the level of government, the gap",
  "Focus on what happened and what changed it",
  "Do not name individuals or make accusations",
  "All accounts are reviewed by IBP before publishing",
]

/**
 * Stays a server component. Only the Activity block is live — it is a client
 * leaf reading the board context, so the navy card headers, the digest and the
 * guidelines below still ship with no JavaScript.
 */
export function Sidebar() {
  return (
    <aside className="max-[900px]:order-first">
      <SidebarCard
        title="Activity by Lab"
        subtitle="Where the conversation is happening"
      >
        <ActivityByLab />
      </SidebarCard>

      <SidebarCard
        title="Latest from IBP"
        subtitle="Quarterly community digest"
      >
        {DIGEST.map((item) => (
          <div
            key={item.title}
            className="border-b border-paper-3 py-2.5 last:border-b-0 last:pb-0"
          >
            <div className="mb-[3px] text-[13px] leading-[1.35] font-semibold text-ink">
              {item.title}
            </div>
            <div className="text-[11.5px] text-grey-light">{item.meta}</div>
          </div>
        ))}
      </SidebarCard>

      <SidebarCard title="Community Guidelines">
        <ul>
          {GUIDELINES.map((item) => (
            <li
              key={item}
              className="flex gap-2.5 border-b border-paper-3 py-[7px] text-[13px] leading-[1.5] text-grey last:border-b-0 last:pb-0"
            >
              <span aria-hidden className="shrink-0 font-bold text-verified">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </SidebarCard>
    </aside>
  )
}
