import type { Metadata } from "next"
import Link from "next/link"

import { SiteHeader } from "@/components/pulse/site-header"

export const metadata: Metadata = {
  title: "Moderation · PULSE Community",
  // The queue holds unpublished testimony and submitter contact details.
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader />
      <nav className="flex items-center justify-center gap-2 border-b-2 border-ink bg-paper-2 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-ink">
        <Link className="border-2 border-ink bg-white px-4 py-2 shadow-[3px_3px_0_#061b34]" href="/admin">Moderation</Link>
        <Link className="border-2 border-ink bg-lime px-4 py-2 shadow-[3px_3px_0_#061b34]" href="/admin/live">Live event control</Link>
        <Link className="border-2 border-ink bg-[#13c8d5] px-4 py-2 shadow-[3px_3px_0_#061b34]" href="/admin/reform-tracker">Reform tracker</Link>
      </nav>
      <div className="flex-1 bg-paper-2">{children}</div>
    </>
  )
}
