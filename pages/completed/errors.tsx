import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState, BaseSyntheticEvent, Fragment } from 'react'
import axios from 'axios'
import CloseIcon from '@mui/icons-material/Close'
import Button from '@mui/material/Button'
import { createClient } from '@supabase/supabase-js'
import { levenshtein } from '@/lib/list_methods'
import { Database } from '@/lib/database.types'
import { useLoading } from '@/components/LoadingContext'
import ModalTemplate from '@/components/ModalTemplate'
import EditDialog from '@/components/dialogs/EditDialog'

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
				process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
					<title>Watchlist</title>
					<meta name="description" content="Completed Errors" />
				</Head>

				<main className="flex flex-col items-center justify-center h-[100dvh] mb-24 px-1 md:px-0">
					<h2 className="p-2 text-2xl sm:text-3xl">No errors found</h2>
					<span>Check console for details on omitted entries</span>
				</main>
			</>
		)
	}

	//TODO: Add confirm for ignore
	return (
		<>
			<Head>
				<title>Watchlist</title>
				<meta name="description" content="Completed Errors" />
			</Head>

			<main className="flex flex-col items-center justify-center mb-24 px-6 py-2">
				<h2 className="p-2 text-2xl sm:text-3xl text-center">Potential Errors in Completed</h2>
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
						{response?.map(item => {
							return (
								<Fragment key={item.mal_id}>
									<span className="flex items-center justify-center sm:px-3 py-3 h-full text-xs md:text-base border-white border-b-[1px] text-center">
										{item.entryTitle}
									</span>
									<Link
										href={`https://myanimelist.net/anime/${item.mal_id}`}
										target="_blank"
										rel='noopener noreferrer'
										className="flex items-center justify-center sm:px-3 py-3 h-full text-xs md:text-base border-white border-b-[1px] text-center link"
									>
										{item.retrievedTitle}
									</Link>
									<span className="flex items-center justify-center p-2 h-full text-xs md:text-base border-white border-b-[1px] text-center">
										{item.distance}
									</span>
									<span className="flex flex-col xl:flex-row items-center justify-center gap-2 p-1 xl:p-2 h-full text-xs xl:text-base border-white border-b-[1px] text-center">
										<Button
											onClick={() => handleOpenChangeMenu(item)}
											variant='outlined'
											size='small'
										>
											Change
										</Button>
										<Button
											onClick={() => handleIgnore(item)}
											color='error'
											size='small'
										>
											Ignore
										</Button>
									</span>
								</Fragment>
							)
						})}
					</div>
				</section>
				<EditDialog 
					editDialog={!!changed}
					setEditDialog={() => setChanged(null)}
					details={{ id: changed?.id ?? 0, title: changed?.entryTitle ?? '' }}
				/>
			</main>
		</>
	)

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
			await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/changedetails`, {
				id: item.id,
				mal_id: 0,
				type: 'IGNORE_ERROR'
			}, { withCredentials: true })
			router.reload()
		} catch (error) {
			setLoading(false)
			alert(error)
		}
	}
}
