import { GetStaticPropsContext } from "next";
import Head from "next/head";
import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from "react";
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
  ratingByGenre: { id: number; name: string; rating1mean: number; rating2mean: number; rating1median: number | null; rating2median: number | null; titlecount: number; }[]
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

  const dataGenreRating = await supabase
    .from('Genre_to_Titles')
    .select('*, Completed!inner (rating1average, rating2average), Genres!inner (*)')

  const ratingByGenreAgg: { id: number, name: string, rating1agg: number[], rating2agg: number[], titlecount: number }[] = [];
  dataGenreRating.data?.forEach((relationship) => {
    const indexOfGenre = ratingByGenreAgg.findIndex(item => item.id == relationship.genre_id)
    if (ratingByGenreAgg[indexOfGenre]) {
      ratingByGenreAgg[indexOfGenre].rating1agg.push((relationship.Completed as { rating1average: number | null; rating2average: number | null;}).rating1average!)
      ratingByGenreAgg[indexOfGenre].rating2agg.push((relationship.Completed as { rating1average: number | null; rating2average: number | null;}).rating2average!)
      ratingByGenreAgg[indexOfGenre].titlecount++
    } else {
      ratingByGenreAgg.push({
        id: relationship.genre_id,
        name: (relationship.Genres as Database['public']['Tables']['Genres']['Row']).name!,
        rating1agg: [(relationship.Completed as { rating1average: number | null; rating2average: number | null;}).rating1average!],
        rating2agg: [(relationship.Completed as { rating1average: number | null; rating2average: number | null;}).rating2average!],
        titlecount: 1
      })
    }
  })
  const ratingByGenre = ratingByGenreAgg.map((item) => {
    return {
      id: item.id,
      name: item.name,
      rating1mean: item.rating1agg.reduce((acc, curr) => acc + curr) / item.titlecount,
      rating2mean: item.rating2agg.reduce((acc, curr) => acc + curr) / item.titlecount,
      rating1median: getMedian(item.rating1agg),
      rating2median: getMedian(item.rating2agg),
      titlecount: item.titlecount
    }
  }).sort((a, b) => b.titlecount - a.titlecount)

	return {
		props: {
      titleCount: data?.length,
			totalEpisodes,
      totalEpisodesWatched,
      totalTimeWatched,
      typeFreq,
      genreFreq,
      ratingByGenre,
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
  ratingByGenre,
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
}: StatisticsProps) {
  const sortMethodRating1Ref = useRef('');
  const sortMethodRating2Ref = useRef('');

  const [rating1ByGenre, setRating1ByGenre] = useState(ratingByGenre);
  const [rating2ByGenre, setRating2ByGenre] = useState(ratingByGenre);

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

  const statTable = ['GoodTaste', 'TomoLover', 'MAL Rating']
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
          <section className='flex flex-col items-center justify-center px-6 py-4 w-[25rem] border-[1px] border-white'>
            <h3 className='text-2xl font-semibold text-center'>
              Title count
            </h3>
            <span className='mb-2 text-2xl'>{titleCount}</span>
            <h3 className='text-2xl font-semibold text-center'>
              Total episodes watched
            </h3>
            <span className='mb-2 text-2xl '>{totalEpisodesWatched}</span>
            <h3 className='text-2xl font-semibold text-center'>
              Total episodes (including unwatched)
            </h3>
            <span className='text-2xl'>{totalEpisodes}</span>
          </section>
          <section className=' flex flex-col items-center justify-center p-4 w-[20rem] border-[1px] border-white'>
            <h3 className='mb-4 text-2xl font-semibold'>
              Total time watched
            </h3>
            <span className='mb-1 text-xl'>{Math.floor(totalTimeWatched / 60 / 60 / 24)} days</span>
            <span className='mb-1 text-xl'>{Math.floor(totalTimeWatched / 60 / 60 % 24)} hours</span>
            <span className='mb-1 text-xl'>{Math.floor(totalTimeWatched / 60 % 60)} minutes</span>
            <span className='mb-1 text-xl'>{Math.floor(totalTimeWatched % 60)} seconds</span>
          </section>
          <section className='col-span-2 flex flex-col items-center p-4 h-[20rem] w-[20rem] border-[1px] border-white overflow-auto'>
            <h3 className='mb-1 text-2xl font-semibold'>
              Top Genres by count
            </h3>
            {genreFreq.map((item, index) => (
              <div key={index} className='flex justify-between w-full p-2 border-[1px] border-white'>
                <Link href={`/completed/genres/${item.id}`} target='_blank' className='p-2 text-lg font-semibold link'>{item.name}</Link>
                <span className='p-2 text-lg'>{item.count}</span>
              </div>
            ))}
          </section>
        </div>
        <section className='flex'>
          <div className='flex flex-col items-center p-4 h-[20rem] w-[30rem] border-[1px] border-white overflow-auto'>
            <h3 className='mb-1 text-2xl font-semibold'>
              Top Genres by Rating (GoodTaste)
            </h3>
            <div className="flex items-center justify-center w-full bg-sky-600 border-white border-solid border-[1px] border-b-0">
              <div className="grow p-3 text-lg text-center font-semibold">Title</div>
              <div onClick={() => handleReorder(rating1ByGenre, 'rating1', setRating1ByGenre, sortMethodRating1Ref, 'mean')} className="relative p-3 w-24 text-lg text-center font-semibold cursor-pointer border-l-[1px] border-white">
                Mean 
                <span className='absolute'>{sortMethodRating1Ref.current.includes('rating1_mean') ? sortMethodRating1Ref.current.includes('asc') ? '▲' : '▼' : null}</span>
              </div>
              <div onClick={() => handleReorder(rating1ByGenre, 'rating1', setRating1ByGenre, sortMethodRating1Ref, 'median')} className="relative p-3 w-24 text-lg text-center font-semibold cursor-pointer border-l-[1px] border-white">
                Median
                <span className='absolute'>{sortMethodRating1Ref.current.includes('rating1_median') ? sortMethodRating1Ref.current.includes('asc') ? '▲' : '▼' : null}</span>
              </div>
            </div>
            {rating1ByGenre.map((item, index) => (
              <div key={index} style={{ borderBottomWidth: index >= ratingByGenre.length - 1 ? 1 : 0 }} className='flex justify-between w-full p-2 border-[1px] border-white'>
                <Link href={`/completed/genres/${item.id}`} target='_blank' className='grow px-3 py-2 text-lg font-semibold link'>{item.name}</Link>
                <span className="w-24 px-3 py-2 text-lg text-center">{item.rating1mean.toFixed(2)}</span>
                <span className="w-24 px-3 py-2 text-lg text-center">{item.rating1median}</span>
              </div>
            ))}
          </div>
          <div className='flex flex-col items-center p-4 h-[20rem] w-[30rem] border-[1px] border-white overflow-auto'>
            <h3 className='mb-1 text-2xl font-semibold'>
              Top Genres by Rating (TomoLover)
            </h3>
            <div className="flex items-center justify-center w-full bg-sky-600 border-white border-solid border-[1px] border-b-0">
              <div className="grow p-3 text-lg text-center font-semibold">Title</div>
              <div onClick={() => handleReorder(rating2ByGenre, 'rating2', setRating2ByGenre, sortMethodRating2Ref, 'mean')} className="relative p-3 w-24 text-lg text-center font-semibold cursor-pointer border-l-[1px] border-white">
                Mean
                <span className='absolute'>{sortMethodRating2Ref.current.includes('rating2_mean') ? sortMethodRating2Ref.current.includes('asc') ? '▲' : '▼' : null}</span>
              </div>
              <div onClick={() => handleReorder(rating2ByGenre, 'rating2', setRating2ByGenre, sortMethodRating2Ref, 'median')} className="relative p-3 w-24 text-lg text-center font-semibold cursor-pointer border-l-[1px] border-white">
                Median
                <span className='absolute'>{sortMethodRating2Ref.current.includes('rating2_median') ? sortMethodRating2Ref.current.includes('asc') ? '▲' : '▼' : null}</span>
              </div>
            </div>
            {rating2ByGenre.map((item, index) => (
              <div key={index} style={{ borderBottomWidth: index >= ratingByGenre.length - 1 ? 1 : 0 }} className='flex justify-between w-full p-2 border-[1px] border-white'>
                <Link href={`/completed/genres/${item.id}`} target='_blank' className='grow px-3 py-2 text-lg font-semibold link'>{item.name}</Link>
                <span className="w-24 px-3 py-2 text-lg text-center">{item.rating2mean.toFixed(2)}</span>
                <span className="w-24 px-3 py-2 text-lg text-center">{item.rating2median}</span>
              </div>
            ))}
          </div>
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
                {statTable.map(item => <th key={item+'a'}>{item}</th>)}
                {statTable.map(item => <th key={item+'b'}>{item}</th>)}
                {statTable.map(item => <th key={item+'c'}>{item}</th>)}
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
      </main>
    </>
  )

  function handleReorder(
    toReorderArr: {
      id: number;
      name: string;
      rating1mean: number;
      rating2mean: number;
      rating1median: number | null;
      rating2median: number | null;
      titlecount: number;
    }[],
    toReorder: 'rating1' | 'rating2',
    setReorderFunc: Dispatch<SetStateAction<{
      id: number;
      name: string;
      rating1mean: number;
      rating2mean: number;
      rating1median: number | null;
      rating2median: number | null;
      titlecount: number;
    }[]>>,
    sortMethodRef: MutableRefObject<string>,
    field: 'mean' | 'median'
  ) {
    console.log(sortMethodRef.current)
    if (field == 'mean') {
      if (sortMethodRef.current == `${toReorder}_mean_desc`) {
        const reordered = toReorderArr.slice().sort((a, b) => a[`${toReorder}mean`] - b[`${toReorder}mean`]);
        sortMethodRef.current = `${toReorder}_mean_asc`;
        setReorderFunc(reordered);
      } else {
        const reordered = toReorderArr.slice().sort((a, b) => b[`${toReorder}mean`] - a[`${toReorder}mean`]);
        sortMethodRef.current = `${toReorder}_mean_desc`;
        setReorderFunc(reordered);
      }
    } else {
      if (sortMethodRef.current == `${toReorder}_median_desc`) {
        const reordered = toReorderArr.slice().sort((a, b) => a[`${toReorder}median`]! - b[`${toReorder}median`]!);
        sortMethodRef.current = `${toReorder}_median_asc`;
        setReorderFunc(reordered);
      } else {
        const reordered = toReorderArr.slice().sort((a, b) => b[`${toReorder}median`]! - a[`${toReorder}median`]!);
        sortMethodRef.current = `${toReorder}_median_desc`;
        setReorderFunc(reordered);
      }
    }
  }
}