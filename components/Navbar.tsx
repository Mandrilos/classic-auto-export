'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="border-b border-[#1e1e1e] bg-[#0a0a0a]/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded border border-gold-500/60 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gold-400" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 10h18M7 6l-4 4 4 4M17 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div>
                <span className="text-[#e8e8e8] font-semibold text-sm tracking-wide">GERMAN CLASSICS</span>
                <span className="text-gold-400 font-semibold text-sm tracking-wide"> EXPORT</span>
              </div>
              <p className="text-[#444] text-[10px] tracking-widest uppercase leading-none">From Germany · Worldwide</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-[#888] hover:text-[#e8e8e8] transition-colors">
              Catalog
            </Link>
            <a href="mailto:germanclassics.export@gmail.com" className="text-sm text-[#888] hover:text-[#e8e8e8] transition-colors">
              Contact
            </a>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-[#888] hover:text-[#e8e8e8] p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#1e1e1e] py-3 space-y-1">
            <Link
              href="/"
              className="block px-2 py-2 text-sm text-[#888] hover:text-[#e8e8e8]"
              onClick={() => setMenuOpen(false)}
            >
              Catalog
            </Link>
            <a
              href="mailto:germanclassics.export@gmail.com"
              className="block px-2 py-2 text-sm text-[#888] hover:text-[#e8e8e8]"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </a>
          </div>
        )}
      </div>
    </header>
  )
}
