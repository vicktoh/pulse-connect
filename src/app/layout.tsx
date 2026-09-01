import type { Metadata } from "next"
import { Fraunces, Inter } from "next/font/google"

import { FirebaseAuthProvider } from "@/lib/firebase/auth-provider"
import { EventPlayerProvider } from "@/lib/events/event-player-provider"
import "./globals.css"

/** Inter carries all UI, prose, labels and controls. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

/**
 * Fraunces carries every heading, every stat number, and the testimony itself.
 * Italic is loaded because the hero's emphasised clause depends on it.
 */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: "PULSE Community: Where Real Experience Shapes Public Finance",
  description:
    "The people closest to the gap often know exactly what needs to change. Share what you have seen in the public finance chain and put it on record.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <FirebaseAuthProvider>
          <EventPlayerProvider>{children}</EventPlayerProvider>
        </FirebaseAuthProvider>
      </body>
    </html>
  )
}
