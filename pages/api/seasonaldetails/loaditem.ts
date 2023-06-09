import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import isEqual from 'lodash/isEqual'
import prisma from '@/lib/prisma'
import { authorizeRequest } from '@/lib/authorize'

export default async function RefreshItem(req: NextApiRequest, res: NextApiResponse) {
  const authResult = authorizeRequest(req)
	if (typeof authResult !== 'string') return res.status(authResult.code).send(authResult.message)
  const { body, method } = req
	const { title } = body

  if (method !== 'POST') return res.status(405).send('Method not supported')
  if (!title || typeof title !== 'string') return res.status(400)
	try {
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
        broadcast: broadcast ?? '',
        num_episode: data?.data[0].node.num_episodes,
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
        broadcast: broadcast ?? '',
        num_episode: data?.data[0].node.num_episodes,
        status: data?.data[0].node.status,
        message: ''
      }
    }

    await prisma.seasonalDetails.create({
      data: toUpsert
    })

		return res.status(200).send(toUpsert)
	} catch (error) {
		console.error(error)
		return res.status(500).send(error)
	}
}
