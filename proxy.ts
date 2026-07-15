import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicPaths = ['/login', '/verify-request', '/api/auth', '/api/sync']
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!isPublic) {
    // NextAuth v5 JWT cookie — "authjs.session-token" on HTTP, "__Secure-authjs.session-token" on HTTPS
    const sessionToken =
      request.cookies.get('authjs.session-token') ||
      request.cookies.get('__Secure-authjs.session-token')

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-|manifest).*)'],
}
