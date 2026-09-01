import type { Metadata } from "next"

import { ReformTrackerAdmin } from "@/components/events/reform-tracker-admin"
import { AdminGate } from "@/components/pulse/admin/admin-gate"

export const metadata: Metadata = {
  title: "Reform Tracker Desk · PULSE Play",
  robots: { index: false, follow: false },
}

export default function ReformTrackerAdminPage() {
  return <AdminGate><ReformTrackerAdmin /></AdminGate>
}
