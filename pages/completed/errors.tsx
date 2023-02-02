import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState, BaseSyntheticEvent } from 'react'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import CloseIcon from '@mui/icons-material/Close'
import { levenshtein } from '../../lib/list_methods'
import { Database } from '../../lib/database.types'
import { useLoading } from '../../components/LoadingContext'
import { useRouter } from 'next/router'

export default function CompletedErrors() {
	const [isLoadingClient, setIsLoadingClient] = useState(true)
	const [response, setResponse] = useState<
		{
			id: number
			mal_id: number | null
			entryTitle: string | null
			retrievedTitle: string | null
			distance: number | undefined
		}[]
	>()
	const [changed, setChanged] = useState<{
		id: number
		mal_id: number | null
		entryTitle: string | null
		retrievedTitle: string | null
		distance: number | undefined
	} | null>(null)
	const { setLoading } = useLoading()
	const [width, setWidth] = useState<number>(0)

	const router = useRouter()

	useEffect(() => {
		const getData = async () => {
			const supabase = createClient<Database>(
				'https://esjopxdrlewtpffznsxh.supabase.co',
				process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
			)
			const { data } = await supabase
				.from('Completed')
				.select('*, CompletedDetails!inner( * )')
				.order('id', { ascending: true })

			const errorTrackData = await supabase
				.from('ErrorTrack')
				.select()
				.in('message', ['IGNORE', 'CHANGED'])

			const errorTrackIgnore = errorTrackData.data?.map((item) => item.title_id)
			console.log(errorTrackData.data)

			const levenDistance = data
				?.map((item) => {
					const distance = levenshtein(
						item.title!,
						(item.CompletedDetails as Database['public']['Tables']['CompletedDetails']['Row'])
							.mal_title!
					)
					if (distance! > 5) {
						return {
							id: item.id,
							mal_id: (
								item.CompletedDetails as Database['public']['Tables']['CompletedDetails']['Row']
							).mal_id,
							entryTitle: item.title,
							retrievedTitle: (
								item.CompletedDetails as Database['public']['Tables']['CompletedDetails']['Row']
							).mal_title,
							distance: distance
						}
					}
					return null
				})
				.filter((item) => item != null)
				.filter((item) => !errorTrackIgnore?.includes(item!.id))
				.sort((a, b) => b?.distance! - a?.distance!)

			//@ts-expect-error
			setResponse(levenDistance)
			setIsLoadingClient(false)
		}
		getData()

		setWidth(window.innerWidth)
		const handleWindowResize = () => setWidth(window.innerWidth)

		window.addEventListener('resize', handleWindowResize)

		return () => {
			window.removeEventListener('resize', handleWindowResize)
		}
	}, [])

	if (!response?.length && !isLoadingClient) {
		return (
			<>
				<Head>
					<title>Cytube Watchlist</title>
					<meta name="description" content="Completed Errors" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<link rel="icon" href="/favicon.ico" />
				</Head>

				<main className="flex flex-col items-center justify-center h-[100dvh] mb-24 px-1 md:px-0 pt-[70px]">
					<h2 className="p-2 text-3xl">No errors found</h2>
					<span>Check console for details on omitted entries</span>
				</main>
			</>
		)
	}

	//TODO: Add confirm for ignore
	return (
		<>
			<Head>
				<title>Cytube Watchlist</title>
				<meta name="description" content="Completed Errors" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="flex flex-col items-center justify-center mb-24 px-0 pt-[70px]">
				<h2 className="p-2 text-3xl text-center">Potential Errors in Completed</h2>
				<section>
					<div className="grid grid-cols-[5fr_5fr_1fr_1fr] xl:grid-cols-[26rem_26rem_10rem_12rem] min-w-[95dvw] xl:min-w-0 sm:w-min bg-sky-600 border-white border-solid border-[1px]">
						<span className="flex items-center justify-center p-2 h-full text-xs md:text-base border-white border-r-[1px] text-center font-bold">
							Title
						</span>
						<span className="flex items-center justify-center p-2 h-full text-xs md:text-base border-white border-r-[1px] text-center font-bold">
							Retrieved Title
						</span>
						<span
							style={{ writingMode: width > 1280 ? 'initial' : 'vertical-lr' }}
							className="flex p-2 h-full text-xs md:text-base border-white border-r-[1px] text-center font-bold"
						>
							Levenshtein Distance
						</span>
						<span className="flex items-center justify-center p-2 h-full text-xs md:text-base text-center font-bold">
							Options
						</span>
					</div>
					<div className="grid grid-cols-[5fr_5fr_1fr_1fr] xl:grid-cols-[26rem_26rem_10rem_12rem] text-sm md:text-base min-w-[95dvw] xl:min-w-0 sm:w-min border-white border-solid border-[1px] border-t-0">
						{response?.map((item, index) => {
							return (
								<>
									<span className="flex items-center justify-center p-3 h-full text-xs md:text-base border-white border-b-[1px] text-center">
										{item.entryTitle}
									</span>
									<Link
										href={`https://myanimelist.net/anime/${item.mal_id}`}
										target="_blank"
										rel='noopener noreferrer'
										className="flex items-center justify-center p-3 h-full text-xs md:text-base border-white border-b-[1px] text-center link"
									>
										{item.retrievedTitle}
									</Link>
									<span className="flex items-center justify-center p-2 h-full text-xs md:text-base border-white border-b-[1px] text-center">
										{item.distance}
									</span>
									<span className="flex flex-col xl:flex-row items-center justify-center gap-2 p-1 xl:p-2 h-full text-xs xl:text-base border-white border-b-[1px] text-center">
										<button
											onClick={() => handleOpenChangeMenu(item)}
											className="px-1 xl:px-2 py-1 text-xs xl:text-base input-submit"
										>
											Change
										</button>
										<button
											onClick={() => handleIgnore(item)}
											className="px-1 xl:px-2 py-1 text-xs xl:text-base input-submit"
										>
											Ignore
										</button>
									</span>
								</>
							)
						})}
					</div>
				</section>
				{changed && <ChangeModal />}
			</main>
		</>
	)

	function ChangeModal() {
		async function handleChange(e: BaseSyntheticEvent) {
			e.preventDefault()
			if (!changed) return
			setLoading(true)

			const linkInput = e.target[0].value
			if (
				!linkInput.match(
					/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi
				)
			) {
				setLoading(false)
				return alert('Enter a valid link')
			}

			const url = new URL(linkInput)
			if (url.hostname != 'myanimelist.net') {
				setLoading(false)
				return alert('Enter a link from myanimelist.net')
			}

			const idInput = parseInt(url.pathname.split('/')[2])
			if (!idInput) {
				setLoading(false)
				return alert('ID not found. Enter a valid link')
			}

			try {
				await axios.post('/api/changedetails', {
					id: changed.id,
					mal_id: idInput,
					type: 'CHANGED'
				})
				router.reload()
			} catch (error) {
				setLoading(false)
				alert(error)
			}
		}

		return (
			<div>
				<div
					onClick={() => setChanged(null)}
					className="fixed top-0 left-0 h-[100dvh] w-[100dvw] bg-black opacity-30"
				/>
				<div className="fixed flex flex-col items-center h-[30rem] w-[50rem] px-10 py-6 bg-gray-700 rounded-md shadow-md shadow-black drop-shadow-md border-4 border-black top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 modal">
					<div
						onClick={() => setChanged(null)}
						className="absolute right-6 flex items-center justify-center h-11 w-11 rounded-full cursor-pointer transition-colors duration-150 hover:bg-slate-500"
					>
						<CloseIcon fontSize="large" />
					</div>
					<h3 className="font-bold text-2xl">Edit Details</h3>
					<form
						onSubmit={handleChange}
						className="flex flex-col items-center absolute top-[40%] w-3/5"
					>
						<label className="flex flex-col gap-4 items-center mb-6 text-lg">
							Enter MyAnimeList link:
							<input type="text" className="input-text" />
						</label>
						<Link
							href={`https://myanimelist.net/anime.php?q=${changed?.retrievedTitle?.substring(
								0,
								64
							)}`}
							target="_blank"
							rel='noopener noreferrer'
							className="text-lg link"
						>
							Search for anime title
						</Link>
					</form>
				</div>
			</div>
		)
	}

	function handleOpenChangeMenu(item: {
		id: number
		mal_id: number | null
		entryTitle: string | null
		retrievedTitle: string | null
		distance: number | undefined
	}) {
		setChanged(item)
	}

	async function handleIgnore(item: {
		id: number
		mal_id: number | null
		entryTitle: string | null
		retrievedTitle: string | null
		distance: number | undefined
	}) {
		setLoading(true)
		try {
			await axios.post('/api/changedetails', {
				id: item.id,
				mal_id: 0,
				type: 'IGNORE'
			})
			router.reload()
		} catch (error) {
			setLoading(false)
			alert(error)
		}
	}
}
