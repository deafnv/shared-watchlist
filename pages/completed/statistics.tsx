import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Dispatch, MutableRefObject, SetStateAction, useRef, useState } from 'react'
import { Line, Pie } from 'react-chartjs-2'
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
  ArcElement,
  TimeScale,
} from 'chart.js'
import {
  mean,
  median,
  standardDeviation,
  variance,
  medianAbsoluteDeviation,
  sampleCorrelation,
  sampleCovariance,
} from 'simple-statistics'
import 'chartjs-adapter-date-fns'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import prisma from '@/lib/prisma'
import { DifferenceRatingData, GenreByRatingData, StatisticsProps } from '@/lib/types'

export const getStaticProps = async () => {
  const data = await prisma.completed.findMany({
    where: {
      details: {
        isNot: null,
      },
    },
    include: {
      details: true,
    },
    orderBy: {
      id: 'asc',
    },
  })

  let totalEpisodes = data?.reduce((acc, current) => {
    return acc + current.episode_actual!
  }, 0)
  let totalEpisodesWatched = data?.reduce((acc, current) => {
    return acc + current.episode_total!
  }, 0)
  let totalTimeWatched = data?.reduce((acc, current) => {
    return acc + current.episode_actual * (current.details?.average_episode_duration ?? 1)
  }, 0)

  const rating1Freq: { [key: number]: number } = {}
  data?.forEach((item) => {
    if (rating1Freq[item.rating1average as number]) {
      rating1Freq[item.rating1average as number] += 1
    } else {
      rating1Freq[item.rating1average as number] = 1
    }
  })
  const rating1FreqArr = Object.keys(rating1Freq)
    .map((key: any) => ({ [key]: rating1Freq[key] }))
    .sort((a, b) => parseFloat(Object.keys(a)[0]) - parseFloat(Object.keys(b)[0]))

  const rating2Freq: { [key: number]: number } = {}
  data?.forEach((item) => {
    if (rating2Freq[item.rating2average as number]) {
      rating2Freq[item.rating2average as number] += 1
    } else {
      rating2Freq[item.rating2average as number] = 1
    }
  })
  const rating2FreqArr = Object.keys(rating2Freq)
    .map((key: any) => ({ [key]: rating2Freq[key] }))
    .sort((a, b) => parseFloat(Object.keys(a)[0]) - parseFloat(Object.keys(b)[0]))

  const ratingMalFreq: { [key: number]: number } = {}
  data?.forEach((item) => {
    const malRating = item.details?.mal_rating!
    let decimal

    if (parseFloat((malRating % 1).toPrecision(1)) < 0.125) decimal = 0
    else if (parseFloat((malRating % 1).toPrecision(1)) < 0.375) decimal = 0.25
    else if (parseFloat((malRating % 1).toPrecision(1)) < 0.625) decimal = 0.5
    else if (parseFloat((malRating % 1).toPrecision(1)) < 0.875) decimal = 0.75
    else decimal = 1

    const roundedScore = Math.trunc(malRating) + decimal
    if (roundedScore == 0) {
      return
    } else if (ratingMalFreq[roundedScore]) {
      ratingMalFreq[roundedScore] += 1
    } else {
      ratingMalFreq[roundedScore] = 1
    }
  })
  const ratingMalFreqArr = Object.keys(ratingMalFreq)
    .map((key: any) => ({ [key]: ratingMalFreq[key] }))
    .sort((a, b) => parseFloat(Object.keys(a)[0]) - parseFloat(Object.keys(b)[0]))

  const typeFreq: { [key: string]: number } = {}
  data?.forEach((item) => {
    ;(item?.type_conv as string[]).map((type) => {
      if (typeFreq[type]) {
        typeFreq[type] += 1
      } else {
        typeFreq[type] = 1
      }
    })
  })

  const rating1AggregateArr = data?.map((item) => item.rating1average)
  const rating2AggregateArr = data?.map((item) => item.rating2average)
  const rating1Mean = mean(rating1AggregateArr as number[])
  const rating2Mean = mean(rating2AggregateArr as number[])
  const ratingMalAggregateArr = data?.map((item) => item.details?.mal_rating)
  const ratingMalMean = mean(ratingMalAggregateArr as number[])

  const rating1Median = median(rating1AggregateArr as number[])
  const rating2Median = median(rating2AggregateArr as number[])
  const ratingMalMedian = median(ratingMalAggregateArr as number[])

  const rating1SD = standardDeviation(rating1AggregateArr as number[])
  const rating2SD = standardDeviation(rating2AggregateArr as number[])
  const ratingMalSD = standardDeviation(ratingMalAggregateArr as number[])

  const dataGenre = await prisma.genres.findMany({
    include: {
      completeds: {
        select: {
          id: true,
        },
      },
    },
  })

  const genreFreq = dataGenre?.map((item) => ({
    id: item.id,
    name: item.name,
    count: item.completeds.length,
  }))
  genreFreq?.sort((a, b) => b.count - a.count)

  const dataGenreRating = await prisma.genresOnCompleted.findMany({
    include: {
      completed: {
        select: {
          rating1average: true,
          rating2average: true,
        },
      },
      genre: true,
    },
  })

  const ratingByGenreAgg: {
    id: number
    name: string
    rating1agg: number[]
    rating2agg: number[]
    titlecount: number
  }[] = []
  dataGenreRating?.forEach((relationship) => {
    const indexOfGenre = ratingByGenreAgg.findIndex((item) => item.id == relationship.genre_id)
    if (ratingByGenreAgg[indexOfGenre]) {
      ratingByGenreAgg[indexOfGenre].rating1agg.push(relationship.completed.rating1average!)
      ratingByGenreAgg[indexOfGenre].rating2agg.push(relationship.completed.rating2average!)
      ratingByGenreAgg[indexOfGenre].titlecount++
    } else {
      ratingByGenreAgg.push({
        id: relationship.genre_id,
        name: relationship.genre.name!,
        rating1agg: [relationship.completed.rating1average!],
        rating2agg: [relationship.completed.rating2average!],
        titlecount: 1,
      })
    }
  })
  const genreByRating = ratingByGenreAgg
    .map((item) => {
      return {
        id: item.id,
        name: item.name,
        rating1mean: mean(item.rating1agg),
        rating2mean: mean(item.rating2agg),
        rating1median: median(item.rating1agg),
        rating2median: median(item.rating2agg),
        titlecount: item.titlecount,
      }
    })
    .sort((a, b) => b.titlecount - a.titlecount)

  const titleByRatingDiff = data?.map((item) => {
    return {
      id: item.id,
      title: item.title,
      rating1average: item.rating1average,
      rating2average: item.rating2average,
      rating1MalDiff: (item.rating1average ?? 0) - (item.details?.mal_rating ?? 0),
      rating2MalDiff: (item.rating2average ?? 0) - (item.details?.mal_rating ?? 0),
      rating1rating2Diff: (item.rating1average ?? 0) - (item.rating2average ?? 0),
    }
  })

  const dateRatingData = data
    ?.map((item) => {
      return {
        id: item.id,
        title: item.title,
        rating1average: item.rating1average,
        rating2average: item.rating2average,
        malRating: item.details?.mal_rating,
        broadcastDate: item.details?.start_date,
        endWatchDate: item.endconv,
      }
    })
    .sort((a, b) => new Date(a.broadcastDate!).getTime() - new Date(b.broadcastDate!).getTime())

  return {
    props: {
      titleCount: data?.length,
      totalEpisodes,
      totalEpisodesWatched,
      totalTimeWatched,
      typeFreq,
      genreFreq,
      genreByRating,
      titleByRatingDiff,
      rating1FreqArr,
      rating2FreqArr,
      ratingMalFreqArr,
      dateRatingData,
      ratingStatTable: {
        rating1Mean,
        rating2Mean,
        ratingMalMean,
        rating1Median,
        rating2Median,
        ratingMalMedian,
        rating1SD,
        rating2SD,
        ratingMalSD,
        rating1Variance: variance(rating1AggregateArr as number[]),
        rating2Variance: variance(rating2AggregateArr as number[]),
        ratingMalVariance: variance(ratingMalAggregateArr as number[]),
        rating1MAD: medianAbsoluteDeviation(rating1AggregateArr as number[]),
        rating2MAD: medianAbsoluteDeviation(rating2AggregateArr as number[]),
        ratingMalMAD: medianAbsoluteDeviation(ratingMalAggregateArr as number[]),
        rating1MalCorrelation: sampleCorrelation(
          rating1AggregateArr as number[],
          ratingMalAggregateArr as number[]
        ),
        rating2MalCorrelation: sampleCorrelation(
          rating2AggregateArr as number[],
          ratingMalAggregateArr as number[]
        ),
        rating1rating2Correlation: sampleCorrelation(
          rating1AggregateArr as number[],
          rating2AggregateArr as number[]
        ),
        rating1MalCovariance: sampleCovariance(
          rating1AggregateArr as number[],
          ratingMalAggregateArr as number[]
        ),
        rating2MalCovariance: sampleCovariance(
          rating2AggregateArr as number[],
          ratingMalAggregateArr as number[]
        ),
        rating1rating2Covariance: sampleCovariance(
          rating1AggregateArr as number[],
          rating2AggregateArr as number[]
        ),
      },
    },
  }
}

