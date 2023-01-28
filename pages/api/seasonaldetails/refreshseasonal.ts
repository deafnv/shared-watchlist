import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../lib/database.types';
import axios from 'axios';
import isEqual from 'lodash/isEqual';

export default async function RefreshSeasonal(
	req: NextApiRequest,
	res: NextApiResponse
) {
	try {
		//* Through testing, these API routes with restricted queries like UPDATE, DELETE, or INSERT fails silently if the public API key is provided instead of the service key
		const supabase = createClient<Database>(
			'https://esjopxdrlewtpffznsxh.supabase.co',
			process.env.SUPABASE_SERVICE_API_KEY!
		);
		const { data } = await supabase
			.from('PTW-CurrentSeason')
			.select()
			.order('id', { ascending: true });

		//? Really stupid temp thing
		const season = Math.floor((new Date().getMonth() / 12) * 4) % 4;
		const year = new Date().getFullYear();
		const compare = {
			year: year,
			season: ['winter', 'spring', 'summer', 'fall'][season]
		};
		const prevSeason = season - 1 == -1 ? 3 : season - 1;
		const compare2cour = {
			year: season - 1 == -1 ? year - 1 : year,
			season: ['winter', 'spring', 'summer', 'fall'][prevSeason]
		};
		const malResponse = await Promise.all(
			data!.map(async (item, index) => {
				const { data } = await axios.get(
					`https://api.myanimelist.net/v2/anime`,
					{
						headers: { 'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID },
						params: {
							q: item.title!.substring(0, 64),
							fields: 'start_season,start_date,num_episodes,broadcast,status',
							limit: 5
						}
					}
				); //TODO: Catch error here somehow, might have to put below in .then() (currently using try catch)
				const broadcast = data?.data[0].node.broadcast
					? `${data?.data[0].node.broadcast.day_of_the_week} ${
							data?.data[0].node.broadcast.start_time ?? ''
					  }`
					: null;
				if (
					(!isEqual(data?.data[0].node.start_season, compare) &&
					!isEqual(data?.data[0].node.start_season, compare2cour)) ||
					data?.data[0].node.status == 'finished_airing'
				) {
					return {
						id: item.id,
						mal_id: data?.data[0].node.id,
						title: data?.data[0].node.title,
						image_url: data?.data[0].node.main_picture.large ?? '',
						start_date: data?.data[0].node.start_date ?? '',
						broadcast: broadcast,
						num_episodes: data?.data[0].node.num_episodes,
						status: data?.data[0].node.status,
						message: `Validate:https://myanimelist.net/anime.php?q=${encodeURIComponent(
							item.title!.substring(0, 64)
						)}`
					};
				}
				return {
					id: item.id,
					mal_id: data?.data[0].node.id,
					title: data?.data[0].node.title,
					image_url: data?.data[0].node.main_picture.large ?? '',
					start_date: data?.data[0].node.start_date ?? '',
					broadcast: broadcast,
					num_episodes: data?.data[0].node.num_episodes,
					status: data?.data[0].node.status,
					message: ''
				};
			})
		);

		await supabase.from('SeasonalDetails').delete().neq('id', -1);

		await supabase.from('SeasonalDetails').upsert(malResponse);

		await res.revalidate('/seasonal/track');
		return res.status(200).send(malResponse);
	} catch (error) {
		console.log(error);
		return res.status(500).send(error);
	}
}
