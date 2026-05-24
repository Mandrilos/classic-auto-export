'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ScrapedData {
  title: string
  price: number
  year: number
  description: string
  photos: string[]
}

export default function KleinanzeigenImport() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<ScrapedData | null>(null)

  const handleImport = async () => {
    const trimmed = url.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    setData(null)

    try {
      const res = await fetch('/api/admin/import-kleinanzeigen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Import failed')
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateListing = () => {
    if (!data) return
    try {
      sessionStorage.setItem('kleinanzeigen_import', JSON.stringify(data))
    } catch {
      // sessionStorage not available — proceed without pre-fill
    }
    router.push('/admin/cars/new?from=import')
  }

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-4">
        Import from Kleinanzeigen
      </h2>

      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleImport()}
          placeholder="https://www.kleinanzeigen.de/s-anzeige/..."
          className="input-field flex-1"
        />
        <button
          onClick={handleImport}
          disabled={loading || !url.trim()}
          className="btn-outline px-5 flex-shrink-0 flex items-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-[#666] border-t-transparent rounded-full animate-spin" />
              Fetching…
            </>
          ) : (
            'Import'
          )}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm mt-3">{error}</p>
      )}

      {data && (
        <div className="mt-5 border-t border-[#2a2a2a] pt-5 space-y-4">
          {/* Data summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#111] border border-[#2a2a2a] rounded p-3">
              <p className="text-xs text-[#555] mb-1">Title</p>
              <p className="text-sm text-[#e8e8e8] font-medium leading-snug">{data.title || '—'}</p>
            </div>
            <div className="bg-[#111] border border-[#2a2a2a] rounded p-3">
              <p className="text-xs text-[#555] mb-1">Price</p>
              <p className="text-sm text-gold-400 font-semibold">
                {data.price ? `€${data.price.toLocaleString()}` : '—'}
              </p>
            </div>
            <div className="bg-[#111] border border-[#2a2a2a] rounded p-3">
              <p className="text-xs text-[#555] mb-1">Year</p>
              <p className="text-sm text-[#e8e8e8] font-medium">{data.year || '—'}</p>
            </div>
          </div>

          {data.description && (
            <div className="bg-[#111] border border-[#2a2a2a] rounded p-3">
              <p className="text-xs text-[#555] mb-1">Description preview</p>
              <p className="text-xs text-[#888] leading-relaxed line-clamp-3">{data.description}</p>
            </div>
          )}

          {/* Photo strip */}
          {data.photos.length > 0 ? (
            <div>
              <p className="text-xs text-[#555] mb-2">
                {data.photos.length} photo{data.photos.length !== 1 ? 's' : ''} found
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {data.photos.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`Photo ${i + 1}`}
                    className="w-24 h-16 object-cover rounded border border-[#2a2a2a] flex-shrink-0"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#555]">No photos found — you can upload them manually in the form.</p>
          )}

          <button onClick={handleCreateListing} className="btn-gold">
            Create Listing from Import →
          </button>
        </div>
      )}
    </div>
  )
}
