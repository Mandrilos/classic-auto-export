'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import Image from 'next/image'
import { supabase, STORAGE_BUCKET } from '@/lib/supabase'

interface ImageUploadProps {
  photos: string[]
  onChange: (photos: string[]) => void
}

export default function ImageUpload({ photos, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFiles = async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    setUploading(true)
    setError('')

    try {
      const uploadedUrls: string[] = []

      for (const file of imageFiles) {
        const ext = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const filePath = `cars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, { upsert: false })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)
        uploadedUrls.push(data.publicUrl)
      }

      onChange([...photos, ...uploadedUrls])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(message)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) {
      uploadFiles(Array.from(e.dataTransfer.files))
    }
  }

  const removePhoto = async (url: string, index: number) => {
    try {
      // Extract path from URL for deletion
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split(`/object/public/${STORAGE_BUCKET}/`)
      if (pathParts.length > 1) {
        await supabase.storage.from(STORAGE_BUCKET).remove([pathParts[1]])
      }
    } catch {
      // Continue even if storage deletion fails
    }
    onChange(photos.filter((_, i) => i !== index))
  }

  const movePhoto = (fromIndex: number, toIndex: number) => {
    const updated = [...photos]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
          dragOver
            ? 'border-gold-500 bg-gold-500/5'
            : 'border-[#2a2a2a] hover:border-[#3a3a3a] bg-[#111]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#666]">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-[#555]">
              <span className="text-gold-400">Click to upload</span> or drag & drop
            </p>
            <p className="text-xs text-[#444]">JPG, PNG, WebP — multiple files supported</p>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((url, i) => (
            <div key={url} className="relative group aspect-square rounded overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a]">
              <Image
                src={url}
                alt={`Photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="120px"
              />

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => movePhoto(i, i - 1)}
                    title="Move left"
                    className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded flex items-center justify-center"
                  >
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {i < photos.length - 1 && (
                  <button
                    type="button"
                    onClick={() => movePhoto(i, i + 1)}
                    title="Move right"
                    className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded flex items-center justify-center"
                  >
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(url, i)}
                  title="Remove"
                  className="w-7 h-7 bg-red-900/60 hover:bg-red-800/80 rounded flex items-center justify-center"
                >
                  <svg className="w-3.5 h-3.5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Cover label */}
              {i === 0 && (
                <div className="absolute top-1 left-1 bg-gold-500/90 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                  COVER
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
