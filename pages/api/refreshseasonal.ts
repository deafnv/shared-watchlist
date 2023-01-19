import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import { Database } from "../../lib/database.types";
import axios from "axios";
import isEqual from 'lodash/isEqual'

export default async function RefreshSeasonal(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient<Database>('https://esjopxdrlewtpffznsxh.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_API_KEY!);
  const { data } = await supabase 
    .from('PTW-CurrentSeason')
    .select()
    .order('id', { ascending: true });

  //? Really stupid temp thing
  const season = Math.floor((new Date().getMonth() / 12 * 4)) % 4
  const year = new Date().getFullYear()
  const compare = {
    year: year,
    season: ['winter', 'spring', 'summer', 'fall'][season]
  }
  const malResponse = await Promise.all(data!.map(async (item, index) => {
      const { data } = await axios.get(`https://api.myanimelist.net/v2/anime`, {
        headers: { "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID },
        params: {
          q: item.title!.substring(0, 64),
          fields: 'start_season,start_date'
        }
      }) //TODO: Catch error here somehow, might have to put below in .then()
      if (!isEqual(data?.data[0].node.start_season, compare)) {
        return {
          id: item.id,
          mal_id: data?.data[0].node.id,
          title: data?.data[0].node.title,
          image_url: data?.data[0].node.main_picture.large ?? '',
          start_date: data?.data[0].node.start_date ?? '',
          message: 'Validate'
        }
      }
      return {
        id: item.id,
        mal_id: data?.data[0].node.id,
        title: data?.data[0].node.title,
        image_url: data?.data[0].node.main_picture.large ?? '',
        start_date: data?.data[0].node.start_date ?? '',
        message: ''
      }
  }))

  await supabase
    .from('SeasonalDetails')
    .delete()
    .neq('id', -1);

  await supabase
    .from('SeasonalDetails')
    .upsert(malResponse)
}