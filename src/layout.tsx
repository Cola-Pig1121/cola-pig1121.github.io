import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Template',
  description: 'Design Template',
  generator: 'Codebuddy',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
