import { NextApiRequest, NextApiResponse } from 'next'

export default async function RevalidateRoute(req: NextApiRequest, res: NextApiResponse) {
  const { body, method } = req
	const { route } = body

  if (method !== 'POST') return res.status(405).send('Method not supported')
  if (!route) return res.status(400)

  try {
    await res.revalidate(route)
    return res.json({ revalidated: true })
  } catch (error) {
    return res.status(500).send('Error revalidating')
  }
}