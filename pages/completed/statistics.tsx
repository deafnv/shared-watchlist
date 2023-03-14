import { GetStaticPropsContext } from 'next'
import Head from 'next/head'
import { Dispatch, MutableRefObject, SetStateAction, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
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
	TimeScale
} from 'chart.js'
import Link from 'next/link'
import {
	mean,
	median,
	standardDeviation,
	variance,
	medianAbsoluteDeviation,
	sampleCorrelation,
	sampleCovariance
} from 'simple-statistics'
import 'chartjs-adapter-date-fns'
import dynamic from 'next/dynamic'
interface StatTable {
	rating1Mean: number
	rating2Mean: number
	ratingMalMean: number
	rating1Median: number
	rating2Median: number
	ratingMalMedian: number
	rating1SD: number
	rating2SD: number
	ratingMalSD: number
	rating1Variance: number
	rating2Variance: number
	ratingMalVariance: number
	rating1MAD: number
	rating2MAD: number
	ratingMalMAD: number
	rating1MalCorrelation: number
	rating2MalCorrelation: number
	rating1rating2Correlation: number
	rating1MalCovariance: number
	rating2MalCovariance: number
	rating1rating2Covariance: number
}

interface StatisticsProps {
	titleCount: number
	totalEpisodes: number
	totalEpisodesWatched: number
	totalTimeWatched: number
	typeFreq: { [key: string]: number }
	genreFreq: { id: number; name: string | null; count: number }[]
	ratingByGenre: {
		id: number
		name: string
		rating1mean: number
		rating2mean: number
		rating1median: number | null
		rating2median: number | null
		titlecount: number
	}[]
	rating1FreqArr: Array<{ [key: number]: number }>
	rating2FreqArr: Array<{ [key: number]: number }>
	ratingMalFreqArr: Array<{ [key: number]: number }>
	dateRatingData: {
		id: number
		title: string
		rating1average: number | null
		rating2average: number | null
		malRating: number | null
		broadcastDate: string | null
		endWatchDate: number | null
	}[]
	ratingStatTable: StatTable
}

