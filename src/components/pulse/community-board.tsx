"use client"

import { useMemo, useState } from "react"

import { BoardError } from "@/components/pulse/board-error"
import { BoardSkeleton } from "@/components/pulse/board-skeleton"
import { SubmissionCard } from "@/components/pulse/submission-card"
import { useBoard } from "@/components/pulse/submissions-provider"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LAB_FILTER_ACTIVE, LABS, SECTORS, type Sector } from "@/lib/pulse/labs"
import { cn } from "@/lib/utils"

type LabFilter = Sector | "all"
type StatusFilter = "all" | "cited"
type SortKey = "recent" | "supported"

const SORT_ITEMS = [
  { value: "recent", label: "Most Recent" },
  { value: "supported", label: "Most Supported" },
]

export function CommunityBoard({ sidebar }: { sidebar: React.ReactNode }) {
  const {
    submissions,
    state,
    retry,
    supported,
    pending,
    toggleSupport,
    supportError,
  } = useBoard()

  const [activeLab, setActiveLab] = useState<LabFilter>("all")
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all")
  const [sort, setSort] = useState<SortKey>("recent")

  const visible = useMemo(() => {
    const filtered = submissions.filter(
      (s) =>
        (activeLab === "all" || s.sector === activeLab) &&
        (activeStatus === "all" || s.status === activeStatus)
    )
    return [...filtered].sort((a, b) =>
      sort === "supported"
        ? b.supportCount - a.supportCount
        : b.createdAt.getTime() - a.createdAt.getTime()
    )
  }, [submissions, activeLab, activeStatus, sort])

  return (
    <>
      {/* Control bar — pins directly beneath the 64px masthead. */}
      <div className="sticky top-16 z-[var(--z-control)] border-b border-line bg-paper-2 px-[5vw] py-4">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-2.5">
          <span className="mr-0.5 text-[11px] font-bold tracking-[0.08em] text-grey-light uppercase">
            Filter
          </span>

          <FilterPill
            active={activeLab === "all"}
            onClick={() => setActiveLab("all")}
          >
            All
          </FilterPill>
          {SECTORS.map((sector) => (
            <FilterPill
              key={sector}
              active={activeLab === sector}
              activeClassName={LAB_FILTER_ACTIVE[sector]}
              onClick={() => setActiveLab(sector)}
            >
              {LABS[sector].icon} {LABS[sector].label}
            </FilterPill>
          ))}

          <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line-strong" />

          <FilterPill
            active={activeStatus === "all"}
            onClick={() => setActiveStatus("all")}
          >
            All Statuses
          </FilterPill>
          <FilterPill
            active={activeStatus === "cited"}
            onClick={() => setActiveStatus("cited")}
          >
            Cited by IBP
          </FilterPill>

          <Select
            items={SORT_ITEMS}
            value={sort}
            onValueChange={(value) => setSort(value as SortKey)}
          >
            <SelectTrigger size="pill" className="ml-auto" aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mx-auto my-8 grid max-w-[1100px] grid-cols-1 gap-7 px-[5vw] pb-20 min-[900px]:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-heading text-xl text-ink">
              What people are sharing
            </h2>
            <span className="text-[13px] text-grey-light">
              {state === "ready"
                ? `${visible.length} account${visible.length !== 1 ? "s" : ""}`
                : ""}
            </span>
          </div>

          {supportError ? (
            <p
              role="status"
              className="mb-4 rounded-lg bg-paper-3 px-4 py-3 text-[13px] text-grey"
            >
              {supportError}
            </p>
          ) : null}

          {state === "loading" ? <BoardSkeleton /> : null}
          {state === "error" ? <BoardError onRetry={retry} /> : null}

          {state === "ready" &&
            (visible.length > 0 ? (
              visible.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  isSupported={supported.has(submission.id)}
                  isPending={pending.has(submission.id)}
                  onToggleSupport={toggleSupport}
                />
              ))
            ) : (
              <div className="px-5 py-15 text-center">
                <div className="mb-3.5 text-4xl">💬</div>
                <div className="mb-2 font-heading text-xl text-ink">
                  No scenarios here yet.
                </div>
                <p className="text-sm text-grey">
                  Be the first to put something on record from this sector.
                </p>
              </div>
            ))}
        </div>

        {sidebar}
      </div>
    </>
  )
}

function FilterPill({
  active,
  activeClassName,
  onClick,
  children,
}: {
  active: boolean
  activeClassName?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      variant="pill"
      size="pill"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "whitespace-nowrap",
        active &&
          (activeClassName ??
            "border-navy-midnight bg-navy-midnight text-white hover:border-navy-midnight hover:text-white")
      )}
    >
      {children}
    </Button>
  )
}
