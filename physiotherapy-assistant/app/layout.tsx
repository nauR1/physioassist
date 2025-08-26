import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display } from "next/font/google"
import { Source_Sans_3 } from "next/font/google"
import "./globals.css"

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["400", "600", "700", "900"], // Including weights for professional typography
})

const sourceSansPro = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "PhysioAssist - AI Physiotherapy Assistant",
  description: "Professional AI-powered postural analysis for physiotherapists",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${sourceSansPro.variable} antialiased`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
