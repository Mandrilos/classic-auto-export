'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Car } from '@/types/car'
import SoldStamp from '@/components/SoldStamp'

const CONTACT_EMAIL = 'germanclassics.export@gmail.com'

interface CarCardProps {
  car: Car
}

export default function CarCard({ car }: CarCardProps) {
  const router = useRouter()
  const photos = car.photos ?? []
  const [currentIndex, setCurrentIndex] = useState(0)

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwiping = useRef(false)
  // Stays true once a touch event is detected — used to block image-tap navigation on touch devices
  const isTouch = useRef(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    isTouch.current = true
    isSwiping.current = false
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
    if (dx > dy && dx > 8) {
      isSwiping.current = true
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current) return
    isSwiping.current = false
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0 && currentIndex < photos.length - 1) {
        setCurrentIndex(i => i + 1)
      } else if (deltaX > 0 && currentIndex > 0) {
        setCurrentIndex(i => i - 1)
      }
    }
  }

  // On desktop (mouse): navigate to detail page. On touch: do nothing.
  const handleImageClick = () => {
    if (isTouch.current) return
    router.push(`/cars/${car.id}`)
  }

  const mailtoHref =
    `mailto:${CONTACT_EMAIL}` +
    `?subject=${encodeURIComponent(`Inquiry about: ${car.title}`)}` +
    `&body=${encodeURIComponent(`Hello,\n\nI am interested in the ${car.title} listed at €${car.price.toLocaleString()}.\n\nPlease provide more information.\n\nThank you`)}`

  const currentPhoto = photos[currentIndex]

  return (
    <div className="group card hover:border-[#3a3a3a] transition-all duration-300 hover:shadow-xl hover:shadow-black/40 flex flex-col">
      {/* Image area — outside Link so swipe/tap on mobile doesn't navigate */}
      <div
        className="aspect-[4/3] bg-[#1a1a1a] relative overflow-hidden sm:cursor-pointer select-none"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleImageClick}
      >
        {currentPhoto ? (
          <Image
            src={currentPhoto}
            alt={`${car.title} - photo ${currentIndex + 1}`}
            fill
            draggable={false}
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

        {car.sold && <SoldStamp />}

        {/* Year badge */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <span className="bg-black/70 backdrop-blur-sm text-[#aaa] text-xs font-medium px-2 py-1 rounded">
            {car.year}
          </span>
        </div>

        {/* Photo count — desktop only; dots replace it on mobile */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 right-3 hidden sm:block pointer-events-none">
            <span className="bg-black/70 backdrop-blur-sm text-[#aaa] text-xs px-2 py-1 rounded flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {photos.length}
            </span>
          </div>
        )}
      </div>

      {/* Dots indicator — mobile only */}
      {photos.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 py-2 sm:hidden">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`rounded-full transition-all duration-200 ${
                i === currentIndex ? 'w-2 h-2 bg-gold-400' : 'w-1.5 h-1.5 bg-[#444]'
              }`}
              aria-label={`Photo ${i + 1} of ${photos.length}`}
            />
          ))}
        </div>
      )}

      {/* Clickable content area → car detail page */}
      <Link href={`/cars/${car.id}`} className="block flex-1">
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

      {/* Contact button — separate from Link to avoid nested <a> */}
      <div className="px-4 pb-4">
        <a
          href={mailtoHref}
          className="flex items-center justify-center gap-2 w-full border border-[#2a2a2a] hover:border-gold-500/50 text-[#666] hover:text-gold-400 text-xs font-medium py-2 rounded transition-colors duration-150"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Contact about this car
        </a>
      </div>
    </div>
  )
}
