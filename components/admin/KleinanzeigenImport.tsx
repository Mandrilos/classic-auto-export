'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ScrapedData {
  title: string
  price: number
  year: number
  description: string
  photos: string[]
  source_url: string
  brand: string
  model: string
  mileage: number | null
  condition: string | null
  first_registration: string | null
  fuel_type: string | null
  power_hp: number | null
  transmission: string | null
  body_type: string | null
  doors: number | null
  exterior_color: string | null
  interior_material: string | null
}

type SpecEntry = { label: string; value: string | number | null }

function buildSpecEntries(data: ScrapedData): SpecEntry[] {
  return [
    { label: 'Brand', value: data.brand || null },
    { label: 'Model', value: data.model || null },
    { label: 'Mileage', value: data.mileage != null ? `${data.mileage.toLocaleString()} km` : null },
    { label: 'First Reg.', value: data.first_registration },
    { label: 'Fuel', value: data.fuel_type },
    { label: 'Power', value: data.power_hp != null ? `${data.power_hp} HP` : null },
    { label: 'Gearbox', value: data.transmission },
    { label: 'Body', value: data.body_type },
    { label: 'Doors', value: data.doors },
    { label: 'Color', value: data.exterior_color },
    { label: 'Interior', value: data.interior_material },
    { label: 'Condition', value: data.condition },
  ].filter((e) => e.value != null && e.value !== '')
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
    } catch { /* sessionStorage unavailable */ }
    router.push('/admin/cars/new?from=import')
  }

  const specEntries = data ? buildSpecEntries(data) : []

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
              Importing…
            </>
          ) : (
            'Import'
          )}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

      {data && (
        <div className="mt-5 border-t border-[#2a2a2a] pt-5 space-y-4">
          {/* Main fields */}
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

          {/* Technical specs grid */}
          {specEntries.length > 0 && (
            <div className="bg-[#111] border border-[#2a2a2a] rounded p-3">
              <p className="text-xs text-[#555] mb-2">Technical Details</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                {specEntries.map(({ label, value }) => (
                  <div key={label} className="flex items-baseline gap-1.5 min-w-0">
                    <span className="text-xs text-[#444] flex-shrink-0">{label}:</span>
                    <span className="text-xs text-[#aaa] truncate">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                {data.photos.length} photo{data.photos.length !== 1 ? 's' : ''} uploaded to Supabase
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {data.photos.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`Photo ${i + 1}`}
                    className="w-24 h-16 object-cover rounded border border-[#2a2a2a] flex-shrink-0"
                    onError={(e) => { ;(e.currentTarget as HTMLImageElement).style.display = 'none' }}
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
