import { GetStaticPropsContext } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../lib/database.types";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement
} from 'chart.js'
import Link from "next/link";

interface StatisticsProps {
  titleCount: number;
	totalEpisodes: number;
  totalEpisodesWatched: number;
  totalTimeWatched: number;
  typeFreq: { [key: string]: number };
  genreFreq: { id: number; name: string | null; count: number; }[];
  rating1FreqArr: Array<{ [key: number]: number }>;
  rating2FreqArr: Array<{ [key: number]: number }>;
  rating1Mean: number;
  rating2Mean: number;
  ratingMalMean: number;
  rating1Median: number;
  rating2Median: number;
  ratingMalMedian: number;
  rating1SD: number;
  rating2SD: number;
  ratingMalSD: number;
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
  const ratingMalAggregateArr = data?.map((item) => (item.CompletedDetails as Database['public']['Tables']['CompletedDetails']['Row']).mal_rating)
  const ratingMalMean = ratingMalAggregateArr?.reduce((acc, curr) => acc! + curr!)! / ratingMalAggregateArr!.length

  function getMedian(array: (number | null)[]) {
    const sortedArr = array.sort((a, b) => a! - b!)
    const midpoint = Math.floor(sortedArr.length / 2)
    const median = sortedArr.length % 2 === 1 ? sortedArr[midpoint] : (sortedArr[midpoint - 1]! + sortedArr[midpoint]!) / 2
    return median
  }
  const rating1Median = getMedian(rating1AggregateArr!)
  const rating2Median = getMedian(rating2AggregateArr!)
  const ratingMalMedian = getMedian(ratingMalAggregateArr!)

  function getStandardDeviation (array: (number | null)[], mean: number) {
    const n = array.length
    return Math.sqrt(array.map(x => Math.pow(x! - mean, 2)).reduce((a, b) => a + b) / n)
  }
  const rating1SD = getStandardDeviation(rating1AggregateArr!, rating1Mean)
  const rating2SD = getStandardDeviation(rating2AggregateArr!, rating2Mean)
  const ratingMalSD = getStandardDeviation(ratingMalAggregateArr!, ratingMalMean)

  const dataGenre = await supabase
    .from('Genres')
    .select('*, Genre_to_Titles!inner (id)')

  const genreFreq = dataGenre.data?.map((item) => ({
      id: item.id, 
      name: item.name,
      count: (item.Genre_to_Titles as Database['public']['Tables']['Genre_to_Titles']['Row'][]).length
    }))
  genreFreq?.sort((a, b) => b.count - a.count)

	return {
		props: {
      titleCount: data?.length,
			totalEpisodes,
      totalEpisodesWatched,
      totalTimeWatched,
      typeFreq,
      genreFreq,
      rating1FreqArr,
      rating2FreqArr,
      rating1Mean,
      rating2Mean,
      ratingMalMean,
      rating1Median,
      rating2Median,
      ratingMalMedian,
      rating1SD,
      rating2SD,
      ratingMalSD
		}
	};
};
// TODO: add revalidate button
export default function Statistics({
  titleCount,
	totalEpisodes,
  totalEpisodesWatched,
  totalTimeWatched,
  typeFreq,
  genreFreq,
  rating1FreqArr,
  rating2FreqArr,
  rating1Mean,
  rating2Mean,
  ratingMalMean,
  rating1Median,
  rating2Median,
  ratingMalMedian,
  rating1SD,
  rating2SD,
  ratingMalSD
}: { res: any } & { resGenres: any } & StatisticsProps) {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement,
    ArcElement
  )

  const pieOptions = {
    plugins: {
      legend: {
        labels: {
          color: '#000000',
          font: {
            size: 15
          }
        }
      }
    }
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#000000',
          font: {
            size: 13
          }
        }
      },
      title: {
        display: true,
        text: 'Rating Distribution',
        color: '#000000',
        font: {
          size: 15
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#000000'
        }
      },
      y: {
        ticks: {
          color: '#000000'
        }
      }
    }
  }

  //TODO: Include stats for genre: rating by genre
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
        <div className='grid grid-cols-2 gap-4 place-items-center'>
          <section className='col-span-2 flex flex-col items-center justify-center px-6 py-4 border-[1px] border-white'>
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
          </section>
          <section className='flex flex-col items-center justify-center p-4 w-[20rem] border-[1px] border-white'>
            <h3 className='mb-4 text-2xl font-semibold'>
              Total time watched
            </h3>
            <span className='mb-1 text-xl'>{Math.floor(totalTimeWatched / 60 / 60 / 24)} days</span>
            <span className='mb-1 text-xl'>{Math.floor(totalTimeWatched / 60 / 60 % 24)} hours</span>
            <span className='mb-1 text-xl'>{Math.floor(totalTimeWatched / 60 % 60)} minutes</span>
            <span className='mb-1 text-xl'>{Math.floor(totalTimeWatched % 60)} seconds</span>
          </section>
          <section className='flex flex-col items-center p-4 h-[20rem] w-[20rem] border-[1px] border-white overflow-auto'>
            <h3 className='mb-1 text-2xl font-semibold'>
              Top Genres
            </h3>
            {genreFreq.map((item, index) => (
              <div key={index} className='flex justify-between w-full p-2 border-[1px] border-white'>
                <Link href={`/completed/genres/${item.id}`} target='_blank' className='p-2 text-lg font-semibold'>{item.name}</Link>
                <span className='p-2 text-lg'>{item.count}</span>
              </div>
            ))}
          </section>
          <section className='flex flex-col items-center justify-center h-[30rem] w-[30rem] col-span-2 p-4 border-[1px] border-white'>
            <h3 className='mb-2 text-2xl font-semibold'>
              Types
            </h3>
            <div className='p-4 h-full w-full bg-gray-400 rounded-lg'>
              <Pie 
                options={pieOptions} 
                data={{
                  labels: Object.keys(typeFreq),
                  datasets: [
                    {
                      data: Object.values(typeFreq),
                      backgroundColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)'
                      ],
                      borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)'
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
                className='mx-auto'
              />
            </div>
          </section>
          <section className='col-span-2 flex flex-col items-center justify-center gap-4 p-4 w-[52rem] border-[1px] border-white'>
            <h3 className='mb-1 text-2xl font-semibold'>
              Ratings
            </h3> 
            <table>
              <tbody>
                <tr>
                  <th colSpan={3}>Mean</th>
                  <th colSpan={3}>Median</th>
                  <th colSpan={3}>Std. Dev.</th>
                </tr>
                <tr>
                  {Array(3).fill('').map((i, index) => (
                    <>
                      <th>GoodTaste</th>
                      <th>TomoLover</th>
                      <th>MAL Rating</th>
                    </>
                  ))}
                </tr>
                <tr>
                  <td>{rating1Mean.toFixed(2)}</td>
                  <td>{rating2Mean.toFixed(2)}</td>
                  <td>{ratingMalMean.toFixed(2)}</td>
                  <td>{rating1Median.toFixed(2)}</td>
                  <td>{rating2Median.toFixed(2)}</td>
                  <td>{ratingMalMedian.toFixed(2)}</td>
                  <td>{rating1SD.toFixed(4)}</td>
                  <td>{rating2SD.toFixed(4)}</td>
                  <td>{ratingMalSD.toFixed(4)}</td>
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
                      label: 'GoodTaste',
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
                      label: 'TomoLover',
                      data: rating2FreqArr.map(item => Object.values(item)[0]),
                      backgroundColor: '#f55de3'
                    }
                  ]
                }} 
                className='bg-gray-300 rounded-lg'
              />
            </div>
          </section>
        </div>
      </main>
    </>
  )
}