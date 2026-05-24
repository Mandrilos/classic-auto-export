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
