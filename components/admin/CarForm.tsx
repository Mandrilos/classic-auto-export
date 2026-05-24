'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CAR_BRANDS, DESTINATION_COUNTRIES, type Car, type CarInsert } from '@/types/car'
import ImageUpload from './ImageUpload'

interface CarFormProps {
  car?: Car
  mode: 'create' | 'edit'
  initialData?: Partial<CarInsert>
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => CURRENT_YEAR - i)

export default function CarForm({ car, mode, initialData }: CarFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<CarInsert>({
    title: car?.title ?? initialData?.title ?? '',
    brand: car?.brand ?? initialData?.brand ?? '',
    model: car?.model ?? initialData?.model ?? '',
    year: car?.year ?? initialData?.year ?? 1970,
    price: car?.price ?? initialData?.price ?? 0,
    description: car?.description ?? initialData?.description ?? '',
    destination_countries: car?.destination_countries ?? initialData?.destination_countries ?? [],
    photos: car?.photos ?? initialData?.photos ?? [],
    source_url: car?.source_url ?? initialData?.source_url ?? null,
    mileage: car?.mileage ?? initialData?.mileage ?? null,
    condition: car?.condition ?? initialData?.condition ?? null,
    first_registration: car?.first_registration ?? initialData?.first_registration ?? null,
    fuel_type: car?.fuel_type ?? initialData?.fuel_type ?? null,
    power_hp: car?.power_hp ?? initialData?.power_hp ?? null,
    transmission: car?.transmission ?? initialData?.transmission ?? null,
    body_type: car?.body_type ?? initialData?.body_type ?? null,
    doors: car?.doors ?? initialData?.doors ?? null,
    exterior_color: car?.exterior_color ?? initialData?.exterior_color ?? null,
    interior_material: car?.interior_material ?? initialData?.interior_material ?? null,
  })

  const setField = <K extends keyof CarInsert>(key: K, value: CarInsert[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const toggleCountry = (country: string) => {
    setField(
      'destination_countries',
      form.destination_countries.includes(country)
        ? form.destination_countries.filter((c) => c !== country)
        : [...form.destination_countries, country]
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (mode === 'create') {
        const { error: dbError } = await supabase.from('cars').insert([form])
        if (dbError) throw dbError
      } else if (car) {
        const { error: dbError } = await supabase.from('cars').update(form).eq('id', car.id)
        if (dbError) throw dbError
      }

      router.push('/admin/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-300 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Basic info */}
      <section className="card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider">Basic Information</h2>

        <div>
          <label className="label">Listing Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="e.g. 1967 Ferrari 275 GTB/4 — Matching Numbers"
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Brand *</label>
            <select
              required
              value={form.brand}
              onChange={(e) => setField('brand', e.target.value)}
              className="input-field"
            >
              <option value="">Select brand</option>
              {CAR_BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Model *</label>
            <input
              type="text"
              required
              value={form.model}
              onChange={(e) => setField('model', e.target.value)}
              placeholder="e.g. 275 GTB/4"
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Year *</label>
            <select
              required
              value={form.year}
              onChange={(e) => setField('year', parseInt(e.target.value))}
              className="input-field"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Price (EUR) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm">€</span>
              <input
                type="number"
                required
                min={0}
                value={form.price || ''}
                onChange={(e) => setField('price', parseFloat(e.target.value) || 0)}
                placeholder="85000"
                className="input-field pl-7"
              />
            </div>
          </div>
        </div>

        {form.source_url && (
          <div>
            <label className="label">Source URL</label>
            <div className="input-field bg-[#0d0d0d] flex items-center gap-2 cursor-default">
              <a
                href={form.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-400 hover:text-gold-300 text-sm truncate flex-1 transition-colors"
              >
                {form.source_url}
              </a>
              <svg
                className="w-3.5 h-3.5 text-[#555] flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
          </div>
        )}
      </section>

      {/* Technical Specifications */}
      <section className="card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider">Technical Specifications</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Mileage (km)</label>
            <input
              type="number"
              min={0}
              value={form.mileage ?? ''}
              onChange={(e) => setField('mileage', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g. 85000"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">First Registration</label>
            <input
              type="text"
              value={form.first_registration ?? ''}
              onChange={(e) => setField('first_registration', e.target.value || null)}
              placeholder="e.g. 03/1987"
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Fuel Type</label>
            <input
              type="text"
              value={form.fuel_type ?? ''}
              onChange={(e) => setField('fuel_type', e.target.value || null)}
              placeholder="e.g. Petrol"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Power (HP)</label>
            <input
              type="number"
              min={0}
              value={form.power_hp ?? ''}
              onChange={(e) => setField('power_hp', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g. 150"
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Transmission</label>
            <input
              type="text"
              value={form.transmission ?? ''}
              onChange={(e) => setField('transmission', e.target.value || null)}
              placeholder="e.g. Manual"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Body Type</label>
            <input
              type="text"
              value={form.body_type ?? ''}
              onChange={(e) => setField('body_type', e.target.value || null)}
              placeholder="e.g. Saloon"
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Exterior Color</label>
            <input
              type="text"
              value={form.exterior_color ?? ''}
              onChange={(e) => setField('exterior_color', e.target.value || null)}
              placeholder="e.g. Silver"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Doors</label>
            <input
              type="number"
              min={1}
              max={9}
              value={form.doors ?? ''}
              onChange={(e) => setField('doors', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g. 4"
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Interior Material</label>
            <input
              type="text"
              value={form.interior_material ?? ''}
              onChange={(e) => setField('interior_material', e.target.value || null)}
              placeholder="e.g. Leather"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Condition</label>
            <input
              type="text"
              value={form.condition ?? ''}
              onChange={(e) => setField('condition', e.target.value || null)}
              placeholder="e.g. Well-maintained"
              className="input-field"
            />
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider">Description</h2>
        <textarea
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="Describe the car's condition, history, provenance, notable features, restoration work, documentation included..."
          rows={8}
          className="input-field resize-y min-h-[160px]"
        />
      </section>

      {/* Destination countries */}
      <section className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider">
          Export Destinations
          <span className="ml-2 font-normal text-[#555] normal-case tracking-normal">
            ({form.destination_countries.length} selected)
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {DESTINATION_COUNTRIES.map((country) => {
            const selected = form.destination_countries.includes(country)
            return (
              <button
                key={country}
                type="button"
                onClick={() => toggleCountry(country)}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-all duration-150 ${
                  selected
                    ? 'bg-gold-500/20 border-gold-500/60 text-gold-300'
                    : 'bg-transparent border-[#2a2a2a] text-[#666] hover:border-[#3a3a3a] hover:text-[#888]'
                }`}
              >
                {country}
              </button>
            )
          })}
        </div>
      </section>

      {/* Photos */}
      <section className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wider">
          Photos
          <span className="ml-2 font-normal text-[#555] normal-case tracking-normal">
            {form.photos.length > 0 ? `${form.photos.length} uploaded — first is cover` : 'No photos yet'}
          </span>
        </h2>
        <ImageUpload
          photos={form.photos}
          onChange={(photos) => setField('photos', photos)}
        />
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-outline"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-gold min-w-[140px] flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
              Saving...
            </>
          ) : mode === 'create' ? (
            'Create Listing'
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  )
}
