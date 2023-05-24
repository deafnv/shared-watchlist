import { createClient } from '@supabase/supabase-js'
import { NextApiRequest, NextApiResponse } from 'next'
import { Database } from '@/lib/database.types'
import axios from 'axios'
import uniqBy from 'lodash/uniqBy'

export default async function RefreshSeasonal(req: NextApiRequest, res: NextApiResponse) {
	try {
		//* Through testing, these API routes with restricted queries like UPDATE, DELETE, or INSERT fails silently if the public API key is provided instead of the service key
		const supabase = createClient<Database>(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_API_KEY!
		)
		const dataDBCompleted = await supabase
			.from('Completed')
			.select(
				`
				*,
				CompletedDetails (
					mal_id
				)
			`
			)
			.order('id', { ascending: true })

		if (!dataDBCompleted.data)
			return res.status(500).send('Something went wrong when retreiving data from database')
		const dataDBUnprocessed = dataDBCompleted.data.filter((item) => {
			return (
				(item?.CompletedDetails as { mal_id: number | null })?.mal_id == -1 ||
				!item.CompletedDetails
			)
		})
		if (dataDBCompleted.data.length == 0) return res.status(200).send('No more to update')

		let genreRelationshipsCount = 1
		let genres: any[] = []
		let genreRelationships: {
			id: number
			anime_id: number
			genre_id: number
		}[] = []
		const malResponse = await Promise.all(
			dataDBUnprocessed.map(async (item, index) => {
				if (!item.title) {
					return {
						end_date: '',
						id: item.id,
						image_url: '',
						mal_alternative_title: '',
						mal_id: -1,
						mal_title: '',
						mal_synopsis: '',
						mal_rating: 0,
						start_date: '',
						average_episode_duration: -1
					}
				}
				const { data } = await axios.get(
					`https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(
						item.title!.substring(0, 64).replace('86', 'eighty six')
					)
						.replaceAll('%20', '+')
						.replaceAll('%2520', '+')
						.replaceAll('(', '%28')}`,
					{
						headers: { 'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID },
						params: {
							limit: 5,
							fields:
								'alternative_titles,start_date,end_date,genres,synopsis,average_episode_duration,mean'
						}
					}
				)

				genres = genres.concat(data?.data[0].node.genres)

				data?.data[0].node.genres.forEach((item1: { id: number; name: string }) => {
					genreRelationships.push({
						id: genreRelationshipsCount,
						anime_id: item.id,
						genre_id: item1.id
					})
					genreRelationshipsCount++
				})

				return {
					end_date: data?.data[0].node.end_date ?? '',
					id: item.id,
					image_url: data?.data[0].node.main_picture.large ?? '',
					mal_alternative_title: data?.data[0].node.alternative_titles.en ?? '',
					mal_id: parseInt(data?.data[0].node.id),
					mal_title: data?.data[0].node.title,
					mal_synopsis: data?.data[0].node.synopsis ?? '',
					mal_rating: data?.data[0].node.mean ?? 0,
					start_date: data?.data[0].node.start_date ?? '',
					average_episode_duration: data?.data[0].node.average_episode_duration ?? 0
				}
			})
		)

		const genresNoDupe = uniqBy(genres, 'id')

		await supabase.from('Genres').upsert(genresNoDupe)

		await supabase.from('CompletedDetails').upsert(malResponse)

		await supabase.from('Genre_to_Titles').upsert(genreRelationships)

		await res.revalidate('/completed/statistics')

		return res.status(200).send(malResponse)
	} catch (error) {
		console.log(error)
		return res.status(500).send(error)
	}
}