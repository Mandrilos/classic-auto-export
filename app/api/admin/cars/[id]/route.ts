import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function isAuthenticated(): boolean {
  const cookieStore = cookies()
  const session = cookieStore.get('admin_session')?.value
  return !!session && session === process.env.ADMIN_PASSWORD
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const supabase = getAdminSupabase()
  const { error, data } = await supabase.from('cars').update(body).eq('id', params.id).select().single()

  if (error) {
    console.error(`[PUT /api/admin/cars/${params.id}] Supabase error:`, error)
    return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminSupabase()
  const { error } = await supabase.from('cars').delete().eq('id', params.id)

  if (error) {
    console.error(`[DELETE /api/admin/cars/${params.id}] Supabase error:`, error)
    return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
