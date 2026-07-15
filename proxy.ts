import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = await auth()
  const isLoggedIn = !!session?.user
  const { pathname } = request.nextUrl

  const publicPaths = ['/login', '/verify-request', '/api/auth', '/api/sync']
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-|manifest).*)'],
}
