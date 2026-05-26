import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ImageGallery from '@/components/ImageGallery'
import type { Car } from '@/types/car'

async function getCar(id: string): Promise<Car | null> {
  const { data, error } = await supabase.from('cars').select('*').eq('id', id).single()
  if (error || !data) return null
  return data
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const car = await getCar(params.id)
  if (!car) return { title: 'Car Not Found' }
  return {
    title: `${car.title} — Classic Auto Export`,
    description: car.description?.slice(0, 160),
    openGraph: {
      title: car.title,
      images: car.photos?.[0] ? [car.photos[0]] : [],
    },
  }
}

export default async function CarDetailPage({ params }: { params: { id: string } }) {
  const car = await getCar(params.id)
  if (!car) notFound()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#555] mb-8">
          <Link href="/" className="hover:text-gold-400 transition-colors">Catalog</Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#777] truncate max-w-xs">{car.title}</span>
        </nav>

        {/* Title header — full width above the grid */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">{car.brand}</span>
            <span className="text-[#333]">·</span>
            <span className="text-xs text-[#555]">{car.year}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#e8e8e8] leading-tight">
            {car.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left: gallery → description → destinations */}
          <div className="lg:col-span-3 space-y-8">
            <ImageGallery photos={car.photos ?? []} title={car.title} sold={car.sold} />

            {car.description && (
              <div>
                <h2 className="text-lg font-semibold text-[#e8e8e8] mb-4">About This Vehicle</h2>
                <div className="card p-6">
                  <p className="text-[#888] leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                    {car.description}
                  </p>
                </div>
              </div>
            )}

            {car.destination_countries?.length > 0 && (
              <div className="card p-5 space-y-3">
                <h2 className="text-xs font-semibold text-[#666] uppercase tracking-wider">Export Destinations</h2>
                <div className="flex flex-wrap gap-1.5">
                  {car.destination_countries.map((country) => (
                    <span
                      key={country}
                      className="text-xs bg-[#1e1e1e] border border-[#2a2a2a] text-[#888] px-2.5 py-1 rounded"
                    >
                      {country}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: price → specs → inquiry */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price */}
            <div className="card p-5">
              <p className="text-xs text-[#555] uppercase tracking-wider mb-1">Asking Price</p>
              <p className="text-3xl font-bold text-gold-400">
                €{car.price.toLocaleString('en-EU')}
              </p>
              <p className="text-xs text-[#444] mt-1">VAT may apply · Export documentation included</p>
            </div>

            {/* Specs */}
            <div className="card p-5 space-y-3">
              <h2 className="text-xs font-semibold text-[#666] uppercase tracking-wider">Specifications</h2>
              <div className="space-y-2.5">
                <SpecRow label="Brand" value={car.brand} />
                <SpecRow label="Model" value={car.model} />
                <SpecRow label="Year" value={car.year.toString()} />
                {car.first_registration && (
                  <SpecRow label="First Registration" value={car.first_registration} />
                )}
                {car.mileage != null && (
                  <SpecRow label="Mileage" value={`${car.mileage.toLocaleString()} km`} />
                )}
                {car.fuel_type && <SpecRow label="Fuel Type" value={car.fuel_type} />}
                {car.power_hp != null && (
                  <SpecRow label="Power" value={`${car.power_hp} HP`} />
                )}
                {car.transmission && <SpecRow label="Transmission" value={car.transmission} />}
                {car.body_type && <SpecRow label="Body Type" value={car.body_type} />}
                {car.doors != null && (
                  <SpecRow label="Doors" value={car.doors.toString()} />
                )}
                {car.exterior_color && <SpecRow label="Exterior Color" value={car.exterior_color} />}
                {car.interior_material && (
                  <SpecRow label="Interior" value={car.interior_material} />
                )}
                {car.condition && <SpecRow label="Condition" value={car.condition} />}
                <SpecRow label="Photos" value={`${car.photos?.length ?? 0} available`} />
              </div>
            </div>

            {/* CTA */}
            <a
              href={`mailto:germanclassics.export@gmail.com?subject=${encodeURIComponent(`Inquiry about: ${car.title}`)}&body=${encodeURIComponent(`Hello,\n\nI am interested in the ${car.title} listed at €${car.price.toLocaleString()}.\n\nPlease provide more information.\n\nThank you`)}`}
              className="btn-gold w-full flex items-center justify-center gap-2 py-3 text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Inquire About This Car
            </a>

            <p className="text-xs text-[#444] text-center">
              We respond within 24 hours · All major export destinations
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-12">
          <Link href="/" className="btn-outline inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Catalog
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#555]">{label}</span>
      <span className="text-[#ccc] font-medium">{value}</span>
    </div>
  )
}
