import { NextApiRequest, NextApiResponse } from "next";
import axios from 'axios';
import { load } from "cheerio";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../lib/database.types";

export default async function EpisodeTracker(req: NextApiRequest, res: NextApiResponse) {
  try {
	  const { data } = await axios.get('https://www.livechart.me/', { 
	    headers: { "Accept-Encoding": "gzip,deflate,compress" } 
	  });
	  const $ = load(data);
	
	  const animes = Array();
	  $('article.anime').each((index, element) => {
	    const href = $(element).find('a.mal-icon').attr('href')
	    const idString = href?.substring(href?.lastIndexOf('/') + 1)
	    const idInt = parseInt(idString!)
	    const countdown = $(element).find('time.episode-countdown').text()
	    const latestEpisodeString = countdown.split(':')[0].substring(2)
	    const latestEpisodeInt = parseInt(latestEpisodeString)
	    
	    animes.push({
	      mal_id: idInt ? idInt : -1,
	      /* title: $(element).find('h3.main-title > a').text(), */
	      latest_episode: latestEpisodeInt ? latestEpisodeInt : -1,
	    })
	  })
	
	  const supabase = createClient<Database>('https://esjopxdrlewtpffznsxh.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_API_KEY!);
	  const dataDB = await supabase 
	    .from('SeasonalDetails')
	    .select();
	
	  const relevantAnimes = animes.filter((item) => dataDB.data?.find(item1 => item1.mal_id == item.mal_id))
	
	  await supabase
	    .from('SeasonalDetails')
	    .upsert(relevantAnimes)
	
	  return res.status(200).send(relevantAnimes)
  } 
  catch (error) {
    console.log(error)
    return res.status(500).send(error)
  }
}