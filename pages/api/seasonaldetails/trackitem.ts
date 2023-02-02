import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { load } from 'cheerio'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../../../lib/database.types'

export default async function TrackItem(req: NextApiRequest, res: NextApiResponse) {
  const { body, method } = req
	const { id } = body

  if (method == 'POST') {
    try {
      //* Through testing, these API routes with restricted queries like UPDATE, DELETE, or INSERT fails silently if the public API key is provided instead of the service key
      const supabase = createClient<Database>(
        'https://esjopxdrlewtpffznsxh.supabase.co',
        process.env.SUPABASE_SERVICE_API_KEY!
      )
      
  
      const { data } = await axios.get(`https://api.jikan.moe/v4/anime/${id}/episodes`)
     
      const toUpsert = {
        mal_id: id,
        latest_episode: data.data[data.data.length - 1].mal_id
      }
  
      await supabase.from('SeasonalDetails').upsert(toUpsert)
  
      await res.revalidate('/seasonal/track')
      return res.status(200).send(toUpsert)
    } catch (error) {
      console.log(error)
      return res.status(500).send(error)
    }
  }
  return res.status(405).send('Method not supported')
}
