import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useEffect, useState } from 'react'
import axios from 'axios'
import RefreshIcon from '@mui/icons-material/Refresh'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import { useLoading } from '@/components/LoadingContext'

export default function CompleteSequels() {
	const [isLoadingClient, setIsLoadingClient] = useState(true)
	const [response, setResponse] = useState<any[]>()
	const { setLoading } = useLoading()
	const [width, setWidth] = useState<number>(0)

	const router = useRouter()

	useEffect(() => {
		const getData = async () => {
			const supabase = createClient<Database>(
				'https://esjopxdrlewtpffznsxh.supabase.co',
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
					<meta name="description" content="Unwatched Sequels" />
				</Head>

				<main className="flex flex-col items-center justify-center gap-4 h-[100dvh] mb-24 px-1 md:px-0">
					<h2 className="text-2xl sm:text-3xl">No unwatched sequels found</h2>
					<span>Check console for details on omitted entries</span>
					<button
						onClick={handleLoadSequels}
						className='link'
					>
						Click to reload sequels
					</button>
				</main>
			</>
		)
	}

	//TODO: Add confirm for ignore
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
				<section>
					<div className="grid grid-cols-[0.6fr_5fr_5fr_0.8fr] xl:grid-cols-[4rem_30rem_30rem_10rem] min-w-[95dvw] xl:min-w-0 sm:w-min bg-sky-600 border-white border-solid border-[1px]">
            <span className="flex items-center justify-center p-2 h-full text-xs md:text-base border-white border-r-[1px] text-center font-bold">
              No.
            </span>
						<span className="flex items-center justify-center p-2 h-full text-xs md:text-base border-white border-r-[1px] text-center font-bold">
							Title
						</span>
						<span className="flex items-center justify-center p-2 h-full text-xs md:text-base border-white border-r-[1px] text-center font-bold">
							Sequel Title
						</span>
						<span className="flex items-center justify-center p-2 h-full text-xs md:text-base text-center font-bold">
							Options
						</span>
					</div>
					<div className="grid grid-cols-[0.6fr_5fr_5fr_0.8fr] xl:grid-cols-[4rem_30rem_30rem_10rem] text-sm md:text-base min-w-[95dvw] xl:min-w-0 sm:w-min border-white border-solid border-[1px] border-t-0">
						{response?.map(item => {
							return (
								<Fragment key={item.anime_id}>
                  <span className="flex items-center justify-center p-2 h-full text-xs md:text-base border-white border-b-[1px] text-center">
										{item.anime_id}
									</span>
									<Link 
                    href={`/completed/anime/${item.anime_id}`}
                    className="flex items-center justify-center sm:px-3 py-3 h-full text-xs md:text-base border-white border-b-[1px] text-center link text-blue-200"
                  >
										{item.Completed.title}
									</Link>
									<Link
										href={`https://myanimelist.net/anime/${item.seq_mal_id}`}
										target="_blank"
										rel='noopener noreferrer'
										className="flex items-center justify-center sm:px-3 py-3 h-full text-xs md:text-base border-white border-b-[1px] text-center link text-blue-200"
									>
										{item.seq_title}
									</Link>
									<span className="flex flex-col xl:flex-row items-center justify-center gap-2 p-1 xl:p-2 h-full text-xs xl:text-base border-white border-b-[1px] text-center">
										<button
											onClick={() => handleIgnore(item)}
											className="px-1 xl:px-2 py-1 text-xs xl:text-base input-submit"
										>
											Ignore
										</button>
									</span>
								</Fragment>
							)
						})}
					</div>
				</section>
			</main>
		</>
	)

	async function handleLoadSequels() {
		setLoading(true)
		try {
			await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/completed/loadsequels`)
			router.reload()
		} catch (error) {
			setLoading(false)
			alert(error)
		}
	}

	async function handleIgnore(item: any) {
		setLoading(true)
		try {
			await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/changedetails`, {
				id: item.id,
				mal_id: 0,
				type: 'IGNORE_SEQUEL'
			})
			router.reload()
		} catch (error) {
			setLoading(false)
			alert(error)
		}
	}
}
