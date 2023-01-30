import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../lib/database.types';

export default async function ChangeDetails(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const { body, method } = req;
	const { id, mal_id } = body;

	if (method === 'POST') {
		try {
			const { data } = await axios.get(
				`https://api.myanimelist.net/v2/anime/${mal_id}`,
				{
					headers: { 'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID },
					params: {
						fields: 'alternative_titles,start_date,end_date,genres,synopsis,average_episode_duration,mean'
					}
				}
			);

			//TODO: Add function here to add new genres if any are available. Later on, also delete genres with no entries.

			const anime = {
        end_date: data?.end_date ?? '',
        id: id,
        image_url: data?.main_picture.large ?? '',
        mal_alternative_title: data?.alternative_titles.en ?? '',
        mal_id: parseInt(data?.id),
        mal_title: data?.title,
        mal_synopsis: data?.synopsis ?? '',
				mal_rating: data?.mean ?? 0,
        start_date: data?.start_date ?? '',
				average_episode_duration: data?.average_episode_duration ?? 0
      }
      
			//* Through testing, these API routes with restricted queries like UPDATE, DELETE, or INSERT fails silently if the public API key is provided instead of the service key
			const supabase = createClient<Database>(
				'https://esjopxdrlewtpffznsxh.supabase.co',
				process.env.SUPABASE_SERVICE_API_KEY!
			);
			await supabase.from('CompletedDetails').delete().eq('id', id);

			await supabase.from('CompletedDetails').upsert(anime);

			return res.status(200).send(anime);
		} catch (error) {
			console.log(error);
			return res.status(500).send(error);
		}
	}
	return res.status(405).send('Method not supported');
}
