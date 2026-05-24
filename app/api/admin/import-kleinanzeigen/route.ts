import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'node-html-parser'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const STORAGE_BUCKET = 'car-photos'
const MAX_PHOTOS = 20

// CDN hostnames used by Kleinanzeigen / eBay Kleinanzeigen for listing photos
const PHOTO_HOSTS = ['i.ebayimg.com', 'img.kleinanzeigen.de', 'img2.kleinanzeigen.de']

function isListingPhoto(url: string): boolean {
  if (!url || url.startsWith('data:')) return false
  return PHOTO_HOSTS.some((host) => url.includes(host))
}

function extractAllPhotoUrls(
  root: ReturnType<typeof parse>,
  jsonLdPhotos: string[]
): string[] {
  const seen = new Set<string>()

  const add = (raw: string | null | undefined) => {
    if (!raw) return
    // Unescape JSON-encoded forward slashes (common inside __NEXT_DATA__ JSON)
    const url = raw.replace(/\\\//g, '/').replace(/\\u002F/gi, '/')
    if (isListingPhoto(url)) seen.add(upgradeImageSize(url))
  }

  // ── 1. JSON-LD ─────────────────────────────────────────────────────────────
  // Usually only contains the cover photo — still include it.
  for (const url of jsonLdPhotos) add(url)

  // ── 2. __NEXT_DATA__ ───────────────────────────────────────────────────────
  // Kleinanzeigen is a Next.js app. The server-side rendered JSON blob contains
  // the full picture list (pictureLinks / pictures) for the entire gallery.
  // Scanning the raw text with a URL regex is simpler and more robust than
  // traversing the deeply-nested JSON tree.
  const nextDataEl = root.querySelector('script#__NEXT_DATA__')
  if (nextDataEl) {
    const normalized = nextDataEl.text.replace(/\\\//g, '/')
    const matches = normalized.match(/https?:\/\/[^"'<>\s]+/g) ?? []
    for (const url of matches) add(url)
  }

  // ── 3. Every <img> tag — all lazy-load attribute variants ─────────────────
  // Do NOT limit to a specific gallery container; search the whole page so that
  // carousel slides, thumbnail strips and lightbox items are all captured.
  for (const img of root.querySelectorAll('img')) {
    add(img.getAttribute('data-imgsrc'))   // Kleinanzeigen-specific
    add(img.getAttribute('data-src'))      // generic lazy-load
    add(img.getAttribute('data-original')) // another lazy-load convention
    add(img.getAttribute('data-lazy-src'))
    add(img.getAttribute('src'))
  }

  // ── 4. og:image meta tags ─────────────────────────────────────────────────
  for (const meta of root.querySelectorAll('meta[property="og:image"]')) {
    add(meta.getAttribute('content'))
  }

  // ── 5. Remaining inline <script> tags (carousel / slider JSON payloads) ───
  for (const script of root.querySelectorAll('script:not([src])')) {
    if (script.getAttribute('type') === 'application/ld+json') continue
    const text = script.text
    if (!PHOTO_HOSTS.some((h) => text.includes(h))) continue
    const normalized = text.replace(/\\\//g, '/')
    const matches = normalized.match(/https?:\/\/[^"'<>\s]+/g) ?? []
    for (const url of matches) add(url)
  }

  return [...seen]
}

// Maps lowercase German label text → internal field name
const GERMAN_LABEL_MAP: Record<string, string> = {
  'marke': 'brand',
  'modell': 'model',
  'kilometerstand': 'mileage',
  'fahrzeugzustand': 'condition',
  'erstzulassung': 'first_registration',
  'kraftstoffart': 'fuel_type',
  'leistung': 'power_hp',
  'getriebe': 'transmission',
  'fahrzeugtyp': 'body_type',
  'anzahl türen': 'doors',
  'außenfarbe': 'exterior_color',
  'material innenausstattung': 'interior_material',
}

// Spec fields whose German values should be translated to English
const TRANSLATABLE_SPEC_FIELDS = new Set([
  'condition', 'fuel_type', 'transmission', 'body_type', 'exterior_color', 'interior_material',
])

// Static lookup for common German automotive values — avoids API calls for known terms
const GERMAN_VALUE_MAP: Record<string, string> = {
  'benzin': 'Petrol',
  'diesel': 'Diesel',
  'elektro': 'Electric',
  'hybrid': 'Hybrid',
  'manuell': 'Manual',
  'automatik': 'Automatic',
  'limousine': 'Saloon',
  'kombi': 'Estate',
  'coupé': 'Coupé',
  'cabrio': 'Convertible',
  'suv': 'SUV',
  'van': 'Van',
  'unbeschädigtes fahrzeug': 'Undamaged vehicle',
  'unfallauto': 'Accident vehicle',
  'vollleder': 'Full leather',
  'teilleder': 'Partial leather',
  'stoff': 'Fabric',
}

function lookupValue(raw: string): string | null {
  return GERMAN_VALUE_MAP[raw.toLowerCase().trim()] ?? null
}

function isAdminAuthed(req: NextRequest): boolean {
  const session = req.cookies.get('admin_session')?.value
  const adminPassword = process.env.ADMIN_PASSWORD
  return !!(session && adminPassword && session === adminPassword)
}

function upgradeImageSize(url: string): string {
  return url.replace(/\$_\d+/, '$_57').replace(/s-l\d+/, 's-l1600')
}

// ── Spec extraction ────────────────────────────────────────────────────────────

function extractRawSpecs(root: ReturnType<typeof parse>): Record<string, string> {
  const raw: Record<string, string> = {}

  // Candidate containers for the details table
  const container =
    root.querySelector('#viewad-details') ||
    root.querySelector('[data-testid="ad-detail-attributes"]') ||
    root.querySelector('[class*="addetailslist"]') ||
    root.querySelector('[id*="viewad-details"]')

  const textSource = container ?? root

  // Primary: line-by-line text parsing — works across any HTML structure because
  // Kleinanzeigen always renders the label on one line and the value on the next.
  const lines = textSource.text
    .split(/[\n\r\t]+/)
    .map((l) => l.trim())
    .filter(Boolean)

  for (let i = 0; i < lines.length - 1; i++) {
    const keyLower = lines[i].toLowerCase()
    const field = GERMAN_LABEL_MAP[keyLower]
    if (field && !raw[field]) {
      const value = lines[i + 1].trim()
      // Guard: don't use another known label as a value
      if (value && !GERMAN_LABEL_MAP[value.toLowerCase()]) {
        raw[field] = value
        i++ // consume the value line
      }
    }
  }

  // Secondary: dt/dd pairs (for pages that use definition lists)
  if (Object.keys(raw).length === 0 && container) {
    const dts = container.querySelectorAll('dt')
    const dds = container.querySelectorAll('dd')
    const len = Math.min(dts.length, dds.length)
    for (let i = 0; i < len; i++) {
      const field = GERMAN_LABEL_MAP[dts[i].text.trim().toLowerCase()]
      if (field) raw[field] = dds[i].text.trim()
    }
  }

  return raw
}

function parseMileage(raw: string): number | null {
  // "150.000 km", "150,000 km", "150000 km"
  const digits = raw.replace(/\./g, '').replace(/,/g, '').replace(/[^0-9]/g, '')
  const n = parseInt(digits)
  return isNaN(n) || n <= 0 ? null : n
}

function parsePowerHP(raw: string): number | null {
  // "105 PS (77 kW)", "105 PS", "77 kW"
  const psMatch = raw.match(/(\d+)\s*PS/i)
  if (psMatch) return parseInt(psMatch[1])
  const kwMatch = raw.match(/(\d+)\s*kW/i)
  if (kwMatch) return Math.round(parseInt(kwMatch[1]) * 1.36)
  const numMatch = raw.match(/(\d+)/)
  return numMatch ? parseInt(numMatch[1]) : null
}

function parseDoors(raw: string): number | null {
  // "4", "4/5 Türen", "5 Türen"
  const match = raw.match(/(\d+)/)
  return match ? parseInt(match[1]) : null
}

// ── Translation (description + translatable spec values in one Claude call) ───

async function translateContent(
  description: string,
  specsToTranslate: Record<string, string>
): Promise<{ description: string; translatedSpecs: Record<string, string> }> {
  const fallback = { description, translatedSpecs: specsToTranslate }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fallback

  const hasDescription = description.trim().length > 0
  const specEntries = Object.entries(specsToTranslate)
  const hasSpecs = specEntries.length > 0
  if (!hasDescription && !hasSpecs) return fallback

  const specJson = hasSpecs ? JSON.stringify(specsToTranslate, null, 2) : '{}'
  const prompt =
    `Translate this German car listing content to English. Return ONLY valid JSON, no extra text.\n\n` +
    (hasDescription ? `Description (translate in full, preserve paragraph breaks):\n${description}\n\n` : '') +
    (hasSpecs
      ? `Specification values (translate German automotive terms to English; keep brand names, model names and internationally recognized words unchanged):\n${specJson}\n\n`
      : '') +
    `Return exactly:\n{"description":"...","specs":{${specEntries.map(([k]) => `"${k}":"..."`).join(',')}}}`

  try {
    const client = new Anthropic({ apiKey })
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('no text block')

    // Strip markdown code fences if present
    const jsonText = block.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(jsonText)

    return {
      description: typeof parsed.description === 'string' ? parsed.description.trim() : description,
      translatedSpecs:
        parsed.specs && typeof parsed.specs === 'object' ? parsed.specs : specsToTranslate,
    }
  } catch {
    return fallback
  }
}

// ── Photo upload ───────────────────────────────────────────────────────────────

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
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const buffer = await res.arrayBuffer()
      const contentType = res.headers.get('content-type') || 'image/jpeg'
      const ext = contentType.split('/')[1]?.split(';')[0]?.replace('jpeg', 'jpg') || 'jpg'
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

// ── Route handler ──────────────────────────────────────────────────────────────

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

  // ── Fetch page ─────────────────────────────────────────────────────────────
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
        { error: `Kleinanzeigen returned HTTP ${res.status}. The listing may have been removed or access was blocked.` },
        { status: 502 }
      )
    }
    html = await res.text()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error'
    return NextResponse.json({ error: `Could not reach Kleinanzeigen: ${msg}` }, { status: 502 })
  }

  const root = parse(html)

  // ── JSON-LD ────────────────────────────────────────────────────────────────
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
          .map((img: unknown) => (typeof img === 'string' ? img : (img as { url?: string }).url ?? ''))
          .filter(Boolean)
      }
    } catch { /* ignore malformed blocks */ }
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
    if (priceEl) price = parseInt(priceEl.text.replace(/[^0-9]/g, '')) || 0
  }

  // ── Raw description ────────────────────────────────────────────────────────
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
    const m = detailsSection.text.match(/Baujahr[:\s]+(\d{4})/)
    if (m) year = parseInt(m[1])
  }
  if (!year) {
    const ogTitle = root.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? ''
    const m = `${title} ${ogTitle}`.match(/\b(19[5-9]\d|20[0-2]\d)\b/)
    if (m) year = parseInt(m[1])
  }
  if (!year) year = new Date().getFullYear()

  // ── Photo URLs ─────────────────────────────────────────────────────────────
  // Always search every source; never short-circuit based on JSON-LD results.
  const rawPhotoUrls = extractAllPhotoUrls(root, jsonLdPhotos)

  // ── Extract technical specs ────────────────────────────────────────────────
  const rawSpecs = extractRawSpecs(root)

  // Pre-translate known values via lookup table; send the rest to Claude
  const lookupTranslated: Record<string, string> = {}
  const specsToTranslate: Record<string, string> = {}
  for (const field of TRANSLATABLE_SPEC_FIELDS) {
    if (!rawSpecs[field]) continue
    const hit = lookupValue(rawSpecs[field])
    if (hit) {
      lookupTranslated[field] = hit
    } else {
      specsToTranslate[field] = rawSpecs[field]
    }
  }

  // ── Translate + upload photos in parallel ──────────────────────────────────
  const [{ description, translatedSpecs }, photos] = await Promise.all([
    translateContent(rawDescription, specsToTranslate),
    uploadPhotosToSupabase(rawPhotoUrls),
  ])

  // Lookup results take priority; Claude fills in anything not in the table
  const allTranslatedSpecs = { ...lookupTranslated, ...translatedSpecs }

  // ── Assemble response ──────────────────────────────────────────────────────
  return NextResponse.json({
    title,
    price,
    year,
    description,
    photos,
    source_url: url,
    // Brand/model from specs (more reliable than title parsing)
    brand: rawSpecs.brand ?? '',
    model: rawSpecs.model ?? '',
    // Numeric specs
    mileage: rawSpecs.mileage ? parseMileage(rawSpecs.mileage) : null,
    power_hp: rawSpecs.power_hp ? parsePowerHP(rawSpecs.power_hp) : null,
    doors: rawSpecs.doors ? parseDoors(rawSpecs.doors) : null,
    // String specs — keep non-translatable ones as-is, use translated versions for the rest
    first_registration: rawSpecs.first_registration ?? null,
    condition: allTranslatedSpecs.condition ?? null,
    fuel_type: allTranslatedSpecs.fuel_type ?? null,
    transmission: allTranslatedSpecs.transmission ?? null,
    body_type: allTranslatedSpecs.body_type ?? null,
    exterior_color: allTranslatedSpecs.exterior_color ?? null,
    interior_material: allTranslatedSpecs.interior_material ?? null,
  })
}
