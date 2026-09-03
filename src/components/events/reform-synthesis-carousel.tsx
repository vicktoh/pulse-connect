"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, MoveRight, Network, Sparkles } from "lucide-react"

import { LABS, type ReformSynthesisPoint } from "@/lib/events/types"
import styles from "./reform-synthesis-carousel.module.css"

const LAB_IMAGES = {
  health: "/images/labs/health.webp",
  water: "/images/labs/water.webp",
  education: "/images/labs/education.webp",
  "social-protection": "/images/labs/social-protection.webp",
  "debt-accountability": "/images/labs/debt-accountability.webp",
} as const

const POINT_ACCENTS = ["#13c8d5", "#f5aa2c", "#9ce13b", "#ff654f", "#a960ff"]

export function ReformSynthesisCarousel({
  points,
  compact = false,
}: {
  points: ReformSynthesisPoint[]
  compact?: boolean
}) {
  const overarching = useMemo(() => points.filter((point) => point.kind === "cross-lab"), [points])
  const labThemes = useMemo(() => points.filter((point) => point.kind === "lab-theme"), [points])
  const [activeIndex, setActiveIndex] = useState(0)
  const effectiveIndex = activeIndex < overarching.length ? activeIndex : 0
  const active = overarching[effectiveIndex]

  function move(direction: -1 | 1) {
    if (!overarching.length) return
    setActiveIndex((current) => (current + direction + overarching.length) % overarching.length)
  }

  if (!active) {
    return <section className={styles.empty}><Sparkles /><h2>Cross-lab insights are being prepared.</h2><p>The synthesis will appear here as soon as it is published.</p></section>
  }

  const accent = POINT_ACCENTS[effectiveIndex % POINT_ACCENTS.length]
  const activeLabs = active.labIds.map((id) => LABS.find((lab) => lab.id === id)).filter(Boolean)

  return (
    <section className={styles.experience} data-compact={compact ? "true" : "false"} aria-label="Cross-lab synthesis">
      <div className={styles.sectionIntro}>
        <div><span><Network /> CROSS-LAB SYNTHESIS</span><h1>Five labs.<br /><em>One reform picture.</em></h1></div>
        <p>Move through the shared ideas connecting every Reform Signal, then explore the theme emerging from each individual lab.</p>
      </div>

      <article
        className={styles.stage}
        style={{ "--insight-accent": accent } as React.CSSProperties}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(-1)
          if (event.key === "ArrowRight") move(1)
        }}
        key={active.id}
      >
        <aside className={styles.visual} aria-hidden="true">
          <span className={styles.ordinal}>{String(effectiveIndex + 1).padStart(2, "0")}</span>
          <div className={styles.orbit}>
            <div className={styles.orbitCore}><Network /><small>{activeLabs.length}</small><span>LABS<br />CONNECTED</span></div>
            {activeLabs.map((lab) => <i className={styles.orbitNode} style={{ "--lab-color": lab?.accent } as React.CSSProperties} key={lab?.id}>{lab?.icon}</i>)}
          </div>
          <div className={styles.labChips}>{activeLabs.map((lab) => <span style={{ "--lab-color": lab?.accent } as React.CSSProperties} key={lab?.id}><i />{lab?.shortName}</span>)}</div>
        </aside>

        <div className={styles.story}>
          <span className={styles.eyebrow}>{active.eyebrow} · OVERARCHING POINT {effectiveIndex + 1} OF {overarching.length}</span>
          <h2>{active.title}</h2>
          <p className={styles.summary}>{active.summary}</p>
          <div className={styles.evidenceGrid}>
            {active.evidence.slice(0, 3).map((evidence, index) => <div key={evidence}><span>0{index + 1}</span><p>{evidence}</p></div>)}
          </div>
          <div className={styles.action}><span>WHAT THIS MEANS</span><p>{active.action}</p><MoveRight /></div>
        </div>
      </article>

      <div className={styles.carouselControls}>
        <button onClick={() => move(-1)} aria-label="Previous overarching point"><ArrowLeft /></button>
        <div className={styles.progress} aria-label={`Point ${effectiveIndex + 1} of ${overarching.length}`}>
          {overarching.map((point, index) => <button data-active={index === effectiveIndex ? "true" : "false"} onClick={() => setActiveIndex(index)} aria-label={`Show point ${index + 1}: ${point.title}`} key={point.id}><i /><span>{String(index + 1).padStart(2, "0")}</span></button>)}
        </div>
        <button onClick={() => move(1)} aria-label="Next overarching point"><ArrowRight /></button>
      </div>

      {labThemes.length > 0 && <section className={styles.labThemes}>
        <header><div><span>THE LAB LENS</span><h2>One defining theme from each room.</h2></div><p>Each theme condenses the central accountability move in that lab&apos;s Reform Signals.</p></header>
        <div>{labThemes.map((theme) => {
          const lab = LABS.find((item) => item.id === theme.labIds[0]) ?? LABS[0]
          return <article style={{ "--lab-color": lab.accent } as React.CSSProperties} key={theme.id}><Image src={LAB_IMAGES[lab.id]} alt="" width={640} height={640} sizes="54px" /><span>{lab.name}</span><h3>{theme.title}</h3><p>{theme.summary}</p><small>{theme.action}</small></article>
        })}</div>
      </section>}
    </section>
  )
}
