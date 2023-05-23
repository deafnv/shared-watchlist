import { NextApiRequest } from 'next'
import cookieParser from 'cookie-parser'

export function authorizeRequest(req: NextApiRequest) {
  if (!req.cookies.auth) return { code: 401, message: 'No auth cookie' }

  const cookie = cookieParser.signedCookie(req.cookies.auth, process.env.COOKIE_SECRET!)
  if (!cookie) return { code: 400, message: 'Bad cookie' }

  const rank = cookie.split(':').pop()
  if (!rank || parseInt(rank) < 255) return { code: 403, message: 'Forbidden' }

  return cookie
}