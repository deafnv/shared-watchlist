import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  fetch('http://localhost:3000/api/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: 'User logged in',
  })

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}