import { GetStaticPropsContext } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../lib/database.types";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from 'chart.js'

export const getStaticProps = async (context: GetStaticPropsContext) => {
	const supabase = createClient<Database>(
		'https://esjopxdrlewtpffznsxh.supabase.co',
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	);
	const { data } = await supabase
    .from('Completed')
    .select('*, CompletedDetails!inner( * )')
    .order('id', { ascending: true });

  let totalEpisodes = data?.reduce((acc: any, current: any) => {
    return acc + current.episode_total!
  }, 0);
  let totalEpisodesWatched = data?.reduce((acc: any, current: any) => {
    return acc + current.episode_actual!
  }, 0);
  let totalTimeWatched = data?.reduce((acc: any, current: any) => {
    return acc + current.episode_actual * current.CompletedDetails.average_episode_duration
  }, 0)

  const rating1Freq: { [key: number]: number } = {}
  data?.forEach((item) => {
    if (rating1Freq[item.rating1average as number]) {
      rating1Freq[item.rating1average as number] += 1
    } else {
      rating1Freq[item.rating1average as number] = 1
    }
  })
  const rating1FreqArr = Object.keys(rating1Freq).map((key: any) => ({ [key]: rating1Freq[key] })).sort((a, b) => parseFloat(Object.keys(a)[0]) - parseFloat(Object.keys(b)[0]))

  const rating2Freq: { [key: number]: number } = {}
  data?.forEach((item) => {
    if (rating2Freq[item.rating2average as number]) {
      rating2Freq[item.rating2average as number] += 1
    } else {
      rating2Freq[item.rating2average as number] = 1
    }
  })
  const rating2FreqArr = Object.keys(rating2Freq).map((key: any) => ({ [key]: rating2Freq[key] })).sort((a, b) => parseFloat(Object.keys(a)[0]) - parseFloat(Object.keys(b)[0]))

	return {
		props: {
      titleCount: data?.length,
			totalEpisodes,
      totalEpisodesWatched,
      totalTimeWatched,
      rating1FreqArr,
      rating2FreqArr
		}
	};
};
// TODO: add revalidate button
export default function Statistics({
  titleCount,
	totalEpisodes,
  totalEpisodesWatched,
  totalTimeWatched,
  rating1FreqArr,
  rating2FreqArr
}: {
  titleCount: number;
	totalEpisodes: number;
  totalEpisodesWatched: number;
  totalTimeWatched: number;
  rating1FreqArr: Array<{ [key: number]: number }>;
  rating2FreqArr: Array<{ [key: number]: number }>;
}) {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement
  )

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Rating frequency',
      },
      
    },
  }

  return (
    <>
			<Head>
				<title>Cytube Watchlist</title>
				<meta name="description" content="Watchlist statistics" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className='flex flex-col items-center justify-center mb-24 px-1 md:px-0'>
        <h2 className='p-2 text-3xl'>
          Statistics
        </h2>
        <h3 className='text-2xl'>
          Title count
        </h3>
        <span className='text-2xl'>{titleCount}</span>
        <h3 className='text-2xl'>
          Total episodes watched
        </h3>
        <span className='text-2xl'>{totalEpisodesWatched}</span>
        <h3 className='text-2xl'>
          Total episodes (including unwatched)
        </h3>
        <span className='text-2xl'>{totalEpisodes}</span>
        <div className='flex flex-col items-center justify-center p-4 w-[20rem] border-[1px] border-white'>
          <h3 className='mb-1 text-2xl font-semibold'>
            Total time watched
          </h3>
          <span className='text-xl'>{Math.floor(totalTimeWatched / 60 / 60 / 24)} days</span>
          <span className='text-xl'>{Math.floor(totalTimeWatched / 60 / 60 % 24)} hours</span>
          <span className='text-xl'>{Math.floor(totalTimeWatched / 60 % 60)} minutes</span>
          <span className='text-xl'>{Math.floor(totalTimeWatched % 60)} seconds</span>
        </div>
        <div className='flex flex-col items-center justify-center gap-4 p-4 w-[45rem] border-[1px] border-white'>
          <h3 className='mb-1 text-2xl font-semibold'>
            Ratings
          </h3>
          <div className='relative h-[20rem] w-[40rem]'>
            <Bar 
              options={barOptions} 
              data={{
                labels: rating1FreqArr.map(item => parseFloat(Object.keys(item)[0])),
                datasets: [
                  {
                    label: 'rating1',
                    data: rating1FreqArr.map(item => Object.values(item)[0]),
                    backgroundColor: '#f55de3'
                  }
                ]
              }} 
              className='bg-gray-300 rounded-lg'
            />
          </div>
          <div className='relative h-[20rem] w-[40rem]'>
            <Bar 
              options={barOptions} 
              data={{
                labels: rating2FreqArr.map(item => parseFloat(Object.keys(item)[0])),
                datasets: [
                  {
                    label: 'rating2',
                    data: rating2FreqArr.map(item => Object.values(item)[0]),
                    backgroundColor: '#f55de3'
                  }
                ]
              }} 
              className='bg-gray-300 rounded-lg'
            />
          </div>
        </div>
      </main>
    </>
  )
}