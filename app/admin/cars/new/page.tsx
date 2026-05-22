import Link from 'next/link'
import CarForm from '@/components/admin/CarForm'

export default function NewCarPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-xs text-[#555] mb-3">
          <Link href="/admin/dashboard" className="hover:text-gold-400 transition-colors">Dashboard</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>New Listing</span>
        </nav>
        <h1 className="text-2xl font-bold text-[#e8e8e8]">Add New Car</h1>
        <p className="text-[#555] text-sm mt-1">Create a new listing for the public catalog</p>
      </div>

      <CarForm mode="create" />
    </div>
  )
}
