import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  /* if (new RegExp(/^.*(fonts|_next|vk.com|favicon).*$/).test(request.url)) {
    return NextResponse.next()
  }
  let url = process.env.NODE_ENV == 'production' ? 'https://test.rokiniri.com' : 'http://localhost:3000'
  let destination = request.nextUrl
  console.log(request.headers.get('x-forwarded-for'))

  await fetch(`${url}/api/log`, { 
    method: 'POST', 
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: `User entering ${JSON.stringify(request.body)}` })
  }) */

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|fonts|examples|[\\w-]+\\.\\w+).*)'],
}