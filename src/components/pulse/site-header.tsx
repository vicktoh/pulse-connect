import Image from "next/image"

import { Button } from "@/components/ui/button"

const NAV_LINKS = [
  { href: "https://thepulsesummit.org/#about", label: "About" },
  { href: "https://thepulsesummit.org/#labs", label: "Labs" },
  { href: "https://thepulsesummit.org/connect", label: "Connect" },
]

export function SiteHeader() {
  return (
    <nav className="sticky top-0 z-[var(--z-masthead)] flex h-16 items-center justify-between border-b border-line bg-white px-[5vw]">
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
          <a
            key={link.href}
            href={link.href}
            className="text-[13px] font-medium text-grey hover:text-navy"
          >
            {link.label}
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
