import { Scatter } from 'react-chartjs-2'
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	TimeScale
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import zoomPlugin from 'chartjs-plugin-zoom'
import { linearRegression, linearRegressionLine } from 'simple-statistics'

export default function ScatterChart({
	dateRatingData
}: {
	dateRatingData: {
		id: number
		title: string
		rating1average: number | null
		rating2average: number | null
		malRating: number | null
		broadcastDate: string | null
		endWatchDate: number | null
	}[]
}) {
	ChartJS.register(
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		Title,
		Tooltip,
		Legend,
		TimeScale,
		zoomPlugin
	)

	const dateRatingDataSorted = dateRatingData
		.slice()
		.sort((a, b) => new Date(a.broadcastDate!).getTime() - new Date(b.broadcastDate!).getTime())

	const lineRegFuncRating1 = linearRegressionLine(
		linearRegression(
			dateRatingData
				.map((item) => {
					return [new Date(item.broadcastDate!).getTime(), item.rating1average!]
				})
				.filter((item) => item[0])
		)
	)
	const lineRegFuncRating2 = linearRegressionLine(
		linearRegression(
			dateRatingData
				.map((item) => {
					return [new Date(item.broadcastDate!).getTime(), item.rating2average!]
				})
				.filter((item) => item[0])
		)
	)
	const lineRegFuncRatingMal = linearRegressionLine(
		linearRegression(
			dateRatingData
				.map((item) => {
					return [new Date(item.broadcastDate!).getTime(), item.malRating!]
				})
				.filter((item) => item[0])
		)
	)

	return (
		<Scatter
			options={{
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: 'Rating vs Broadcast Year',
						color: '#000000',
						font: {
							size: 15
						}
					},
					tooltip: {
						callbacks: {
							label: (tooltipItem) => {
								if (tooltipItem.dataset.label?.includes('Regression')) {
									return [
										'Date: ' +
											new Date(tooltipItem.parsed.x).toLocaleDateString('en-US', {
												day: 'numeric',
												month: 'long',
												year: 'numeric'
											}),
										'Rating: ' + tooltipItem.parsed.y
									]
								}
								return [
									tooltipItem.dataset.label ?? '',
									'Title: ' + dateRatingDataSorted[tooltipItem.dataIndex].title,
									'Date: ' +
										new Date(tooltipItem.parsed.x).toLocaleDateString('en-US', {
											day: 'numeric',
											month: 'long',
											year: 'numeric'
										}),
									'Rating: ' + tooltipItem.parsed.y
								]
							}
						}
					},
					zoom: {
						zoom: {
							wheel: {
								enabled: true
							},
							pinch: {
								enabled: true
							},
							mode: 'xy'
						},
						pan: {
							enabled: true
						},
						limits: {
							x: { min: 400_000_000_000, max: 1_900_000_000_000 },
							y: { min: -10, max: 20 },
							y2: { min: -5, max: 5 }
						}
					}
				},
				scales: {
					x: {
						title: {
							display: true,
							text: 'Broadcast Year',
							color: '#000000'
						},
						ticks: {
							color: '#000000'
						},
						type: 'time',
						min: 1_000_000_000_000
					},
					y: {
						title: {
							display: true,
							text: 'Rating',
							color: '#000000'
						},
						ticks: {
							color: '#000000'
						},
						min: 0
					}
				}
			}}
			data={{
				datasets: [
					{
						label: 'GoodTaste',
						data: dateRatingDataSorted.map((item) => {
							const startDate = new Date(item.broadcastDate!).getTime()
							return {
								x: startDate,
								y: item.rating1average
							}
						}),
						backgroundColor: '#ff4d73'
					},
					{
						label: 'Regression Line (GoodTaste)',
						data: Array(14)
							.fill('')
							.map((i, index) => {
								const increment = 100_000_000_000 * index
								return {
									x: increment + 500_000_000_000,
									y: lineRegFuncRating1(increment + 500_000_000_000)
								}
							}),
						showLine: true,
						borderColor: '#8a293e',
						pointBorderWidth: 0,
						pointBackgroundColor: 'rgba(0,0,0,0.2)'
					},
					{
						label: 'TomoLover',
						data: dateRatingDataSorted.map((item) => {
							const startDate = new Date(item.broadcastDate!).getTime()
							return {
								x: startDate,
								y: item.rating2average
							}
						}),
						backgroundColor: '#4da0ff'
					},
					{
						label: 'Regression Line (TomoLover)',
						data: Array(14)
							.fill('')
							.map((i, index) => {
								const increment = 100_000_000_000 * index
								return {
									x: increment + 500_000_000_000,
									y: lineRegFuncRating2(increment + 500_000_000_000)
								}
							}),
						showLine: true,
						borderColor: '#28568a',
						pointBorderWidth: 0,
						pointBackgroundColor: 'rgba(0,0,0,0.2)'
					},
					{
						label: 'MyAnimeList',
						data: dateRatingDataSorted.map((item) => {
							const startDate = new Date(item.broadcastDate!).getTime()
							return {
								x: startDate,
								y: item.malRating
							}
						}),
						backgroundColor: '#ffe74d'
					},
					{
						label: 'Regression Line (MyAnimeList)',
						data: Array(14)
							.fill('')
							.map((i, index) => {
								const increment = 100_000_000_000 * index
								return {
									x: increment + 500_000_000_000,
									y: lineRegFuncRatingMal(increment + 500_000_000_000)
								}
							}),
						showLine: true,
						borderColor: '#f0d732',
						pointBorderWidth: 0,
						pointBackgroundColor: 'rgba(0,0,0,0.2)'
					}
				]
			}}
			className="bg-gray-300 rounded-lg"
		/>
	)
}