export const getStaticProps = async (context: GetStaticPropsContext) => {
	const supabase = createClient<Database>(
		'https://esjopxdrlewtpffznsxh.supabase.co',
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	)
	const { data } = await supabase
		.from('Completed')
		.select('*, CompletedDetails!inner( * )')
		.order('id', { ascending: true })

	let totalEpisodes = data?.reduce((acc: any, current: any) => {
		return acc + current.episode_total!
	}, 0)
	let totalEpisodesWatched = data?.reduce((acc: any, current: any) => {
		return acc + current.episode_actual!
	}, 0)
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
		const malRating = (
			item.CompletedDetails as Database['public']['Tables']['CompletedDetails']['Row']
		).mal_rating!
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
	const rating1Mean = mean(rating1AggregateArr as number[])
	const rating2Mean = mean(rating2AggregateArr as number[])
	const ratingMalAggregateArr = data?.map(
		(item) =>
			(item.CompletedDetails as Database['public']['Tables']['CompletedDetails']['Row']).mal_rating
	)
	const ratingMalMean = mean(ratingMalAggregateArr as number[])

	const rating1Median = median(rating1AggregateArr as number[])
	const rating2Median = median(rating2AggregateArr as number[])
	const ratingMalMedian = median(ratingMalAggregateArr as number[])

	const rating1SD = standardDeviation(rating1AggregateArr as number[])
	const rating2SD = standardDeviation(rating2AggregateArr as number[])
	const ratingMalSD = standardDeviation(ratingMalAggregateArr as number[])

	const dataGenre = await supabase.from('Genres').select('*, Genre_to_Titles!inner (id)')

	const genreFreq = dataGenre.data?.map((item) => ({
		id: item.id,
		name: item.name,
		count: (item.Genre_to_Titles as Database['public']['Tables']['Genre_to_Titles']['Row'][]).length
	}))
	genreFreq?.sort((a, b) => b.count - a.count)

	const dataGenreRating = await supabase
		.from('Genre_to_Titles')
		.select('*, Completed!inner (rating1average, rating2average), Genres!inner (*)')

	const ratingByGenreAgg: {
		id: number
		name: string
		rating1agg: number[]
		rating2agg: number[]
		titlecount: number
	}[] = []
	dataGenreRating.data?.forEach((relationship) => {
		const indexOfGenre = ratingByGenreAgg.findIndex((item) => item.id == relationship.genre_id)
		if (ratingByGenreAgg[indexOfGenre]) {
			ratingByGenreAgg[indexOfGenre].rating1agg.push(
				(relationship.Completed as { rating1average: number | null; rating2average: number | null })
					.rating1average!
			)
			ratingByGenreAgg[indexOfGenre].rating2agg.push(
				(relationship.Completed as { rating1average: number | null; rating2average: number | null })
					.rating2average!
			)
			ratingByGenreAgg[indexOfGenre].titlecount++
		} else {
			ratingByGenreAgg.push({
				id: relationship.genre_id,
				name: (relationship.Genres as Database['public']['Tables']['Genres']['Row']).name!,
				rating1agg: [
					(
						relationship.Completed as {
							rating1average: number | null
							rating2average: number | null
						}
					).rating1average!
				],
				rating2agg: [
					(
						relationship.Completed as {
							rating1average: number | null
							rating2average: number | null
						}
					).rating2average!
				],
				titlecount: 1
			})
		}
	})
	const ratingByGenre = ratingByGenreAgg
		.map((item) => {
			return {
				id: item.id,
				name: item.name,
				rating1mean: mean(item.rating1agg),
				rating2mean: mean(item.rating2agg),
				rating1median: median(item.rating1agg),
				rating2median: median(item.rating2agg),
				titlecount: item.titlecount
			}
		})
		.sort((a, b) => b.titlecount - a.titlecount)

	const dateRatingData = data
		?.map((item) => {
			return {
				id: item.id,
				title: item.title,
				rating1average: item.rating1average,
				rating2average: item.rating2average,
				malRating: (
					item.CompletedDetails as Database['public']['Tables']['CompletedDetails']['Row']
				).mal_rating,
				broadcastDate: (
					item.CompletedDetails as Database['public']['Tables']['CompletedDetails']['Row']
				).start_date,
				endWatchDate: item.endconv
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
			ratingByGenre,
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
				)
			}
		}
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
	ratingByGenre,
	rating1FreqArr,
	rating2FreqArr,
	ratingMalFreqArr,
	dateRatingData,
	ratingStatTable
}: StatisticsProps) {
	const sortMethodRating1Ref = useRef('')
	const sortMethodRating2Ref = useRef('')

	const [rating1ByGenre, setRating1ByGenre] = useState(ratingByGenre)
	const [rating2ByGenre, setRating2ByGenre] = useState(ratingByGenre)

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
						size: 15
					}
				}
			}
		}
	}

	const RatingBroadcastScatter = dynamic(() => import('@/components/RatingBroadcastScatter'), {
		ssr: false
	})
	const RatingEndScatter = dynamic(() => import('@/components/RatingEndScatter'), {
		ssr: false
	})

	const statTable = ['GoodTaste', 'TomoLover', 'MAL Rating']
	return (
		<>
			<Head>
				<title>Cytube Watchlist</title>
				<meta name="description" content="Watchlist statistics" />
			</Head>

			<main className="flex flex-col items-center justify-center mb-24 px-6 py-2">
				<h2 className="p-2 text-2xl sm:text-3xl">Statistics</h2>
				<div className="grid grid-cols-2 gap-4 place-items-center">
					<section className="flex flex-col col-span-2 md:col-span-1 items-center justify-center px-6 py-4 w-[25rem] border-[1px] border-white">
						<h3 className="text-2xl font-semibold text-center">Title count</h3>
						<span className="mb-2 text-2xl">{titleCount}</span>
						<h3 className="text-2xl font-semibold text-center">Total episodes watched</h3>
						<span className="mb-2 text-2xl ">{totalEpisodesWatched}</span>
						<h3 className="text-2xl font-semibold text-center">
							Total episodes (including unwatched)
						</h3>
						<span className="text-2xl">{totalEpisodes}</span>
					</section>
					<section className="flex flex-col col-span-2 md:col-span-1 items-center justify-center p-4 w-[20rem] border-[1px] border-white">
						<h3 className="mb-4 text-2xl font-semibold">Total time watched</h3>
						<span className="mb-1 text-xl">{Math.floor(totalTimeWatched / 60 / 60 / 24)} days</span>
						<span className="mb-1 text-xl">
							{Math.floor((totalTimeWatched / 60 / 60) % 24)} hours
						</span>
						<span className="mb-1 text-xl">{Math.floor((totalTimeWatched / 60) % 60)} minutes</span>
						<span className="mb-1 text-xl">{Math.floor(totalTimeWatched % 60)} seconds</span>
					</section>
					<section className="col-span-2 flex flex-col items-center h-[20rem] w-[20rem] border-[1px] border-white overflow-auto">
						<div className="sticky top-0 h-16 w-full p-3 bg-black">
							<h3 className="text-2xl font-semibold text-center">Top Genres by count</h3>
						</div>
						{genreFreq.map((item, index) => (
							<div
								key={index}
								className="flex justify-between w-full p-2 border-[1px] border-white"
							>
								<Link
									href={`/completed/genres/${item.id}`}
									target="_blank"
									className="p-2 text-lg font-semibold link"
								>
									{item.name}
								</Link>
								<span className="p-2 text-lg">{item.count}</span>
							</div>
						))}
					</section>
				</div>
				<section className="flex flex-col md:flex-row gap-3 my-6">
					<div className="flex flex-col items-center h-[20rem] w-[30rem] border-[1px] border-white overflow-auto">
						<div className="sticky top-0 h-16 w-full p-3 bg-black z-10">
							<h3 className="mb-1 text-2xl font-semibold text-center">
								Top Genres by Rating (GoodTaste)
							</h3>
						</div>
						<div className="flex items-center justify-center w-full bg-sky-600 border-white border-solid border-[1px] border-b-0">
							<div className="grow p-3 text-lg text-center font-semibold">Title</div>
							<div
								tabIndex={0}
								onClick={() =>
									handleSort(
										rating1ByGenre,
										'rating1',
										setRating1ByGenre,
										sortMethodRating1Ref,
										'mean'
									)
								}
								className="relative p-3 w-24 text-lg text-center font-semibold cursor-pointer border-l-[1px] border-white"
							>
								Mean
								{sortMethodRating1Ref.current.includes('rating1_mean') && (
									<span className="absolute">
										{sortMethodRating1Ref.current.includes('asc') ? '▲' : '▼'}
									</span>
								)}
							</div>
							<div
								tabIndex={0}
								onClick={() =>
									handleSort(
										rating1ByGenre,
										'rating1',
										setRating1ByGenre,
										sortMethodRating1Ref,
										'median'
									)
								}
								className="relative p-3 w-24 text-lg text-center font-semibold cursor-pointer border-l-[1px] border-white"
							>
								Median
								{sortMethodRating1Ref.current.includes('rating1_median') && (
									<span className="absolute">
										{sortMethodRating1Ref.current.includes('asc') ? '▲' : '▼'}
									</span>
								)}
							</div>
						</div>
						{rating1ByGenre.map((item, index) => (
							<div
								key={index}
								style={{ borderBottomWidth: index >= ratingByGenre.length - 1 ? 1 : 0 }}
								className="flex justify-between w-full p-2 border-[1px] border-white"
							>
								<Link
									href={`/completed/genres/${item.id}`}
									target="_blank"
									className="grow px-3 py-2 text-lg font-semibold link"
								>
									{item.name}
								</Link>
								<span className="w-24 px-3 py-2 text-lg text-center">
									{item.rating1mean.toFixed(2)}
								</span>
								<span className="w-24 px-3 py-2 text-lg text-center">{item.rating1median}</span>
							</div>
						))}
					</div>
					<div className="flex flex-col items-center h-[20rem] w-[30rem] border-[1px] border-white overflow-auto">
						<div className="sticky top-0 h-16 w-full p-3 bg-black z-10">
							<h3 className="mb-1 text-2xl font-semibold text-center">
								Top Genres by Rating (TomoLover)
							</h3>
						</div>
						<div className="flex items-center justify-center w-full bg-sky-600 border-white border-solid border-[1px] border-b-0">
							<div className="grow p-3 text-lg text-center font-semibold">Title</div>
							<div
								tabIndex={0}
								onClick={() =>
									handleSort(
										rating2ByGenre,
										'rating2',
										setRating2ByGenre,
										sortMethodRating2Ref,
										'mean'
									)
								}
								className="relative p-3 w-24 text-lg text-center font-semibold cursor-pointer border-l-[1px] border-white"
							>
								Mean
								{sortMethodRating2Ref.current.includes('rating2_mean') && (
									<span className="absolute">
										{sortMethodRating2Ref.current.includes('asc') ? '▲' : '▼'}
									</span>
								)}
							</div>
							<div
								tabIndex={0}
								onClick={() =>
									handleSort(
										rating2ByGenre,
										'rating2',
										setRating2ByGenre,
										sortMethodRating2Ref,
										'median'
									)
								}
								className="relative p-3 w-24 text-lg text-center font-semibold cursor-pointer border-l-[1px] border-white"
							>
								Median
								{sortMethodRating2Ref.current.includes('rating2_median') && (
									<span className="absolute">
										{sortMethodRating2Ref.current.includes('asc') ? '▲' : '▼'}
									</span>
								)}
							</div>
						</div>
						{rating2ByGenre.map((item, index) => (
							<div
								key={index}
								style={{ borderBottomWidth: index >= ratingByGenre.length - 1 ? 1 : 0 }}
								className="flex justify-between w-full p-2 border-[1px] border-white"
							>
								<Link
									href={`/completed/genres/${item.id}`}
									target="_blank"
									className="grow px-3 py-2 text-lg font-semibold link"
								>
									{item.name}
								</Link>
								<span className="w-24 px-3 py-2 text-lg text-center">
									{item.rating2mean.toFixed(2)}
								</span>
								<span className="w-24 px-3 py-2 text-lg text-center">{item.rating2median}</span>
							</div>
						))}
					</div>
				</section>
				<section className="flex flex-col items-center justify-center h-[30rem] w-[30rem] col-span-2 p-4 mb-6 border-[1px] border-white">
					<h3 className="mb-2 text-2xl font-semibold">Types</h3>
					<div className="p-4 h-full w-full bg-gray-400 rounded-lg">
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
										borderWidth: 1
									}
								]
							}}
							className="mx-auto"
						/>
					</div>
				</section>
				<section className="flex flex-col items-center justify-center gap-4 p-4 w-[52rem] border-[1px] border-white">
					<h3 className="mb-1 text-2xl font-semibold">Ratings</h3>
					<h4 className="mt-2 text-xl font-semibold">Central Tendency</h4>
					<div className="flex flex-col md:flex-row">
						<table>
							<thead>
								<tr>
									<th colSpan={3}>Mean</th>
								</tr>
								<tr>
									{statTable.map((item) => (
										<th key={item + 'a'}>{item}</th>
									))}
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>{ratingStatTable.rating1Mean.toFixed(2)}</td>
									<td>{ratingStatTable.rating2Mean.toFixed(2)}</td>
									<td>{ratingStatTable.ratingMalMean.toFixed(2)}</td>
								</tr>
							</tbody>
						</table>
						<table>
							<thead>
								<tr>
									<th colSpan={3}>Median</th>
								</tr>
								<tr>
									{statTable.map((item) => (
										<th key={item + 'b'}>{item}</th>
									))}
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>{ratingStatTable.rating1Median.toFixed(2)}</td>
									<td>{ratingStatTable.rating2Median.toFixed(2)}</td>
									<td>{ratingStatTable.ratingMalMedian.toFixed(2)}</td>
								</tr>
							</tbody>
						</table>
					</div>
					<h4 className="mt-2 text-xl font-semibold">Dispersion</h4>
					<div className="flex flex-col md:flex-row">
						<table>
							<thead>
								<tr>
									<th colSpan={3}>Standard Deviation</th>
								</tr>
								<tr>
									{statTable.map((item) => (
										<th key={item + 'a'}>{item}</th>
									))}
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>{ratingStatTable.rating1SD.toFixed(4)}</td>
									<td>{ratingStatTable.rating2SD.toFixed(4)}</td>
									<td>{ratingStatTable.ratingMalSD.toFixed(4)}</td>
								</tr>
							</tbody>
						</table>
						<table>
							<thead>
								<tr>
									<th colSpan={3}>Median Absolute Deviation</th>
								</tr>
								<tr>
									{statTable.map((item) => (
										<th key={item + 'b'}>{item}</th>
									))}
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>{ratingStatTable.rating1MAD.toFixed(4)}</td>
									<td>{ratingStatTable.rating2MAD.toFixed(4)}</td>
									<td>{ratingStatTable.ratingMalMAD.toFixed(4)}</td>
								</tr>
							</tbody>
						</table>
						<table>
							<thead>
								<tr>
									<th colSpan={3}>Variance</th>
								</tr>
								<tr>
									{statTable.map((item) => (
										<th key={item + 'b'}>{item}</th>
									))}
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>{ratingStatTable.rating1Variance.toFixed(4)}</td>
									<td>{ratingStatTable.rating2Variance.toFixed(4)}</td>
									<td>{ratingStatTable.ratingMalVariance.toFixed(4)}</td>
								</tr>
							</tbody>
						</table>
					</div>
					<h4 className="mt-2 text-xl font-semibold">Similarity</h4>
					<div>
						<table>
							<thead>
								<tr>
									<th colSpan={3}>Correlation</th>
								</tr>
								<tr>
									<th>GoodTaste & MAL Rating</th>
									<th>TomoLover & MAL Rating</th>
									<th>GoodTaste & TomoLover</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>{ratingStatTable.rating1MalCorrelation.toFixed(4)}</td>
									<td>{ratingStatTable.rating2MalCorrelation.toFixed(4)}</td>
									<td>{ratingStatTable.rating1rating2Correlation.toFixed(4)}</td>
								</tr>
							</tbody>
						</table>
						<table>
							<thead>
								<tr>
									<th colSpan={3}>Covariance</th>
								</tr>
								<tr>
									<th>GoodTaste & MAL Rating</th>
									<th>TomoLover & MAL Rating</th>
									<th>GoodTaste & TomoLover</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>{ratingStatTable.rating1MalCovariance.toFixed(4)}</td>
									<td>{ratingStatTable.rating2MalCovariance.toFixed(4)}</td>
									<td>{ratingStatTable.rating1rating2Covariance.toFixed(4)}</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div className="relative h-[20rem] w-[40rem]">
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
												size: 13
											}
										}
									},
									title: {
										display: true,
										text: 'Rating Distribution (Rating vs Count)',
										color: '#000000',
										font: {
											size: 15
										}
									}
								},
								scales: {
									x: {
										title: {
											display: true,
											text: 'Rating',
											color: '#000000'
										},
										ticks: {
											color: '#000000'
										},
										type: 'linear',
										min: 0
									},
									y: {
										title: {
											display: true,
											text: 'Count',
											color: '#000000'
										},
										ticks: {
											color: '#000000'
										}
									}
								}
							}}
							data={{
								labels: rating1FreqArr.map((item) => ({
									x: Object.keys(item)[0].toString(),
									y: Object.values(item)[0]
								})),
								datasets: [
									{
										label: 'GoodTaste',
										data: rating1FreqArr.map((item) => ({
											x: Object.keys(item)[0],
											y: Object.values(item)[0]
										})),
										borderColor: '#ff4d73',
										backgroundColor: '#ff4d73',
										tension: 0.2
									},
									{
										label: 'TomoLover',
										data: rating2FreqArr.map((item) => ({
											x: Object.keys(item)[0],
											y: Object.values(item)[0]
										})),
										borderColor: '#4da0ff',
										backgroundColor: '#4da0ff',
										tension: 0.2
									},
									{
										label: 'MyAnimeList',
										data: ratingMalFreqArr.map((item) => ({
											x: Object.keys(item)[0],
											y: Object.values(item)[0]
										})),
										borderColor: '#ffe74d',
										backgroundColor: '#ffe74d',
										tension: 0.2
									}
								]
							}}
							className="bg-gray-300 rounded-lg"
						/>
					</div>
				</section>
				<section className="flex flex-col items-center justify-center gap-4 p-4 w-[52rem] border-[1px] border-white">
					<div className="relative h-[27rem] w-[47rem]">
						<RatingBroadcastScatter dateRatingData={dateRatingData} />
					</div>
				</section>
				<section className="flex flex-col items-center justify-center gap-4 p-4 w-[52rem] border-[1px] border-white">
					<div className="relative h-[27rem] w-[47rem]">
						<RatingEndScatter dateRatingData={dateRatingData} />
					</div>
				</section>
			</main>
		</>
	)

	function handleSort(
		toReorderArr: {
			id: number
			name: string
			rating1mean: number
			rating2mean: number
			rating1median: number | null
			rating2median: number | null
			titlecount: number
		}[],
		toReorder: 'rating1' | 'rating2',
		setReorderFunc: Dispatch<
			SetStateAction<
				{
					id: number
					name: string
					rating1mean: number
					rating2mean: number
					rating1median: number | null
					rating2median: number | null
					titlecount: number
				}[]
			>
		>,
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
}
