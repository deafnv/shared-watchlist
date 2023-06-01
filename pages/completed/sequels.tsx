import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState, Dispatch, SetStateAction } from 'react'
import axios from 'axios'
import RefreshIcon from '@mui/icons-material/Refresh'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import { useLoading } from '@/components/LoadingContext'

type UnwatchedSequel = Database['public']['Tables']['UnwatchedSequels']['Row'] & { Completed: Pick<Database['public']['Tables']['Completed']['Row'], 'title'> }

export default function CompleteSequels() {
	const [isLoadingClient, setIsLoadingClient] = useState(true)
	const [response, setResponse] = useState<UnwatchedSequel[]>()
	const [ignore, setIgnore] = useState<UnwatchedSequel>()
	
	const { setLoading } = useLoading()

	const router = useRouter()

	useEffect(() => {
		const getData = async () => {
			const supabase = createClient<Database>(
				process.env.NEXT_PUBLIC_SUPABASE_URL!,
				process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
			)
			const sequelsData = await supabase
				.from('UnwatchedSequels')
				.select('*, Completed!inner( title )')
        .neq('message', 'IGNORE')
        .order('anime_id', { ascending: true })
      console.log(sequelsData.data)

			//@ts-expect-error
			setResponse(sequelsData.data)
			setIsLoadingClient(false)
		}
		getData()
	}, [])

	if (isLoadingClient) {
		return (
			<>
				<Head>
					<title>Watchlist</title>
					<meta name="description" content="Unwatched Sequels" />
				</Head>

				<main className="flex flex-col items-center justify-center mb-24 px-6 py-2">
					<header className='flex items-center'>
						<h2 className="p-2 text-2xl sm:text-3xl text-center">Unwatched Sequels</h2>
					</header>
					<div className='flex items-center justify-center h-[40rem]'>
						<CircularProgress size={40} />
					</div>
				</main>
			</>
		)
	}

	if (!response?.length && !isLoadingClient) {
		return (
			<>
				<Head>
					<title>Watchlist</title>
					<meta name="description" content="Unwatched Sequels" />
				</Head>

				<main className="flex flex-col items-center justify-center gap-4 h-[100dvh] mb-24 px-1 md:px-0">
					<h2 className="text-2xl sm:text-3xl">No unwatched sequels found</h2>
					<span>Check console for details on omitted entries</span>
					<Button
						onClick={handleLoadSequels}
						variant='outlined'
					>
						Reload sequels
					</Button>
				</main>
			</>
		)
	}

	return (
		<>
			<Head>
				<title>Watchlist</title>
				<meta name="description" content="Unwatched Sequels" />
			</Head>

			<main className="flex flex-col items-center justify-center mb-24 px-6 py-2">
				<header className='flex items-center'>
					<h2 className="p-2 text-2xl sm:text-3xl text-center">Unwatched Sequels</h2>
					<div
						title="Load sequels"
						tabIndex={0}
						onClick={handleLoadSequels}
						className="flex items-center justify-center h-7 w-7 cursor-pointer rounded-full hover:bg-gray-500 transition-colors duration-150 translate-y-[1px]"
					>
						<RefreshIcon sx={{ fontSize: 28 }} />
					</div>
				</header>
				<section className='p-2 bg-neutral-700 rounded-md'>
					<div className="grid grid-cols-[0.6fr_5fr_5fr_0.8fr] xl:grid-cols-[4rem_30rem_30rem_10rem] min-w-[95dvw] xl:min-w-0 sm:w-min border-b">
            <span className="flex items-center justify-center p-2 pt-1 h-full text-xs md:text-base text-center font-bold">
              No.
            </span>
						<span className="flex items-center justify-center p-2 pt-1 h-full text-xs md:text-base text-center font-bold">
							Title
						</span>
						<span className="flex items-center justify-center p-2 pt-1 h-full text-xs md:text-base text-center font-bold">
							Sequel Title
						</span>
						<span className="flex items-center justify-center p-2 pt-1 h-full text-xs md:text-base text-center font-bold">
							Options
						</span>
					</div>
					{response?.map(item => {
						return (
							<div 
								key={item.anime_id}
								className='grid grid-cols-[0.6fr_5fr_5fr_0.8fr] xl:grid-cols-[4rem_30rem_30rem_10rem] text-sm md:text-base min-w-[95dvw] xl:min-w-0 sm:w-min group'
							>
								<span className="flex items-center justify-center p-2 h-full text-xs md:text-base text-center group-hover:bg-zinc-800 rounded-md">
									{item.anime_id}
								</span>
								<Link 
									href={`/completed/anime/${item.anime_id}`}
									className="flex items-center justify-center p-2 h-full text-xs md:text-base text-center link text-blue-200 group-hover:bg-zinc-800 rounded-md"
								>
									{item.Completed.title}
								</Link>
								<a
									href={`https://myanimelist.net/anime/${item.seq_mal_id}`}
									target="_blank"
									rel='noopener noreferrer'
									className="flex items-center justify-center p-2 h-full text-xs md:text-base text-center link text-blue-200 group-hover:bg-zinc-800 rounded-md"
								>
									{item.seq_title}
								</a>
								<span className="flex flex-col xl:flex-row items-center justify-center gap-2 p-1 xl:p-2 h-full text-xs xl:text-base text-center group-hover:bg-zinc-800 rounded-md">
									<Button
										onClick={() => setIgnore(item)}
										color='error'
										size='small'
									>
										Ignore
									</Button>
								</span>
							</div>
						)
					})}
				</section>
				<ConfirmModal 
					ignore={ignore}
					setIgnore={setIgnore}
				/>
			</main>
		</>
	)

	async function handleLoadSequels() {
		setLoading(true)
		try {
			await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/completed/loadsequels`, { withCredentials: true })
			router.reload()
		} catch (error) {
			setLoading(false)
			alert(error)
		}
	}
}

function ConfirmModal({
	ignore,
	setIgnore
}: {
	ignore: UnwatchedSequel | undefined
	setIgnore: Dispatch<SetStateAction<UnwatchedSequel | undefined>>
}) {
	const router = useRouter()
	
	const { setLoading } = useLoading()

	async function handleIgnore() {
		if (!ignore) return
		setLoading(true)
		try {
			await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/changedetails`, {
				id: ignore.id,
				mal_id: 0,
				type: 'IGNORE_SEQUEL'
			}, { withCredentials: true })
			router.reload()
		} catch (error) {
			setLoading(false)
			alert(error)
		}
	}

	return (
		<Dialog
			fullWidth
			maxWidth="xs"
			open={!!ignore}
			onClose={() => setIgnore(undefined)}
		>
			<div className='p-2'>
				<DialogTitle fontSize='large'>
					Confirm ignore sequel?
				</DialogTitle>
				<DialogActions>
					<Button 
						onClick={handleIgnore}
						variant='outlined' 
					>
						Yes
					</Button>
					<Button 
						onClick={() => setIgnore(undefined)}
						color='error' 
					>
						No
					</Button>
				</DialogActions>
			</div>
		</Dialog>
	)
}