// TODO: add revalidate button
export default function Statistics({
  titleCount,
  totalEpisodes,
  totalEpisodesWatched,
  totalTimeWatched,
  typeFreq,
  genreFreq,
  genreByRating,
  titleByRatingDiff,
  rating1FreqArr,
  rating2FreqArr,
  ratingMalFreqArr,
  dateRatingData,
  ratingStatTable,
}: StatisticsProps) {
  const sortMethodRating1Ref = useRef('rating1_mean_desc')
  const sortMethodRating2Ref = useRef('rating2_mean_desc')
  const sortMethodRating1Rating2Diff = useRef('diff_desc')
  const sortMethodRating1MalDiff = useRef('diff_desc')
  const sortMethodRating2MalDiff = useRef('diff_desc')

  const [genreByRating1, setRating1ByGenre] = useState(
    genreByRating.slice().sort((a, b) => b.rating1mean - a.rating1mean)
  )
  const [genreByRating2, setRating2ByGenre] = useState(
    genreByRating.slice().sort((a, b) => b.rating2mean - a.rating2mean)
  )
  const [titleByRating1Rating2Diff, setTitleByRating1Rating2Diff] = useState(
    titleByRatingDiff.slice().sort((a, b) => b.rating1rating2Diff - a.rating1rating2Diff)
  )
  const [titleByRating1MalDiff, setTitleByRating1MalDiff] = useState(
    titleByRatingDiff.slice().sort((a, b) => b.rating1MalDiff - a.rating1MalDiff)
  )
  const [titleByRating2MalDiff, setTitleByRating2MalDiff] = useState(
    titleByRatingDiff.slice().sort((a, b) => b.rating2MalDiff - a.rating2MalDiff)
  )

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement,
    ArcElement,
    TimeScale
  )

  const pieOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#000000',
          font: {
            size: 15,
          },
        },
      },
    },
  }

  const RatingBroadcastScatter = dynamic(() => import('@/components/RatingBroadcastScatter'), {
    ssr: false,
  })
  const RatingEndScatter = dynamic(() => import('@/components/RatingEndScatter'), {
    ssr: false,
  })

  const statTable = ['Rating 1', 'Rating 2', 'MAL Rating']
  return (
    <>
      <Head>
        <title>Watchlist</title>
        <meta name='description' content='Watchlist statistics' />
      </Head>

      <main className='flex flex-col items-center justify-center mb-24 px-6 py-2'>
        <h2 className='p-2 text-2xl sm:text-3xl'>Statistics</h2>

        <div className='grid grid-cols-2 gap-4 place-items-center'>
          <section className='flex flex-col col-span-2 md:col-span-1 items-center justify-center px-6 py-4 w-[24rem] bg-primary-foreground shadow-md shadow-black rounded-lg'>
            <h3 className='text-xl sm:text-2xl font-semibold text-center'>Title count</h3>
            <span className='mb-2 text-xl sm:text-2xl'>{titleCount}</span>
            <h3 className='text-xl sm:text-2xl font-semibold text-center'>
              Total episodes watched
            </h3>
            <span className='mb-2 text-xl sm:text-2xl '>{totalEpisodesWatched}</span>
            <h3 className='text-xl sm:text-2xl font-semibold text-center'>
              Total episodes (including unwatched)
            </h3>
            <span className='text-xl sm:text-2xl'>{totalEpisodes}</span>
          </section>

          <section className='flex flex-col col-span-2 md:col-span-1 items-center justify-center p-4 w-[20rem] bg-primary-foreground shadow-md shadow-black rounded-lg'>
            <h3 className='mb-4 text-xl sm:text-2xl font-semibold'>Total time watched</h3>
            <span className='mb-1 text-lg sm:text-xl'>
              {Math.floor(totalTimeWatched / 60 / 60 / 24)} days
            </span>
            <span className='mb-1 text-lg sm:text-xl'>
              {Math.floor((totalTimeWatched / 60 / 60) % 24)} hours
            </span>
            <span className='mb-1 text-lg sm:text-xl'>
              {Math.floor((totalTimeWatched / 60) % 60)} minutes
            </span>
            <span className='mb-1 text-lg sm:text-xl'>
              {Math.floor(totalTimeWatched % 60)} seconds
            </span>
          </section>

          <section className='col-span-2 flex flex-col items-center gap-3 p-6 max-w-full bg-primary-foreground shadow-md shadow-black rounded-lg'>
            <h3 className='col-span-2 mb-1 text-xl sm:text-2xl font-semibold text-center'>
              Top Genres by Count
            </h3>
            <div className='flex flex-col col-span-2 lg:col-span-1 items-center px-2 h-[20rem] w-[26rem] max-w-full bg-secondary-foreground rounded-md overflow-x-hidden overflow-y-auto'>
              <div className='sticky top-0 flex items-center justify-center w-full border-b bg-secondary-foreground'>
                <div className='grow p-4 text-sm sm:text-base font-semibold'>Genre Title</div>
                <div className='relative p-4 w-[24%] text-sm sm:text-base text-center font-semibold'>
                  Count
                </div>
              </div>
              {genreFreq.map((item) => (
                <Link
                  key={item.id}
                  href={`/completed/genres/${item.id}`}
                  className='flex w-full rounded-md transition-colors duration-75 hover:bg-secondary-accent'
                >
                  <span className='grow px-4 py-2 text-sm sm:text-base'>{item.name}</span>
                  <span className='w-[24%] px-4 py-2 text-sm sm:text-base text-center'>
                    {item.count}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className='grid grid-cols-2 gap-3 place-items-center my-6 p-4 w-[55rem] max-w-full bg-primary-foreground shadow-md shadow-black rounded-lg'>
          <h3 className='col-span-2 mb-1 text-xl sm:text-2xl font-semibold text-center'>
            Top Genres by Rating
          </h3>
          <GenreRatingTable
            genreByRating={genreByRating1}
            ratingNum='rating1'
            reorderFunc={setRating1ByGenre}
            sortMethodRatingRef={sortMethodRating1Ref}
          />
          <GenreRatingTable
            genreByRating={genreByRating2}
            ratingNum='rating2'
            reorderFunc={setRating2ByGenre}
            sortMethodRatingRef={sortMethodRating2Ref}
          />
        </section>

        <section className='grid grid-cols-2 gap-3 place-items-center my-6 p-4 w-[55rem] max-w-full bg-primary-foreground shadow-md shadow-black rounded-lg'>
          <h3 className='col-span-2 mb-2 text-xl sm:text-2xl font-semibold text-center'>
            Top Animes by Difference
          </h3>
          <DifferenceRatingTable
            tableName='Rating 1 − MAL'
            titleByRatingDiff={titleByRating1MalDiff}
            ratingDiff='rating1MalDiff'
            setTitleByDiff={setTitleByRating1MalDiff}
            sortMethodDiff={sortMethodRating1MalDiff}
          />
          <DifferenceRatingTable
            tableName='Rating 2 − MAL'
            titleByRatingDiff={titleByRating2MalDiff}
            ratingDiff='rating2MalDiff'
            setTitleByDiff={setTitleByRating2MalDiff}
            sortMethodDiff={sortMethodRating2MalDiff}
          />
          <DifferenceRatingTable
            tableName='Rating 1 − Rating 2'
            titleByRatingDiff={titleByRating1Rating2Diff}
            ratingDiff='rating1rating2Diff'
            setTitleByDiff={setTitleByRating1Rating2Diff}
            sortMethodDiff={sortMethodRating1Rating2Diff}
          />
        </section>

        <section className='flex flex-col items-center justify-center gap-3 h-[30rem] w-[30rem] max-w-full col-span-2 p-4 mb-6 bg-primary-foreground shadow-md shadow-black	 rounded-lg'>
          <h3 className='mb-2 text-xl sm:text-2xl font-semibold'>Types</h3>
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
                      'rgba(255, 206, 86, 1)',
                    ],
                    borderColor: [
                      'rgba(255, 99, 132, 1)',
                      'rgba(54, 162, 235, 1)',
                      'rgba(255, 206, 86, 1)',
                    ],
                    borderWidth: 1,
                  },
                ],
              }}
              className='mx-auto'
            />
          </div>
        </section>

        <section className='flex flex-col items-center justify-center gap-2 p-4 w-[56rem] max-w-full bg-primary-foreground shadow-md shadow-black rounded-lg rounded-b-none'>
          <h3 className='text-xl sm:text-2xl font-semibold'>Ratings</h3>
          <h4 className='mt-2 text-lg sm:text-xl font-semibold'>Central Tendency</h4>
          <div className='flex flex-col md:flex-row gap-2'>
            <div className='p-2 bg-secondary-foreground rounded-md'>
              <table>
                <thead>
                  <tr className='border-b'>
                    <th className='pb-1 text-base' colSpan={3}>
                      Mean
                    </th>
                  </tr>
                  <tr className='border-b'>
                    {statTable.map((item) => (
                      <th className='p-2' key={item + 'a'}>
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className='text-center'>{ratingStatTable.rating1Mean.toFixed(2)}</td>
                    <td className='text-center'>{ratingStatTable.rating2Mean.toFixed(2)}</td>
                    <td className='text-center'>{ratingStatTable.ratingMalMean.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className='p-2 bg-secondary-foreground rounded-md'>
              <table>
                <thead>
                  <tr className='border-b'>
                    <th className='pb-1 text-base' colSpan={3}>
                      Median
                    </th>
                  </tr>
                  <tr className='border-b'>
                    {statTable.map((item) => (
                      <th className='p-2' key={item + 'b'}>
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className='text-center'>{ratingStatTable.rating1Median.toFixed(2)}</td>
                    <td className='text-center'>{ratingStatTable.rating2Median.toFixed(2)}</td>
                    <td className='text-center'>{ratingStatTable.ratingMalMedian.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <h4 className='mt-2 text-lg sm:text-xl font-semibold'>Dispersion</h4>
          <div className='flex flex-col md:flex-row gap-2'>
            <div className='p-2 bg-secondary-foreground rounded-md'>
              <table>
                <thead>
                  <tr className='border-b'>
                    <th className='pb-1 text-base' colSpan={3}>
                      Standard Deviation
                    </th>
                  </tr>
                  <tr className='border-b'>
                    {statTable.map((item) => (
                      <th className='p-2' key={item + 'a'}>
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className='pt-1 text-center'>{ratingStatTable.rating1SD.toFixed(4)}</td>
                    <td className='pt-1 text-center'>{ratingStatTable.rating2SD.toFixed(4)}</td>
                    <td className='pt-1 text-center'>{ratingStatTable.ratingMalSD.toFixed(4)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className='p-2 bg-secondary-foreground rounded-md'>
              <table>
                <thead>
                  <tr className='border-b'>
                    <th className='pb-1 text-base' colSpan={3}>
                      Median Absolute Deviation
                    </th>
                  </tr>
                  <tr className='border-b'>
                    {statTable.map((item) => (
                      <th className='p-2' key={item + 'b'}>
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className='pt-1 text-center'>{ratingStatTable.rating1MAD.toFixed(4)}</td>
                    <td className='pt-1 text-center'>{ratingStatTable.rating2MAD.toFixed(4)}</td>
                    <td className='pt-1 text-center'>{ratingStatTable.ratingMalMAD.toFixed(4)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className='p-2 bg-secondary-foreground rounded-md'>
              <table>
                <thead>
                  <tr className='border-b'>
                    <th className='pb-1 text-base' colSpan={3}>
                      Variance
                    </th>
                  </tr>
                  <tr className='border-b'>
                    {statTable.map((item) => (
                      <th className='p-2' key={item + 'b'}>
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className='pt-1 text-center'>
                      {ratingStatTable.rating1Variance.toFixed(4)}
                    </td>
                    <td className='pt-1 text-center'>
                      {ratingStatTable.rating2Variance.toFixed(4)}
                    </td>
                    <td className='pt-1 text-center'>
                      {ratingStatTable.ratingMalVariance.toFixed(4)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <h4 className='mt-2 text-lg sm:text-xl font-semibold'>Similarity</h4>
          <div className='flex flex-col gap-2'>
            <div className='p-2 bg-secondary-foreground rounded-md'>
              <table>
                <thead>
                  <tr className='border-b'>
                    <th className='pb-1 text-base' colSpan={3}>
                      Correlation
                    </th>
                  </tr>
                  <tr className='border-b'>
                    <th className='p-2'>Rating 1 & MAL Rating</th>
                    <th className='p-2'>Rating 2 & MAL Rating</th>
                    <th className='p-2'>Rating 1 & Rating 2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className='pt-1 text-center'>
                      {ratingStatTable.rating1MalCorrelation.toFixed(4)}
                    </td>
                    <td className='pt-1 text-center'>
                      {ratingStatTable.rating2MalCorrelation.toFixed(4)}
                    </td>
                    <td className='pt-1 text-center'>
                      {ratingStatTable.rating1rating2Correlation.toFixed(4)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className='p-2 bg-secondary-foreground rounded-md'>
              <table>
                <thead>
                  <tr className='border-b'>
                    <th className='pb-1 text-base' colSpan={3}>
                      Covariance
                    </th>
                  </tr>
                  <tr className='border-b'>
                    <th className='p-2'>Rating 1 & MAL Rating</th>
                    <th className='p-2'>Rating 2 & MAL Rating</th>
                    <th className='p-2'>Rating 1 & Rating 2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className='pt-1 text-center'>
                      {ratingStatTable.rating1MalCovariance.toFixed(4)}
                    </td>
                    <td className='pt-1 text-center'>
                      {ratingStatTable.rating2MalCovariance.toFixed(4)}
                    </td>
                    <td className='pt-1 text-center'>
                      {ratingStatTable.rating1rating2Covariance.toFixed(4)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className='relative h-[20rem] w-[40rem] max-w-full'>
            <Line
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                    labels: {
                      color: '#000000',
                      font: {
                        size: 13,
                      },
                    },
                  },
                  title: {
                    display: true,
                    text: 'Rating Distribution (Rating vs Count)',
                    color: '#000000',
                    font: {
                      size: 15,
                    },
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Rating',
                      color: '#000000',
                    },
                    ticks: {
                      color: '#000000',
                    },
                    type: 'linear',
                    min: 0,
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Count',
                      color: '#000000',
                    },
                    ticks: {
                      color: '#000000',
                    },
                  },
                },
              }}
              data={{
                labels: rating1FreqArr.map((item) => ({
                  x: Object.keys(item)[0].toString(),
                  y: Object.values(item)[0],
                })),
                datasets: [
                  {
                    label: 'Rating 1',
                    data: rating1FreqArr.map((item) => ({
                      x: Object.keys(item)[0],
                      y: Object.values(item)[0],
                    })),
                    borderColor: '#ff4d73',
                    backgroundColor: '#ff4d73',
                    tension: 0.2,
                  },
                  {
                    label: 'Rating 2',
                    data: rating2FreqArr.map((item) => ({
                      x: Object.keys(item)[0],
                      y: Object.values(item)[0],
                    })),
                    borderColor: '#4da0ff',
                    backgroundColor: '#4da0ff',
                    tension: 0.2,
                  },
                  {
                    label: 'MyAnimeList',
                    data: ratingMalFreqArr.map((item) => ({
                      x: Object.keys(item)[0],
                      y: Object.values(item)[0],
                    })),
                    borderColor: '#ffe74d',
                    backgroundColor: '#ffe74d',
                    tension: 0.2,
                  },
                ],
              }}
              className='bg-gray-300 rounded-lg'
            />
          </div>
        </section>

        <section className='flex flex-col items-center justify-center gap-4 p-4 w-[56rem] max-w-full bg-primary-foreground shadow-md shadow-black'>
          <div className='relative h-[27rem] w-[47rem] max-w-full'>
            <RatingBroadcastScatter dateRatingData={dateRatingData} />
          </div>
        </section>

        <section className='flex flex-col items-center justify-center gap-4 p-4 w-[56rem] max-w-full bg-primary-foreground shadow-md shadow-black rounded-lg rounded-t-none'>
          <div className='relative h-[27rem] w-[47rem] max-w-full'>
            <RatingEndScatter dateRatingData={dateRatingData} />
          </div>
        </section>
      </main>
    </>
  )
}

function GenreRatingTable({
  genreByRating,
  ratingNum,
  reorderFunc,
  sortMethodRatingRef,
}: {
  genreByRating: GenreByRatingData[]
  ratingNum: 'rating1' | 'rating2'
  reorderFunc: Dispatch<SetStateAction<GenreByRatingData[]>>
  sortMethodRatingRef: MutableRefObject<string>
}) {
  function handleSort(
    toReorderArr: GenreByRatingData[],
    toReorder: 'rating1' | 'rating2',
    setReorderFunc: Dispatch<SetStateAction<GenreByRatingData[]>>,
    sortMethodRef: MutableRefObject<string>,
    field: 'mean' | 'median'
  ) {
    if (field == 'mean') {
      if (sortMethodRef.current == `${toReorder}_mean_desc`) {
        const reordered = toReorderArr
          .slice()
          .sort((a, b) => a[`${toReorder}mean`] - b[`${toReorder}mean`])
        sortMethodRef.current = `${toReorder}_mean_asc`
        setReorderFunc(reordered)
      } else {
        const reordered = toReorderArr
          .slice()
          .sort((a, b) => b[`${toReorder}mean`] - a[`${toReorder}mean`])
        sortMethodRef.current = `${toReorder}_mean_desc`
        setReorderFunc(reordered)
      }
    } else {
      if (sortMethodRef.current == `${toReorder}_median_desc`) {
        const reordered = toReorderArr
          .slice()
          .sort((a, b) => a[`${toReorder}median`]! - b[`${toReorder}median`]!)
        sortMethodRef.current = `${toReorder}_median_asc`
        setReorderFunc(reordered)
      } else {
        const reordered = toReorderArr
          .slice()
          .sort((a, b) => b[`${toReorder}median`]! - a[`${toReorder}median`]!)
        sortMethodRef.current = `${toReorder}_median_desc`
        setReorderFunc(reordered)
      }
    }
  }

  return (
    <div className='flex flex-col col-span-2 lg:col-span-1 items-center px-2 h-[24rem] w-[97%] bg-secondary-foreground rounded-md overflow-x-hidden overflow-y-auto'>
      <div className='w-full p-3'>
        <h3 className='mb-1 text-lg sm:text-xl font-semibold text-center'>
          {ratingNum == 'rating1' ? 'Rating 1' : 'Rating 2'}
        </h3>
      </div>
      <div className='sticky top-0 flex items-center justify-center px-2 w-full border-b bg-secondary-foreground'>
        <div className='w-2/4 px-2 py-4 text-sm sm:text-base font-semibold'>Genre Title</div>
        <div
          tabIndex={0}
          onClick={() =>
            handleSort(genreByRating, ratingNum, reorderFunc, sortMethodRatingRef, 'mean')
          }
          className='p-4 w-1/4 text-sm sm:text-base text-center font-semibold cursor-pointer'
        >
          <span className='relative'>
            Mean
            {sortMethodRatingRef.current.includes(`${ratingNum}_mean`) && (
              <span className='absolute top-1/2 -right-5 -translate-y-1/2 text-xs'>
                {sortMethodRatingRef.current.includes('asc') ? (
                  <ArrowDropDownIcon style={{ rotate: '180deg' }} />
                ) : (
                  <ArrowDropDownIcon />
                )}
              </span>
            )}
          </span>
        </div>
        <div
          tabIndex={0}
          onClick={() =>
            handleSort(genreByRating, ratingNum, reorderFunc, sortMethodRatingRef, 'median')
          }
          className='p-4 w-1/4 text-sm sm:text-base text-center font-semibold cursor-pointer'
        >
          <span className='relative'>
            Median
            {sortMethodRatingRef.current.includes(`${ratingNum}_median`) && (
              <span className='absolute top-1/2 -right-5 -translate-y-1/2 text-xs'>
                {sortMethodRatingRef.current.includes('asc') ? (
                  <ArrowDropDownIcon style={{ rotate: '180deg' }} />
                ) : (
                  <ArrowDropDownIcon />
                )}
              </span>
            )}
          </span>
        </div>
      </div>
      {genreByRating.map((item) => (
        <Link
          key={item.id}
          href={`/completed/genres/${item.id}`}
          className='flex items-center justify-between w-full p-2 rounded-md transition-colors duration-75 hover:bg-secondary-accent'
        >
          <span className='w-2/4 px-2 text-sm sm:text-base'>{item.name}</span>
          <span className='w-1/4 px-2 text-sm sm:text-base text-center'>
            {item[`${ratingNum}mean`].toFixed(2)}
          </span>
          <span className='w-1/4 px-2 text-sm sm:text-base text-center'>
            {item[`${ratingNum}median`]}
          </span>
        </Link>
      ))}
    </div>
  )
}

function DifferenceRatingTable({
  tableName,
  titleByRatingDiff,
  ratingDiff,
  setTitleByDiff,
  sortMethodDiff,
}: {
  tableName: 'Rating 1 − MAL' | 'Rating 2 − MAL' | 'Rating 1 − Rating 2'
  titleByRatingDiff: DifferenceRatingData[]
  ratingDiff: 'rating1MalDiff' | 'rating2MalDiff' | 'rating1rating2Diff'
  setTitleByDiff: Dispatch<SetStateAction<DifferenceRatingData[]>>
  sortMethodDiff: MutableRefObject<string>
}) {
  function handleSortTitlesByDiff(
    toReorderArr: DifferenceRatingData[],
    toReorder: 'rating1MalDiff' | 'rating2MalDiff' | 'rating1rating2Diff',
    setReorderFunc: Dispatch<SetStateAction<DifferenceRatingData[]>>,
    sortMethodRef: MutableRefObject<string>
  ) {
    if (sortMethodRef.current == `${toReorder}_diff_asc`) {
      const reordered = toReorderArr.slice().sort((a, b) => b[toReorder] - a[toReorder])
      sortMethodRef.current = `${toReorder}_diff_desc`
      setReorderFunc(reordered)
    } else {
      const reordered = toReorderArr.slice().sort((a, b) => a[toReorder] - b[toReorder])
      sortMethodRef.current = `${toReorder}_diff_asc`
      setReorderFunc(reordered)
    }
  }

  return (
    <div
      className={`flex flex-col col-span-2 ${
        ratingDiff != 'rating1rating2Diff' ? 'lg:col-span-1' : 'md:w-[33rem]'
      } items-center px-2 h-[24rem] w-[97%] bg-zinc-800 rounded-md overflow-x-hidden overflow-y-auto`}
    >
      <div className='sticky top-0 p-3 z-10'>
        <h3 className='mb-1 text-lg sm:text-xl font-semibold text-center'>{tableName}</h3>
      </div>
      <div className='sticky top-0 flex items-center justify-center px-2 w-full border-b bg-secondary-foreground'>
        <div className='w-3/4 px-2 py-4 text-sm sm:text-base font-semibold'>Title</div>
        <div
          tabIndex={0}
          onClick={() =>
            handleSortTitlesByDiff(titleByRatingDiff, ratingDiff, setTitleByDiff, sortMethodDiff)
          }
          className='px-2 py-4 w-1/4 text-sm sm:text-base text-center font-semibold cursor-pointer'
        >
          <span className='relative'>
            Diff.
            {sortMethodDiff.current.includes('diff') && (
              <span className='absolute top-1/2 -right-5 -translate-y-1/2 text-xs'>
                {sortMethodDiff.current.includes('asc') ? (
                  <ArrowDropDownIcon style={{ rotate: '180deg' }} />
                ) : (
                  <ArrowDropDownIcon />
                )}
              </span>
            )}
          </span>
        </div>
      </div>
      {titleByRatingDiff.map((item) => (
        <Link
          key={item.id}
          href={`/completed/anime/${item.id}`}
          className='flex items-center justify-between w-full px-2 rounded-md transition-colors duration-75 hover:bg-secondary-accent'
        >
          <span className='w-3/4 p-2 text-sm sm:text-base'>{item.title}</span>
          <span className='w-1/4 p-2 text-sm sm:text-base text-center'>
            {item[ratingDiff].toFixed(2)}
          </span>
        </Link>
      ))}
    </div>
  )
}
