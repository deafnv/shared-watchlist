import { createClient } from '@supabase/supabase-js'
import Head from 'next/head'
import { BaseSyntheticEvent, useEffect, useState } from 'react'
import { Database } from '@/lib/database.types'
import Link from 'next/link'
import DoneIcon from '@mui/icons-material/Done'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'

export default function Genres() {
	const [response, setResponse] = useState<Database['public']['Tables']['Genres']['Row'][]>()
	const [advancedSearch, setAdvancedSearch] = useState('none')
	const [advancedSearchResult, setAdvancedSearchResult] = useState<any>(null)

	const supabase = createClient<Database>(
		'https://esjopxdrlewtpffznsxh.supabase.co',
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	)

	useEffect(() => {
		const supabase = createClient<Database>(
			'https://esjopxdrlewtpffznsxh.supabase.co',
			process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
		)
		const getData = async () => {
			const { data } = await supabase.from('Genres').select().order('name')

			setResponse(data!)
		}
		getData()
	}, [])

	const noOfRows = Math.ceil(response?.length! / 3)
	return (
		<>
			<Head>
				<title>Cytube Watchlist</title>
				<meta name="description" content="Completed Details" />
			</Head>

			<main className="flex flex-col items-center justify-center px-6 py-2">
				<h2 className="text-2xl sm:text-3xl">Genres</h2>
				<span tabIndex={0} onClick={() => setAdvancedSearch('block')} className="mb-2 cursor-pointer link">
					Advanced Search
				</span>
				<div
					style={{
						gridTemplateColumns: 'repeat(1fr)',
						gridTemplateRows: `repeat(${noOfRows}, 1em)`,
						gridAutoFlow: 'column'
					}}
					className="grid gap-x-6 md:gap-x-12 gap-y-5 w-3/5"
				>
					{response?.map((item, index) => {
						return (
							<Link
								key={index}
								href={`${location.href}/${item.id}`}
								className="whitespace-nowrap text-center text-white link"
							>
								{item.name}
							</Link>
						)
					})}
				</div>
				{advancedSearch == 'block' ? <AdvancedSearchModal /> : null}
			</main>
		</>
	)

	function AdvancedSearchModal() {
		async function handleSubmit(e: BaseSyntheticEvent) {
			e.preventDefault()

			const target = e.target as any
			const arr: { [k: string]: any } = Object.fromEntries(
				Object.entries(target).filter((item: any, index: number) => {
					return item[1].checked
				})
			)
			const arrIncluded = Object.keys(arr).map((key) => parseInt(arr[key].value))

			const { data } = await supabase
				.from('Completed')
				.select(
					`
          *,
          Genres!inner (
            id
          )
        `
				)
				.in('Genres.id', arrIncluded) //TODO: Look into if it is possible to query by their relationship

			const matched = data?.filter((item) => {
				return (item.Genres as { id: number }[]).length == arrIncluded.length
			})

			setAdvancedSearchResult(matched!)
		}

		return (
			<div style={{ display: advancedSearch }} className="z-10">
				<div
					onClick={() => setAdvancedSearch('none')}
					className="fixed top-0 left-0 h-[100dvh] w-[100dvw] glass-modal"
				/>
				{advancedSearchResult ? (
					<div className="fixed flex flex-col items-center gap-4 w-[45rem] px-10 py-6 bg-gray-700 rounded-md shadow-md shadow-black drop-shadow-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] modal">
						<div
							onClick={() => setAdvancedSearchResult(null)}
							className="absolute left-6 flex items-center justify-center h-11 w-11 rounded-full cursor-pointer transition-colors duration-150 hover:bg-slate-500"
						>
							<ArrowBackIcon fontSize="large" />
						</div>
						<h3 className="font-semibold text-2xl">Result</h3>
						<ul className="flex flex-col gap-2 h-[70dvh] overflow-auto">
							{advancedSearchResult.length ?
							advancedSearchResult.map((item: any, index: number) => {
								return (
									<li
										key={index}
										className="p-0 text-center rounded-md transition-colors duration-75 hover:bg-slate-500"
									>
										<Link
											href={`${location.origin}/completed/anime/${item.id}`}
											className="inline-block px-3 py-5 h-full w-full"
										>
											{item.title}
										</Link>
									</li>
								)
							})
							:
							<span className='text-lg my-auto'>
								No results found.	
							</span>}
						</ul>
					</div>
				) : (
					<div className="fixed flex flex-col items-center gap-4 h-[85dvh] w-[45rem] max-w-[95%] px-10 py-6 bg-gray-700 rounded-md shadow-md shadow-black drop-shadow-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] modal">
						<h3 className="font-semibold text-2xl">Advanced Search</h3>
						<div
							onClick={() => setAdvancedSearch('none')}
							className="absolute top-5 right-6 flex items-center justify-center h-11 w-11 rounded-full cursor-pointer transition-colors duration-150 hover:bg-slate-500"
						>
							<CloseIcon fontSize="large" />
						</div>
						<span>Includes: </span>
						<hr className="w-full border-white border-t-[1px]" />
						<form
							id="advanced-search"
							onSubmit={handleSubmit}
							style={{
								gridTemplateColumns: 'repeat(1fr)',
								gridTemplateRows: `repeat(${noOfRows}, 1em)`,
								gridAutoFlow: 'column'
							}}
							className="grid gap-x-20 gap-y-4 overflow-auto"
						>
							{response?.map((item, index) => {
								return (
									<label
										key={index}
										className="relative flex gap-1 items-center checkbox-container"
									>
										<div className="custom-checkbox" />
										<DoneIcon fontSize="inherit" className="absolute checkmark" />
										<input type="checkbox" value={item.id!} />
										{item.name}
									</label>
								)
							})}
						</form>
						<input
							form="advanced-search"
							type="submit"
							value="Search"
							className="input-submit px-2 p-1"
						/>
					</div>
				)}
			</div>
		)
	}
}
