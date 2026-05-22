import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Classic Auto Export — Premium Classic Cars for International Buyers',
  description:
    'Browse our curated collection of classic and vintage automobiles available for export worldwide. Transparent pricing, full documentation, global shipping.',
  keywords: 'classic cars, vintage cars, car export, collector cars, European classics',
  openGraph: {
    title: 'Classic Auto Export',
    description: 'Premium classic cars for international buyers',
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
