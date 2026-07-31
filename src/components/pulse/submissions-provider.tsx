"use client"

import { createContext, useContext, useMemo } from "react"

import { useSubmissionsFeed, type FeedState } from "@/lib/pulse/use-submissions"
import { useSupports } from "@/lib/pulse/use-supports"
import type { Submission } from "@/lib/pulse/submissions"

type BoardValue = {
  submissions: Submission[]
  state: FeedState
  retry: () => void
  supported: ReadonlySet<string>
  pending: ReadonlySet<string>
  toggleSupport: (submissionId: string) => void
  supportError: string | null
}

const BoardContext = createContext<BoardValue | null>(null)

/**
 * Owns the live feed and support ledger for the whole page.
 *
 * Deliberately wraps the entire tree rather than just the board, so that leaves
 * living inside *server* components — <HeroStats/> inside <Hero/>, and
 * <ActivityByLab/> inside the <Sidebar/> that is passed to <CommunityBoard/> as
 * an opaque ReactNode slot — can still read this context. A client element
 * rendered inside a server component mounts at its true position in the React
 * tree, so useContext resolves here regardless of the prop slot it travelled
 * through. That is what keeps HowItWorks, the footer, the digest, the
 * guidelines and every navy card header server-rendered with zero JavaScript.
 */
export function SubmissionsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { submissions, state, retry } = useSubmissionsFeed()
  const { supported, pending, toggleSupport, supportError } = useSupports()

  const value = useMemo(
    () => ({
      submissions,
      state,
      retry,
      supported,
      pending,
      toggleSupport,
      supportError,
    }),
    [submissions, state, retry, supported, pending, toggleSupport, supportError]
  )

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}

export function useBoard() {
  const value = useContext(BoardContext)
  if (!value) {
    throw new Error("useBoard must be used within <SubmissionsProvider>")
  }
  return value
}
