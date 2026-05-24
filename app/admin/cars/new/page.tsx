'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CarForm from '@/components/admin/CarForm'
import type { CarInsert } from '@/types/car'

interface ImportedData {
  title: string
  price: number
  year: number
  description: string
  photos: string[]
}

export default function NewCarPage() {
  const [ready, setReady] = useState(false)
  const [imported, setImported] = useState<ImportedData | null>(null)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('kleinanzeigen_import')
      if (stored) {
        setImported(JSON.parse(stored))
        sessionStorage.removeItem('kleinanzeigen_import')
      }
    } catch {
      // sessionStorage unavailable or JSON parse error
    }
    setReady(true)
  }, [])

  const initialData: Partial<CarInsert> | undefined = imported
    ? {
        title: imported.title,
        price: imported.price,
        year: imported.year,
        description: imported.description,
      }
    : undefined

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-xs text-[#555] mb-3">
          <Link href="/admin/dashboard" className="hover:text-gold-400 transition-colors">
            Dashboard
          </Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>New Listing</span>
        </nav>
        <h1 className="text-2xl font-bold text-[#e8e8e8]">Add New Car</h1>
        <p className="text-[#555] text-sm mt-1">
          {imported
            ? 'Pre-filled from Kleinanzeigen — review all fields and upload photos before publishing'
            : 'Create a new listing for the public catalog'}
        </p>
      </div>

      {!ready && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {ready && (
        <>
          {/* Scraped photos reference panel */}
          {imported && imported.photos.length > 0 && (
            <div className="card p-5 mb-6 bg-[#0d0d0d]">
              <p className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-1">
                Photos from Kleinanzeigen
              </p>
              <p className="text-xs text-[#444] mb-3">
                Click to open full-size, then save and upload via the Photos section below.
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imported.photos.map((src, i) => (
                  <a
                    key={i}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Scraped photo ${i + 1}`}
                      className="w-28 h-20 object-cover rounded border border-[#2a2a2a] hover:border-gold-500/60 transition-colors"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          <CarForm mode="create" initialData={initialData} />
        </>
      )}
    </div>
  )
}
