import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BaseSyntheticEvent, Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import DoneIcon from '@mui/icons-material/Done'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import { Database } from '@/lib/database.types'

export default function Genres() {
	const [response, setResponse] = useState<Database['public']['Tables']['Genres']['Row'][]>()
	const [advancedSearch, setAdvancedSearch] = useState(false)
	const [advancedSearchResult, setAdvancedSearchResult] = useState<any>(null)

	const router = useRouter()

	useEffect(() => {
		const supabase = createClient<Database>(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
				<title>Watchlist</title>
				<meta name="description" content="Completed Details" />
			</Head>

			<main className="flex flex-col items-center justify-center px-6 py-2 mb-12">
				<h2 className="text-2xl sm:text-3xl">Genres</h2>
				<span 
					tabIndex={0} 
					onClick={() => setAdvancedSearch(true)} 
					className="mb-2 cursor-pointer link"
				>
					Advanced Search
				</span>
				<div
					style={{
						gridTemplateColumns: 'repeat(1fr)',
						gridTemplateRows: `repeat(${noOfRows}, 1em)`,
						gridAutoFlow: 'column'
					}}
					className="grid gap-x-6 md:gap-x-32 gap-y-5"
				>
					{response?.map((item, index) => (
						<Link
							key={index}
							href={`${router.asPath}/${item.id}`}
							className="whitespace-nowrap text-center text-white link"
						>
							{item.name}
						</Link>
					))}
				</div>
				<AdvancedSearchModal 
					advancedSearch={advancedSearch}
					setAdvancedSearch={setAdvancedSearch}
					response={response}
					setAdvancedSearchResult={setAdvancedSearchResult}
				/>
				<Dialog
					fullWidth
					maxWidth="lg"
					open={!!advancedSearchResult}
					onClose={() => setAdvancedSearchResult(null)}
				>
					<div className='flex flex-col items-center p-6'>
						<div
							onClick={() => setAdvancedSearchResult(null)}
							className="absolute left-6 flex items-center justify-center h-11 w-11 rounded-full cursor-pointer transition-colors duration-150 hover:bg-slate-500"
						>
							<ArrowBackIcon fontSize="large" />
						</div>
						<h3 className="mb-4 font-semibold text-2xl">Result</h3>
						<AdvancedSearchTable 
							advancedSearchResult={advancedSearchResult} 
							setAdvancedSearchResult={setAdvancedSearchResult} 
						/>
					</div>
				</Dialog>
			</main>
		</>
	)
}

function AdvancedSearchModal({
	advancedSearch,
	setAdvancedSearch,
	response,
	setAdvancedSearchResult
}: {
	advancedSearch: boolean;
	setAdvancedSearch: Dispatch<SetStateAction<boolean>>;
	response: Database['public']['Tables']['Genres']['Row'][] | undefined;
	setAdvancedSearchResult: Dispatch<any>;
}) {
	async function handleSubmit(e: BaseSyntheticEvent) {
		e.preventDefault()

		const target = e.target as any
		const arr: { [k: string]: any } = Object.fromEntries(
			Object.entries(target).filter((item: any) => {
				return item[1].checked
			})
		)
		const arrIncluded = Object.keys(arr).map((key) => parseInt(arr[key].value))

		const supabase = createClient<Database>(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
		)

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

	const noOfRows = Math.ceil(response?.length! / 3)

	return (
		<Dialog
			fullWidth
			maxWidth="lg"
			open={advancedSearch}
			onClose={() => setAdvancedSearch(false)}
		>
			<div className="fixed flex flex-col items-center gap-4 h-[85dvh] w-[45rem] max-w-[95%] px-10 py-6 bg-neutral-700 rounded-md shadow-md shadow-black drop-shadow-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%]">
				<h3 className="font-semibold text-2xl">Advanced Search</h3>
				<div
					onClick={() => setAdvancedSearch(false)}
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
					className="grid gap-x-0 md:gap-x-16 gap-y-4 overflow-auto"
				>
					{response?.map((item, index) => {
						return (
							<label
								key={index}
								className="relative flex items-center gap-1 min-w-max checkbox-container"
							>
								<div className="custom-checkbox" />
								<DoneIcon fontSize="inherit" className="absolute checkmark" />
								<input type="checkbox" value={item.id!} />
								{item.name}
							</label>
						)
					})}
				</form>
				<Button 
					form='advanced-search'
					type='submit'
					variant='outlined'
					size='large'
				>
					Search
				</Button>
			</div>
		</Dialog>
	)
}

function AdvancedSearchTable({ 
	advancedSearchResult, 
	setAdvancedSearchResult 
}: any) {
	const sortMethodRef = useRef('') 

	function handleSort(sortBy: 'rating1' | 'rating2') {
		if (sortMethodRef.current == `${sortBy}_desc`) {
			const sorted = advancedSearchResult
				.slice()
				.sort((a: any, b: any) => a[`${sortBy}average`] - b[`${sortBy}average`])
			sortMethodRef.current = `${sortBy}_asc`
			setAdvancedSearchResult(sorted)
		} else {
			const sorted = advancedSearchResult
				.slice()
				.sort((a: any, b: any) => b[`${sortBy}average`] - a[`${sortBy}average`])
			sortMethodRef.current = `${sortBy}_desc`
			setAdvancedSearchResult(sorted)
		}
	}

	return (
		<>
			<div className="flex items-center justify-center w-[85%] bg-sky-600 border-white border-solid border-[1px] border-b-0 rounded-tl-lg rounded-tr-lg">
				<div className="grow p-3 text-lg text-center font-semibold">Title</div>
				<div
					onClick={() => handleSort('rating1')}
					className="relative p-3 min-w-[8rem] text-lg text-center font-semibold cursor-pointer border-l-[1px] border-white"
				>
					Rating 1
					{sortMethodRef.current.includes('rating1') && (
						<span className="absolute">
							{sortMethodRef.current.includes('asc') ? '▲' : '▼'}
						</span>
					)}
				</div>
				<div
					onClick={() => handleSort('rating2')}
					className="relative p-3 min-w-[8rem] text-lg text-center font-semibold cursor-pointer border-l-[1px] border-white"
				>
					Rating 2
					{sortMethodRef.current.includes('rating2') && (
						<span className="absolute">
							{sortMethodRef.current.includes('asc') ? '▲' : '▼'}
						</span>
					)}
				</div>
			</div>
			<ul className="flex flex-col gap-2 h-[70dvh] w-[85%] overflow-auto border-[1px] border-white rounded-bl-lg rounded-br-lg">
				{advancedSearchResult?.length ?
				advancedSearchResult.map((item: any, index: number) => {
					return (
						<li
							key={index}
							className="flex items-center justify-center p-0 text-center rounded-md transition-colors duration-75 hover:bg-slate-500"
						>
							<Link
								href={`/completed/anime/${item.id}`}
								className="grow px-5 py-3 h-full w-full"
							>
								{item.title}
							</Link>
							<span className='min-w-[8rem] px-3 py-2 text-lg text-center'>
								{item.rating1}
							</span>
							<span className='min-w-[8rem] px-3 py-2 text-lg text-center'>
								{item.rating2}
							</span>
						</li>
					)
				})
				:
				<span className='text-lg my-auto self-center'>
					No results found.	
				</span>}
			</ul>
		</>
	)
}