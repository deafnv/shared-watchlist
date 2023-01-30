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

interface StatisticsProps {
  titleCount: number;
	totalEpisodes: number;
  totalEpisodesWatched: number;
  totalTimeWatched: number;
  typeFreq: { [key: string]: number };
  rating1FreqArr: Array<{ [key: number]: number }>;
  rating2FreqArr: Array<{ [key: number]: number }>;
  rating1Mean: number;
  rating2Mean: number;
  rating1SD: number;
  rating2SD: number;
}

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

  const typeFreq: { [key: string]: number } = {}
  data?.forEach((item) => {
    item.type_conv?.map((type) => {
      if (typeFreq[type]) {
        typeFreq[type] += 1
      } else {
        typeFreq[type] = 1
      }
    })
  })
  
  const rating1AggregateArr = data?.map((item) => item.rating1average)
  const rating2AggregateArr = data?.map((item) => item.rating2average)
  const rating1Mean = rating1AggregateArr?.reduce((acc, curr) => acc! + curr!)! / rating1AggregateArr!.length
  const rating2Mean = rating2AggregateArr?.reduce((acc, curr) => acc! + curr!)! / rating2AggregateArr!.length

  function getStandardDeviation (array: (number | null)[], mean: number) {
    const n = array.length
    return Math.sqrt(array.map(x => Math.pow(x! - mean, 2)).reduce((a, b) => a + b) / n)
  }
  const rating1SD = getStandardDeviation(rating1AggregateArr!, rating1Mean)
  const rating2SD = getStandardDeviation(rating2AggregateArr!, rating2Mean)

	return {
		props: {
      res: data,
      titleCount: data?.length,
			totalEpisodes,
      totalEpisodesWatched,
      totalTimeWatched,
      typeFreq,
      rating1FreqArr,
      rating2FreqArr,
      rating1Mean,
      rating2Mean,
      rating1SD,
      rating2SD
		}
	};
};
// TODO: add revalidate button
export default function Statistics({
  res,
  titleCount,
	totalEpisodes,
  totalEpisodesWatched,
  totalTimeWatched,
  typeFreq,
  rating1FreqArr,
  rating2FreqArr,
  rating1Mean,
  rating2Mean,
  rating1SD,
  rating2SD
}: { res: any } & StatisticsProps) {
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

  //TODO: Include stats for genre: rating by genre, genre count, etc.
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
        <div className='flex flex-col items-center justify-center px-6 py-4 border-[1px] border-white'>
          <h3 className='text-2xl font-semibold'>
            Title count
          </h3>
          <span className='mb-2 text-2xl'>{titleCount}</span>
          <h3 className='text-2xl font-semibold'>
            Total episodes watched
          </h3>
          <span className='mb-2 text-2xl'>{totalEpisodesWatched}</span>
          <h3 className='text-2xl font-semibold'>
            Total episodes (including unwatched)
          </h3>
          <span className='text-2xl'>{totalEpisodes}</span>
        </div>
        <div className='flex flex-col items-center justify-center p-4 w-[20rem] border-[1px] border-white'>
          <h3 className='mb-1 text-2xl font-semibold'>
            Total time watched
          </h3>
          <span className='text-xl'>{Math.floor(totalTimeWatched / 60 / 60 / 24)} days</span>
          <span className='text-xl'>{Math.floor(totalTimeWatched / 60 / 60 % 24)} hours</span>
          <span className='text-xl'>{Math.floor(totalTimeWatched / 60 % 60)} minutes</span>
          <span className='text-xl'>{Math.floor(totalTimeWatched % 60)} seconds</span>
        </div>
        <div className='flex flex-col items-center justify-center p-4 w-[20rem] border-[1px] border-white'>
          <h3 className='mb-1 text-2xl font-semibold'>
            Types count
          </h3>
          <div className='flex gap-6'>
            {Object.keys(typeFreq).map((key) => {
              return (
                <div key={key} className='flex flex-col items-center'>
                  <span className='text-lg font-semibold'>
                    {key}
                  </span>
                  <span>
                    {typeFreq[key]}
                  </span> 
                </div>
              )
            })}
          </div>
        </div>
        <div className='flex flex-col items-center justify-center gap-4 p-4 w-[45rem] border-[1px] border-white'>
          <h3 className='mb-1 text-2xl font-semibold'>
            Ratings
          </h3> 
          <table>
            <tbody>
              <tr>
                <th colSpan={2}>Mean</th>
                <th colSpan={2}>Std. Dev.</th>
              </tr>
              <tr>
                <th>Rating1</th>
                <th>Rating2</th>
                <th>Rating1</th>
                <th>Rating2</th>
              </tr>
              <tr>
                <td>
                  {rating1Mean.toFixed(2)}
                </td>
                <td>
                  {rating2Mean.toFixed(2)}
                </td>
                <td>
                  {rating1SD.toFixed(4)}
                </td>
                <td>
                  {rating2SD.toFixed(4)}
                </td>
              </tr>
            </tbody>
          </table>
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