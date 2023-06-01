import { GetStaticPropsContext } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import RefreshIcon from '@mui/icons-material/Refresh'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

export async function getStaticPaths() {
	const supabase = createClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	)
	const { data } = await supabase.from('Genres').select().order('id')

	const paths = data?.map((item) => ({
		params: { id: item.id.toString() }
	}))

	return {
		paths,
		fallback: true
	}
}

export function getStaticProps(context: GetStaticPropsContext) {
	return {
		props: {
			id: context.params?.id
		},
		revalidate: 360
	}
}

export default function GenrePage({ id }: { id: number }) {
	const sortMethodRef = useRef('')

	const [response, setResponse] = useState<({ id: number } & { title: string | null } & { rating1: string | null } & { rating2: string | null } & { Genres: { name: string | null } | { name: string | null }[] | null })[] | null>()
	const [response1, setResponse1] = useState<({ id: number } & { title: string | null } & { rating1: string | null } & { rating2: string | null } & { Genres: { name: string | null } | { name: string | null }[] | null })[] | null>()

	useEffect(() => {
		const supabase = createClient<Database>(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
		)
		const getData = async () => {
			const { data } = await supabase
				.from('Completed')
				.select(
					`
          id,
          title,
					rating1,
					rating1average,
					rating2,
					rating2average,
          Genres!inner (
            name
          )
        `
				)
				.eq('Genres.id', id)

			setResponse(data!)
			setResponse1(data!)
		}
		getData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (!response?.[0]) {
		return (
			<>
				<Head>
					<title>Watchlist</title>
					<meta
						name="description"
						content={`${
							(response?.[0]?.Genres as { name: string | null }[])?.[0].name
						} animes in Completed`}
					/>
				</Head>

				<main className="flex flex-col items-center justify-center gap-3 mx-auto h-[90dvh] md:w-3/5 sm:w-full">
					<h2 className="p-2 text-2xl sm:text-3xl">No results found</h2>
				</main>
			</>
		)
	}

	function handleSort(sortBy: 'rating1' | 'rating2') {
		if (sortMethodRef.current == `${sortBy}_desc`) {
			const sorted = response
				?.slice()
				.sort((a: any, b: any) => a[`${sortBy}average`] - b[`${sortBy}average`])
			sortMethodRef.current = `${sortBy}_asc`
			setResponse(sorted)
		} else {
			const sorted = response
				?.slice()
				.sort((a: any, b: any) => b[`${sortBy}average`] - a[`${sortBy}average`])
			sortMethodRef.current = `${sortBy}_desc`
			setResponse(sorted)
		}
	}

	return (
		<>
			<Head>
				<title>Watchlist</title>
				<meta
					name="description"
					content={`${
						(response?.[0]?.Genres as { name: string | null }[])?.[0].name
					} animes in Completed`}
				/>
			</Head>

			<main className="flex flex-col items-center justify-center mx-auto md:w-4/5 sm:w-full">
				<header className='flex items-center mb-3'>
					<h2 className="p-2 text-2xl sm:text-3xl">
						{(response?.[0]?.Genres as { name: string | null }[])?.[0].name}
					</h2>
					{sortMethodRef.current &&
					<div
						title="Reset sort"
						tabIndex={0}
						onClick={() => {
							sortMethodRef.current = ''
							setResponse(response1)
						}}
						className="flex items-center justify-center h-7 w-7 cursor-pointer rounded-full hover:bg-gray-500 transition-colors duration-150 translate-y-[1px]"
					>
						<RefreshIcon sx={{ fontSize: 28 }} />
					</div>}
				</header>
				<section className='p-2 pt-1 bg-neutral-700 rounded-md'>
					<div className="flex items-center justify-center border-b">
						<div className="grow p-3 text-lg text-center font-semibold">Title</div>
						<div
							onClick={() => handleSort('rating1')}
							className="relative p-3 min-w-[8rem] text-lg text-center font-semibold cursor-pointer"
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
							className="relative p-3 min-w-[8rem] text-lg text-center font-semibold cursor-pointer"
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
					<ul className="flex flex-col gap-2 h-[75dvh] overflow-auto">
						{response?.map((item, index) => {
							return (
								<li
									key={index}
									className="flex items-center justify-center p-0 text-center hover:bg-zinc-800 rounded-md transition-colors duration-75"
								>
									<Link
										href={`/completed/anime/${item.id}`}
										className="grow px-5 py-3 h-full w-full"
									>
										{item.title}
									</Link>
									<span className='min-w-[8rem] p-2 text-lg text-center'>
										{item.rating1}
									</span>
									<span className='min-w-[8rem] p-2 text-lg text-center'>
										{item.rating2}
									</span>
								</li>
							)
						})}
					</ul>
				</section>
			</main>
		</>
	)
}
