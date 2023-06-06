import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import prisma from '@/lib/prisma'
import { authorizeRequest } from '@/lib/authorize'

export default async function FixSeasonalError(req: NextApiRequest, res: NextApiResponse) {
	const authResult = authorizeRequest(req)
	if (typeof authResult !== 'string') return res.status(authResult.code).send(authResult.message)
	const { body, method } = req
	const { title, mal_id } = body

	if (method !== 'POST') return res.status(405).send('Method not supported')
	
	try {
		const { data } = await axios.get(`https://api.myanimelist.net/v2/anime/${mal_id}`, {
			headers: { 'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID },
			params: {
				fields: 'start_season,start_date,num_episodes,broadcast'
			}
		})

		const broadcast = data?.broadcast
			? `${data?.broadcast.day_of_the_week} ${data?.broadcast.start_time ?? ''}`
			: null
		const anime = {
			title: title,
			mal_id: mal_id,
			mal_title: data?.title,
			image_url: data?.main_picture.large ?? '',
			start_date: data?.start_date ?? '',
			broadcast: broadcast ?? '',
			num_episode: data?.num_episodes,
			message: ''
		}

		await prisma.seasonalDetails.delete({
			where: {
				title: title
			}
		})

		await prisma.seasonalDetails.create({
			data: anime
		})

		return res.status(200).send(anime)
	} catch (error) {
		console.error(error)
		return res.status(500).send(error)
	}
}
