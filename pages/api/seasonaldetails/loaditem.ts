import { createClient } from '@supabase/supabase-js'
import { NextApiRequest, NextApiResponse } from 'next'
import { Database } from '../../../lib/database.types'
import axios from 'axios'
import isEqual from 'lodash/isEqual'

export default async function RefreshItem(req: NextApiRequest, res: NextApiResponse) {
  const { body, method } = req
	const { title } = body

  if (method !== 'POST') return res.status(405).send('Method not supported')
  if (!title || typeof title !== 'string') return res.status(400)
	try {
		//* Through testing, these API routes with restricted queries like UPDATE, DELETE, or INSERT fails silently if the public API key is provided instead of the service key
		const supabase = createClient<Database>(
			'https://esjopxdrlewtpffznsxh.supabase.co',
			process.env.SUPABASE_SERVICE_API_KEY!
		)

		//? Really stupid temp thing
		const season = Math.floor((new Date().getMonth() / 12) * 4) % 4
		const year = new Date().getFullYear()
		const compare = {
			year: year,
			season: ['winter', 'spring', 'summer', 'fall'][season]
		}
		const prevSeason = season - 1 == -1 ? 3 : season - 1
		const compare2cour = {
			year: season - 1 == -1 ? year - 1 : year,
			season: ['winter', 'spring', 'summer', 'fall'][prevSeason]
		}
		const { data } = await axios.get(`https://api.myanimelist.net/v2/anime`, {
      headers: { 'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID },
      params: {
        q: title.substring(0, 64),
        fields: 'start_season,start_date,num_episodes,broadcast,status',
        limit: 5
      }
    })

    const broadcast = data?.data[0].node.broadcast
      ? `${ data?.data[0].node.broadcast.day_of_the_week} ${
        data?.data[0].node.broadcast.start_time ?? ''
        }`
      : null

    let toUpsert;
    if (
      (!isEqual(data?.data[0].node.start_season, compare) &&
        !isEqual(data?.data[0].node.start_season, compare2cour)) ||
        data?.data[0].node.status == 'finished_airing'
    ) {
      toUpsert = {
        title: title,
        mal_id: data?.data[0].node.id,
        mal_title: data?.data[0].node?.title,
        image_url: data?.data[0].node.main_picture.large ?? '',
        start_date: data?.data[0].node.start_date ?? '',
        broadcast: broadcast,
        num_episodes: data?.data[0].node.num_episodes,
        status: data?.data[0].node.status,
        message: `Validate:https://myanimelist.net/anime.php?q=${encodeURIComponent(title.substring(0, 64)!)}`
      }
    } else {
      toUpsert = {
        title: title,
        mal_id: data?.data[0].node.id,
        mal_title: data?.data[0].node?.title,
        image_url: data?.data[0].node.main_picture.large ?? '',
        start_date: data?.data[0].node.start_date ?? '',
        broadcast: broadcast,
        num_episodes: data?.data[0].node.num_episodes,
        status: data?.data[0].node.status,
        message: ''
      }
    }

		await supabase.from('SeasonalDetails').upsert(toUpsert)

		await res.revalidate('/seasonal/track')
		return res.status(200).send(toUpsert)
	} catch (error) {
		console.log(error)
		return res.status(500).send(error)
	}
}
