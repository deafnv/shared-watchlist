import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

const LOGFLARE_KEY = process.env.LOGFLARE_KEY
const LOGFLARE_ID = process.env.LOGFLARE_ID

const recordLogs = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!LOGFLARE_KEY || !LOGFLARE_ID) {
    return res.status(400).json('Logs are not being recorded')
  }
  if (req.method !== 'POST') {
    return res.status(400).json('Only POST methods are supported')
  }

  const { body } = req
  const { message } = body

  try {
    await axios.post(`https://api.logflare.app/api/logs?source=${process.env.NEXT_PUBLIC_LOGFLARE_ID}`, {
        message: message
			},
			{
				headers: {
					'X-API-KEY': process.env.NEXT_PUBLIC_LOGFLARE_KEY,
					'Content-Type': 'application/json'
				}
			})
    res.json('ok')
  } catch (e) {
    console.error(JSON.stringify(e))
  }
}

export default recordLogs