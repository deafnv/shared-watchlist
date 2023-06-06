import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BaseSyntheticEvent, Dispatch, SetStateAction, useRef, useState } from 'react'
import axios from 'axios'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import DoneIcon from '@mui/icons-material/Done'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { Completed, Genres, GenresOnCompleted } from '@prisma/client'
import prisma from '@/lib/prisma'

type CompletedWithGenre = (Completed & {
	genres: (GenresOnCompleted & {
			genre: Genres;
	})[];
})

export const getStaticProps = async () => {
	const genres = await prisma.genres.findMany({
		orderBy: {
			name: 'asc'
		}
	})

	return {
		props: {
			response: genres
		},
		revalidate: 360
	}
}

export default function Genres({ response }: { response: Genres[] }) {
	const [advancedSearch, setAdvancedSearch] = useState(false)
	const [advancedSearchResult, setAdvancedSearchResult] = useState<CompletedWithGenre[] | null>(null)

	const router = useRouter()

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
					<div className='flex flex-col items-center p-6 bg-[#2e2e2e]'>
						<IconButton
							onClick={() => setAdvancedSearchResult(null)}
							className="!absolute top-4 left-6 flex items-center justify-center h-11 w-11 rounded-full cursor-pointer"
						>
							<ArrowBackIcon fontSize="large" />
						</IconButton>
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
	response: Genres[] | undefined;
	setAdvancedSearchResult: Dispatch<SetStateAction<CompletedWithGenre[] | null>>;
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

		const { data } = await axios.get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/table/completedsbygenreid`, {
			params: {
				id: arrIncluded
			}
		})

		const matched = (data as CompletedWithGenre[])?.filter((item) => {
			return arrIncluded.every(id => item.genres.map(genre => genre.genre_id).includes(id))
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
			<div className="fixed flex flex-col items-center gap-4 h-[85dvh] w-[45rem] max-w-[95%] px-10 py-6 bg-[#2e2e2e] rounded-md shadow-md shadow-black drop-shadow-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%]">
				<h3 className="font-semibold text-2xl">Advanced Search</h3>
				<IconButton
					onClick={() => setAdvancedSearch(false)}
					className="!absolute top-5 right-6 flex items-center justify-center h-11 w-11 rounded-full cursor-pointer"
				>
					<CloseIcon fontSize="large" />
				</IconButton>
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
}: {
	advancedSearchResult: CompletedWithGenre[] | null;
	setAdvancedSearchResult: Dispatch<SetStateAction<CompletedWithGenre[] | null>>
}) {
	const sortMethodRef = useRef('') 

	function handleSort(sortBy: 'rating1' | 'rating2') {
		if (sortMethodRef.current == `${sortBy}_desc`) {
			const sorted = advancedSearchResult
				?.slice()
				.sort((a: any, b: any) => a[`${sortBy}average`] - b[`${sortBy}average`])
			sortMethodRef.current = `${sortBy}_asc`
			setAdvancedSearchResult(sorted ?? null)
		} else {
			const sorted = advancedSearchResult
				?.slice()
				.sort((a: any, b: any) => b[`${sortBy}average`] - a[`${sortBy}average`])
			sortMethodRef.current = `${sortBy}_desc`
			setAdvancedSearchResult(sorted ?? null)
		}
	}

	return (
		<div className='p-2 w-full bg-neutral-700 rounded-md'>
			<div className="grid grid-cols-[2fr_1fr_1fr] border-b">
				<div className="flex items-center justify-center p-2 pt-1 text-lg text-center font-semibold">Title</div>
				<div
					onClick={() => handleSort('rating1')}
					className="relative flex items-center justify-center p-2 pt-1 text-lg text-center font-semibold cursor-pointer"
				>
					Rating 1
					{sortMethodRef.current.includes('rating1') && (
						<span className="absolute">
							<ArrowDropDownIcon sx={{
								rotate: sortMethodRef.current.includes('asc') ? '180deg' : '0'
							}} />
						</span>
					)}
				</div>
				<div
					onClick={() => handleSort('rating2')}
					className="relative flex items-center justify-center p-2 pt-1 text-lg text-center font-semibold cursor-pointer"
				>
					Rating 2
					{sortMethodRef.current.includes('rating2') && (
						<span className="absolute">
							<ArrowDropDownIcon sx={{
								rotate: sortMethodRef.current.includes('asc') ? '180deg' : '0'
							}} />
						</span>
					)}
				</div>
			</div>
			<ul className="flex flex-col gap-2 h-[70dvh] overflow-auto">
				{advancedSearchResult?.length ?
				advancedSearchResult.map((item: any, index: number) => {
					return (
						<li
							key={index}
							className="grid grid-cols-[2fr_1fr_1fr] p-0 text-center rounded-md transition-colors duration-75 hover:bg-zinc-800"
						>
							<Link
								href={`/completed/anime/${item.id}`}
								className="px-5 py-3 h-full w-full"
							>
								{item.title}
							</Link>
							<span className='flex items-center justify-center px-3 py-2 text-center'>
								{item.rating1}
							</span>
							<span className='flex items-center justify-center px-3 py-2 text-center'>
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
		</div>
	)
}