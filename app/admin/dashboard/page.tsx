'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Car } from '@/types/car'

export default function AdminDashboard() {
  const router = useRouter()
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchCars = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false })
    setCars(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCars() }, [fetchCars])

  const handleDelete = async (car: Car) => {
    if (!confirm(`Delete "${car.title}"? This cannot be undone.`)) return

    setDeleting(car.id)
    try {
      // Remove photos from storage
      if (car.photos?.length) {
        const paths = car.photos.map((url) => {
          const urlObj = new URL(url)
          const parts = urlObj.pathname.split('/object/public/car-photos/')
          return parts[1] ?? ''
        }).filter(Boolean)

        if (paths.length) {
          await supabase.storage.from('car-photos').remove(paths)
        }
      }

      await supabase.from('cars').delete().eq('id', car.id)
      setCars((prev) => prev.filter((c) => c.id !== car.id))
    } finally {
      setDeleting(null)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
    router.refresh()
  }

  const filtered = cars.filter(
    (c) =>
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.brand.toLowerCase().includes(search.toLowerCase()) ||
      c.model.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs text-[#555] mb-1">
            <Link href="/" className="hover:text-gold-400 transition-colors">Classic Auto Export</Link>
            {' '}·{' '}
            <span>Admin</span>
          </div>
          <h1 className="text-xl font-bold text-[#e8e8e8]">Car Listings</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/cars/new" className="btn-gold">
            + Add Car
          </Link>
          <button onClick={handleLogout} className="btn-ghost text-[#555]">
            Sign out
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Listings" value={cars.length} />
        <StatCard label="Total Value" value={`€${cars.reduce((s, c) => s + c.price, 0).toLocaleString()}`} />
        <StatCard label="Brands" value={new Set(cars.map((c) => c.brand)).size} />
        <StatCard label="With Photos" value={cars.filter((c) => c.photos?.length > 0).length} />
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, brand or model..."
          className="input-field max-w-sm"
        />
      </div>

      {/* Cars table / cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-[#555] mb-4">{search ? 'No results' : 'No cars listed yet'}</p>
          {!search && (
            <Link href="/admin/cars/new" className="btn-gold inline-flex">
              Add your first car
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((car) => (
            <div
              key={car.id}
              className="card p-4 flex items-center gap-4 hover:border-[#3a3a3a] transition-colors"
            >
              {/* Thumbnail */}
              <div className="w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a]">
                {car.photos?.[0] ? (
                  <Image
                    src={car.photos[0]}
                    alt={car.title}
                    width={64}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-[#e8e8e8] truncate">{car.title}</h3>
                <p className="text-xs text-[#555] mt-0.5">
                  {car.brand} · {car.year} · {car.photos?.length ?? 0} photos
                </p>
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-gold-400 font-semibold text-sm">€{car.price.toLocaleString()}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/cars/${car.id}`}
                  target="_blank"
                  className="btn-ghost py-1.5 px-2 text-xs"
                  title="View public page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
                <Link
                  href={`/admin/cars/${car.id}/edit`}
                  className="btn-outline py-1.5 px-3 text-xs"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(car)}
                  disabled={deleting === car.id}
                  className="btn-danger py-1.5 px-3 text-xs"
                >
                  {deleting === car.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-[#555] mb-1">{label}</p>
      <p className="text-lg font-bold text-[#e8e8e8]">{value}</p>
    </div>
  )
}
