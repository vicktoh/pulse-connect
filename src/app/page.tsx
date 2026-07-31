import { CommunityBoard } from "@/components/pulse/community-board"
import { Hero } from "@/components/pulse/hero"
import { HowItWorks } from "@/components/pulse/how-it-works"
import { Sidebar } from "@/components/pulse/sidebar"
import { SiteFooter } from "@/components/pulse/site-footer"
import { SiteHeader } from "@/components/pulse/site-header"
import { SubmissionsProvider } from "@/components/pulse/submissions-provider"

export default function CommunityPage() {
  return (
    // The provider wraps the whole page, not just the board, so the live leaves
    // inside Hero and Sidebar can reach it. Everything below that is not a
    // client leaf stays server-rendered.
    <SubmissionsProvider>
      <SiteHeader />
      <Hero />
      <HowItWorks />
      <main className="flex-1">
        <CommunityBoard sidebar={<Sidebar />} />
      </main>
      <SiteFooter />
    </SubmissionsProvider>
  )
}
