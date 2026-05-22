import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all /admin sub-routes except the login page itself
  if (pathname.startsWith('/admin/')) {
    const session = request.cookies.get('admin_session')?.value
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!session || session !== adminPassword) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path+'],
}
