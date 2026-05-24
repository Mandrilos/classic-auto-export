import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'German Classics Export — Classic Cars from Germany, Shipped Worldwide',
  description:
    'Classic cars sourced and exported from Germany to the world. Every vehicle personally selected, documented and shipped with full transparency.',
  keywords: 'classic cars, vintage cars, car export Germany, collector cars, German classics, classic car export',
  openGraph: {
    title: 'German Classics Export',
    description: 'Classic cars sourced and exported from Germany to the world.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
