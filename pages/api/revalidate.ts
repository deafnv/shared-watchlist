import { NextApiRequest, NextApiResponse } from 'next'

export default async function revalidate(req: NextApiRequest, res: NextApiResponse) {
  try {
    await res.revalidate('/seasonal/track')
    return res.json({ revalidated: true })
  } catch (error) {
    return res.status(500).send('Error revalidating')
  }
}