"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "https://thepulsesummit.org/#about", label: "About" },
  { href: "https://thepulsesummit.org/#labs", label: "Labs" },
  { href: "https://thepulsesummit.org/connect", label: "Connect" },
]

/**
 * The masthead earns its shadow.
 *
 * DESIGN.md §5: "the resting state of the entire page is flat. Elevation
 * appears only on hover and for the modal. Depth signals interaction." A
 * masthead that is pinned over scrolled content is exactly that case — it is
 * overlapping something — so the hairline resolves into a shadow once there is
 * content beneath it, and returns to flat at the top of the page.
 *
 * A scroll listener rather than `animation-timeline: scroll()`, which is still
 * Chromium-only: a masthead that behaves differently per browser is worse than
 * one that costs a passive listener.
 */
export function SiteHeader() {
  const [lifted, setLifted] = useState(false)

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      className={cn(
        "sticky top-0 z-[var(--z-masthead)] flex h-16 items-center justify-between border-b bg-white px-[5vw] transition-[box-shadow,border-color] duration-[var(--duration-state)] ease-out-quart",
        lifted ? "border-transparent shadow-card" : "border-line"
      )}
    >
      <a href="https://thepulsesummit.org" className="flex items-center">
        <Image
          src="/pulse-logo.png"
          alt="PULSE Summit 2026"
          width={180}
          height={38}
          priority
          className="block h-9 w-auto max-w-[180px]"
        />
      </a>
      <div className="hidden items-center gap-7 sm:flex">
        {NAV_LINKS.map((link) => (
          // The rule wipes out from the centre on hover. It is 1px of Signal
          // Navy, the same weight as the hairlines everywhere else, so the
          // masthead gains a hover state without gaining a new visual idiom.
          <a
            key={link.href}
            href={link.href}
            className="group relative text-[13px] font-medium text-grey transition-colors duration-[var(--duration-state)] ease-out-quart hover:text-navy"
          >
            {link.label}
            <span
              aria-hidden
              className="absolute -bottom-1 left-0 h-px w-full origin-center scale-x-0 bg-navy transition-transform duration-[var(--duration-state)] ease-out-quart group-hover:scale-x-100"
            />
          </a>
        ))}
        <Button
          variant="cta"
          size="cta-sm"
          nativeButton={false}
          render={<a href="https://thepulsesummit.org/register" />}
        >
          Register Free
        </Button>
      </div>
    </nav>
  )
}
