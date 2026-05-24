import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'node-html-parser'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const STORAGE_BUCKET = 'car-photos'
const MAX_PHOTOS = 12

function isAdminAuthed(req: NextRequest): boolean {
  const session = req.cookies.get('admin_session')?.value
  const adminPassword = process.env.ADMIN_PASSWORD
  return !!(session && adminPassword && session === adminPassword)
}

function upgradeImageSize(url: string): string {
  return url
    .replace(/\$_\d+/, '$_57')
    .replace(/s-l\d+/, 's-l1600')
}

async function translateToEnglish(text: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!text || !apiKey) return text

  try {
    const client = new Anthropic({ apiKey })
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content:
            'Translate the following German car listing description to English. ' +
            'Return only the translated text, preserving paragraph breaks. ' +
            'Do not add any commentary or preamble.\n\n' +
            text,
        },
      ],
    })
    const block = msg.content[0]
    return block.type === 'text' ? block.text.trim() : text
  } catch {
    return text
  }
}

async function uploadPhotosToSupabase(photoUrls: string[]): Promise<string[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return []

  const supabase = createClient(supabaseUrl, supabaseKey)

  const results = await Promise.allSettled(
    photoUrls.slice(0, MAX_PHOTOS).map(async (url) => {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: 'https://www.kleinanzeigen.de/',
        },
        signal: AbortSignal.timeout(12_000),
      })
      if (!res.ok) throw new Error(`Photo fetch failed: HTTP ${res.status}`)

      const buffer = await res.arrayBuffer()
      const contentType = res.headers.get('content-type') || 'image/jpeg'
      const ext =
        contentType.split('/')[1]?.split(';')[0]?.replace('jpeg', 'jpg') || 'jpg'
      const fileName = `cars/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, buffer, { contentType, upsert: false })

      if (error) throw error

      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName)
      return data.publicUrl
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map((r) => r.value)
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let url: string
  try {
    const body = await req.json()
    url = body.url
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
  }

  if (!parsedUrl.hostname.includes('kleinanzeigen.de')) {
    return NextResponse.json({ error: 'URL must be from kleinanzeigen.de' }, { status: 400 })
  }

  // ── Fetch the listing page ─────────────────────────────────────────────────
  let html: string
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8',
        Referer: 'https://www.kleinanzeigen.de/',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Kleinanzeigen returned HTTP ${res.status}. The listing may have been removed or access was blocked.`,
        },
        { status: 502 }
      )
    }

    html = await res.text()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error'
    return NextResponse.json({ error: `Could not reach Kleinanzeigen: ${msg}` }, { status: 502 })
  }

  const root = parse(html)

  // ── JSON-LD structured data (most reliable when present) ───────────────────
  let jsonLdTitle = ''
  let jsonLdPrice = 0
  let jsonLdDescription = ''
  let jsonLdPhotos: string[] = []

  for (const script of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const raw = JSON.parse(script.text)
      const item = Array.isArray(raw) ? raw[0] : raw
      if (!item) continue
      if (item.name && !jsonLdTitle) jsonLdTitle = String(item.name).trim()
      if (item.description && !jsonLdDescription) jsonLdDescription = String(item.description).trim()
      if (item.offers?.price && !jsonLdPrice) {
        jsonLdPrice = parseFloat(String(item.offers.price).replace(/[^0-9.]/g, '')) || 0
      }
      if (item.image && jsonLdPhotos.length === 0) {
        const imgs = Array.isArray(item.image) ? item.image : [item.image]
        jsonLdPhotos = imgs
          .map((img: unknown) =>
            typeof img === 'string' ? img : (img as { url?: string }).url ?? ''
          )
          .filter(Boolean)
      }
    } catch {
      // ignore malformed JSON-LD blocks
    }
  }

  // ── Title ──────────────────────────────────────────────────────────────────
  const title =
    jsonLdTitle ||
    root.querySelector('#viewad-title')?.text.trim() ||
    root.querySelector('[data-testid="ad-detail-header"] h1')?.text.trim() ||
    root.querySelector('[class*="addetails"] h1')?.text.trim() ||
    root.querySelector('h1')?.text.trim() ||
    ''

  // ── Price ──────────────────────────────────────────────────────────────────
  let price = jsonLdPrice
  if (!price) {
    const priceEl =
      root.querySelector('#viewad-price') ||
      root.querySelector('[data-testid="ad-detail-price"]') ||
      root.querySelector('[class*="price--main"]') ||
      root.querySelector('.boxedarticle--price')
    if (priceEl) {
      price = parseInt(priceEl.text.replace(/[^0-9]/g, '')) || 0
    }
  }

  // ── Raw German description (will be translated below) ─────────────────────
  const rawDescription =
    jsonLdDescription ||
    root.querySelector('#viewad-description-text')?.text.trim() ||
    root.querySelector('[data-testid="ad-description"]')?.text.trim() ||
    root.querySelector('#viewad-description p')?.text.trim() ||
    root.querySelector('[class*="description"]')?.text.trim() ||
    ''

  // ── Year ───────────────────────────────────────────────────────────────────
  let year = 0

  const detailsSection =
    root.querySelector('#viewad-details') ||
    root.querySelector('[data-testid="ad-detail-attributes"]') ||
    root.querySelector('[class*="attributes"]')

  if (detailsSection) {
    const baujahrMatch = detailsSection.text.match(/Baujahr[:\s]+(\d{4})/)
    if (baujahrMatch) year = parseInt(baujahrMatch[1])
  }

  if (!year) {
    const ogTitle = root.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? ''
    const yearMatch = `${title} ${ogTitle}`.match(/\b(19[5-9]\d|20[0-2]\d)\b/)
    if (yearMatch) year = parseInt(yearMatch[1])
  }

  if (!year) year = new Date().getFullYear()

  // ── Raw photo URLs ─────────────────────────────────────────────────────────
  let rawPhotoUrls: string[] = jsonLdPhotos.map(upgradeImageSize)

  if (rawPhotoUrls.length === 0) {
    const seen = new Set<string>()

    const gallerySelectors = [
      '#viewad-media-gallery',
      '[data-testid="ad-detail-gallery"]',
      '[class*="gallery"]',
      '[class*="adimages"]',
    ]

    for (const sel of gallerySelectors) {
      const container = root.querySelector(sel)
      if (!container) continue
      for (const img of container.querySelectorAll('img')) {
        const src = img.getAttribute('data-src') || img.getAttribute('src') || ''
        if (
          src &&
          !src.startsWith('data:') &&
          (src.includes('ebayimg') || src.includes('kleinanzeigen'))
        ) {
          seen.add(upgradeImageSize(src))
        }
      }
      if (seen.size > 0) break
    }

    if (seen.size === 0) {
      for (const meta of root.querySelectorAll('meta[property="og:image"]')) {
        const content = meta.getAttribute('content')
        if (content) seen.add(upgradeImageSize(content))
      }
    }

    rawPhotoUrls = [...seen].filter(Boolean)
  }

  // ── Translate description + upload photos in parallel ─────────────────────
  const [description, photos] = await Promise.all([
    translateToEnglish(rawDescription),
    uploadPhotosToSupabase(rawPhotoUrls),
  ])

  return NextResponse.json({ title, price, year, description, photos, source_url: url })
}
