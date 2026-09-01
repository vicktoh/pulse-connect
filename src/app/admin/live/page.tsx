import type { Metadata } from "next"

import { LiveControlRoom } from "@/components/events/live-control-room"
import { AdminGate } from "@/components/pulse/admin/admin-gate"

export const metadata: Metadata = {
  title: "Live Control Room · PULSE Play",
  robots: { index: false, follow: false },
}

export default function LiveAdminPage() {
  return <AdminGate><LiveControlRoom /></AdminGate>
}
