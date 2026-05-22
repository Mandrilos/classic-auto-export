import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CarCard from '@/components/CarCard'
import FilterBar from '@/components/FilterBar'
import type { Car } from '@/types/car'

interface SearchParams {
  brand?: string
  year?: string
}

async function getCars(filters: SearchParams): Promise<Car[]> {
  let query = supabase
    .from('cars')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.brand) {
    query = query.eq('brand', filters.brand)
  }
  if (filters.year) {
    query = query.eq('year', parseInt(filters.year))
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching cars:', error)
    return []
  }
  return data ?? []
}

async function getAllBrandsAndYears() {
  const { data } = await supabase
    .from('cars')
    .select('brand, year')
    .order('brand')

  if (!data) return { brands: [], years: [] }

  const brands = [...new Set(data.map((c) => c.brand))].sort()
  const years = [...new Set(data.map((c) => c.year))].sort((a, b) => b - a)

  return { brands, years }
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const [cars, { brands, years }] = await Promise.all([
    getCars(searchParams),
    getAllBrandsAndYears(),
  ])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="border-b border-[#1e1e1e] bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-gold-400 text-xs font-semibold uppercase tracking-widest mb-3">
              Premium Classic Vehicle Export
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#e8e8e8] leading-tight mb-4">
              Exceptional Classic Cars{' '}
              <br className="hidden sm:block" />
              <span className="text-gold-400">for Discerning Buyers</span>
            </h1>
            <p className="text-[#666] text-base sm:text-lg leading-relaxed">
              We source, authenticate, and export rare classic automobiles worldwide.
              Full documentation, transparent history, professional shipping.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10">
        {/* Filters */}
        <Suspense fallback={null}>
          <div className="mb-8">
            <FilterBar
              availableBrands={brands}
              availableYears={years}
              totalCount={cars.length}
            />
          </div>
        </Suspense>

        {/* Grid */}
        {cars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-[#666] font-medium mb-1">No cars found</h3>
            <p className="text-[#444] text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
