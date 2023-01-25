import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'
import { Database } from '../../../lib/database.types'

export default async function BatchUpdateSheet(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { body, method } = req
  const { id, mal_id } = body

  if (method === 'POST') {
    try {
      const { data } = await axios.get(
        `https://api.myanimelist.net/v2/anime/${mal_id}`,
        {
          headers: { 'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID },
          params: {
            fields: 'start_season,start_date,num_episodes,broadcast',
          },
        }
      )

      const broadcast = data?.broadcast
        ? `${data?.broadcast.day_of_the_week} ${
            data?.broadcast.start_time ?? ''
          }`
        : null
      const anime = {
        id: id,
        mal_id: mal_id,
        title: data?.title,
        image_url: data?.main_picture.large ?? '',
        start_date: data?.start_date ?? '',
        broadcast: broadcast,
        num_episodes: data?.num_episodes,
        message: '',
      }

      //* Through testing, these API routes with restricted queries like UPDATE, DELETE, or INSERT fails silently if the public API key is provided instead of the service key
      const supabase = createClient<Database>(
        'https://esjopxdrlewtpffznsxh.supabase.co',
        process.env.SUPABASE_SERVICE_API_KEY!
      )
      await supabase.from('SeasonalDetails').delete().eq('id', id)

      await supabase.from('SeasonalDetails').upsert(anime)

      return res.status(200).send(anime)
    } catch (error) {
      console.log(error)
      return res.status(500).send(error)
    }
  }
  return res.status(405).send('Method not supported')
}
