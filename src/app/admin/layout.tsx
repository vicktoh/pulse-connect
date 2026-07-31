import type { Metadata } from "next"

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
      <main className="flex-1 bg-paper-2">{children}</main>
    </>
  )
}
