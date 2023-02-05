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

  const body = await req.body

  try {
    await axios.post(`https://api.logflare.app/api/logs?source=${LOGFLARE_ID}`, {

    },
    {
      headers: {
        'X-API-KEY': LOGFLARE_KEY
      },
      params: {
        'message': body
      }
    })
    res.json('ok')
  } catch (e) {
    console.error(JSON.stringify(e))
  }
}

export default recordLogs