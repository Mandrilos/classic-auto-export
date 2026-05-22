import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import CarForm from '@/components/admin/CarForm'
import type { Car } from '@/types/car'

async function getCar(id: string): Promise<Car | null> {
  const { data, error } = await supabase.from('cars').select('*').eq('id', id).single()
  if (error || !data) return null
  return data
}

export default async function EditCarPage({ params }: { params: { id: string } }) {
  const car = await getCar(params.id)
  if (!car) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-xs text-[#555] mb-3">
          <Link href="/admin/dashboard" className="hover:text-gold-400 transition-colors">Dashboard</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="truncate max-w-xs">{car.title}</span>
        </nav>
        <h1 className="text-2xl font-bold text-[#e8e8e8]">Edit Listing</h1>
        <p className="text-[#555] text-sm mt-1">{car.title}</p>
      </div>

      <CarForm car={car} mode="edit" />
    </div>
  )
}
