import Link from 'next/link'
import Image from 'next/image'
import type { Car } from '@/types/car'

interface CarCardProps {
  car: Car
}

export default function CarCard({ car }: CarCardProps) {
  const mainPhoto = car.photos?.[0]

  return (
    <Link href={`/cars/${car.id}`} className="group card hover:border-[#3a3a3a] transition-all duration-300 hover:shadow-xl hover:shadow-black/40 block">
      {/* Image */}
      <div className="aspect-[4/3] bg-[#1a1a1a] relative overflow-hidden">
        {mainPhoto ? (
          <Image
            src={mainPhoto}
            alt={car.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Year badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-black/70 backdrop-blur-sm text-[#aaa] text-xs font-medium px-2 py-1 rounded">
            {car.year}
          </span>
        </div>

        {/* Photo count */}
        {car.photos?.length > 1 && (
          <div className="absolute bottom-3 right-3">
            <span className="bg-black/70 backdrop-blur-sm text-[#aaa] text-xs px-2 py-1 rounded flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {car.photos.length}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-xs text-[#666] uppercase tracking-wider font-medium mb-0.5">{car.brand}</p>
            <h3 className="text-[#e8e8e8] font-semibold text-base leading-tight group-hover:text-gold-400 transition-colors">
              {car.title}
            </h3>
          </div>
        </div>

        {car.description && (
          <p className="text-[#555] text-sm leading-relaxed line-clamp-2 mt-2">
            {car.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1e1e1e]">
          <div>
            <p className="text-xs text-[#555] mb-0.5">Asking price</p>
            <p className="text-gold-400 font-bold text-lg">
              €{car.price.toLocaleString('en-EU')}
            </p>
          </div>
          <span className="text-xs text-[#444] group-hover:text-gold-500 transition-colors flex items-center gap-1">
            View details
            <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}
