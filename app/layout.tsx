import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import RegisterSW from "./register-sw"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "QuizTech - Ingeniería de Sistemas",
  description: "Aplicación de quiz educativa para estudiantes de ingeniería de sistemas",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    apple: "/icons/brain-logo.svg"
}
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
      </head>
      <body className={`${_geist.className} ${_geistMono.className} font-sans antialiased`}>
        {children}
        <Analytics />
        <RegisterSW />
      </body>
    </html>
  )
}
