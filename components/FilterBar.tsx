'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { CAR_BRANDS } from '@/types/car'

interface FilterBarProps {
  availableBrands: string[]
  availableYears: number[]
  totalCount: number
}

export default function FilterBar({ availableBrands, availableYears, totalCount }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedBrand = searchParams.get('brand') || ''
  const selectedYear = searchParams.get('year') || ''

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/?${params.toString()}`)
    },
    [router, searchParams]
  )

  const clearFilters = () => {
    router.push('/')
  }

  const hasFilters = selectedBrand || selectedYear

  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Brand filter */}
        <div className="flex-1 min-w-0">
          <label className="label">Brand</label>
          <select
            value={selectedBrand}
            onChange={(e) => updateFilter('brand', e.target.value)}
            className="input-field"
          >
            <option value="">All Brands</option>
            {availableBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        {/* Year filter */}
        <div className="flex-1 min-w-0">
          <label className="label">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => updateFilter('year', e.target.value)}
            className="input-field"
          >
            <option value="">All Years</option>
            {availableYears.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Results count + clear */}
        <div className="flex items-end gap-3 pt-5 sm:pt-0">
          <span className="text-sm text-[#555] whitespace-nowrap">
            {totalCount} {totalCount === 1 ? 'car' : 'cars'}
          </span>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost text-xs py-1.5 whitespace-nowrap">
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
