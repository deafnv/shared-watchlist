import { GetStaticPropsContext } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import EditIcon from '@mui/icons-material/Edit'
import EditDialog from '@/components/dialogs/EditDialog'
import { Database } from '@/lib/database.types'

export async function getStaticPaths() {
	const supabase = createClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	)
	const { data } = await supabase.from('Completed').select().order('id')

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

export default function CompletedPage({ id }: { id: number }) {
	const [response, setResponse] = useState<any>()
	const [genres, setGenres] = useState<Array<{ id: number; name: string | null }>>()
	const [editDialog, setEditDialog] = useState(false)

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
          *,
          CompletedDetails!inner (
            *
          )
        `
				)
				.eq('id', id)

			const dataGenre = await supabase
				.from('Genres')
				.select('*, Completed!inner( id )')
				.eq('Completed.id', id)

			setResponse(data!)
			setGenres(dataGenre.data!)
		}
		getData()

		const closeMenu = (e: KeyboardEvent) => {
			if (e.key == 'Escape') {
				if (editDialog) setEditDialog(false)
			}
		}

		document.addEventListener('keydown', closeMenu)

		return () => {document.removeEventListener('keydown', closeMenu)}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<>
			<Head>
				<title>Watchlist</title>
				<meta name="description" content={response?.[0].title} />
			</Head>

			<main className="flex flex-col items-center justify-center mx-auto mb-16 px-6 sm:px-12 py-6 md:4/5 lg:w-3/5 sm:w-full">
				<div className="relative h-full">
					<h3 className="p-2 text-2xl sm:text-2xl font-semibold text-center">{response?.[0].title}</h3>
					<div
						onClick={() => {setEditDialog(true)}}
						className="absolute -top-2 -right-12 xs:top-0 xs:right-0 sm:right-0 md:top-0 md:-right-12 lg:-right-60 xl:-right-72 flex items-center justify-center h-7 sm:h-11 w-7 sm:w-11 rounded-full cursor-pointer transition-colors duration-150 hover:bg-slate-500"
					>
						<EditIcon sx={{
							fontSize: {
								sm: 20,
								lg: 30	
							}
						}} />
					</div>
				</div>
				<h5 className="text-base text-center">
					{response?.[0].CompletedDetails.mal_alternative_title}
				</h5>
				<Image
					src={response?.[0].CompletedDetails.image_url}
					height={380}
					width={280}
					alt="Art"
					className="my-4"
				/>
				<p className="mb-8 text-center">{response?.[0].CompletedDetails.mal_synopsis}</p>
				<div className="grid md:grid-cols-2 gap-16">
					<div className="col-span-2 md:col-span-1 flex flex-col items-center px-8 py-4 max-w-[95%] min-w-fit border-[1px] border-white">
						<h5 className="self-center mb-4 text-xl font-semibold">Ratings</h5>
						<table className="mb-8">
							<thead>
								<tr>
									<th>Rating 1</th>
									<th>Rating 2</th>
									<th>Rating 3(?)</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>{response?.[0].rating1}</td>
									<td>{response?.[0].rating2}</td>
									<td>{response?.[0].rating3}</td>
								</tr>
							</tbody>
						</table>
						<div className="flex mb-6 gap-16">
							<div className="flex flex-col items-center">
								<h6 className="mb-2 font-semibold text-lg">Start</h6>
								<span className="text-center">{response?.[0].start}</span>
							</div>
							<div className="flex flex-col items-center">
								<h6 className="mb-2 font-semibold text-lg">End</h6>
								<span className="text-center">{response?.[0].end}</span>
							</div>
						</div>
					</div>
					<div className="col-span-2 md:col-span-1 flex flex-col items-center px-8 py-4 max-w-[95%] min-w-fit border-[1px] border-white">
						<h5 className="self-center mb-6 text-xl font-semibold link">
							<Link
								href={`https://myanimelist.net/anime/${response?.[0].CompletedDetails.mal_id}`}
								target="_blank"
								rel='noopener noreferrer'
							>
								MyAnimeList
							</Link>
						</h5>
						<h6 className="mb-2 font-semibold text-lg">Genres</h6>
						<span className="mb-2 text-center">
							{genres?.map((item, index) => {
								return (
									<Link
										href={`/completed/genres/${item.id}`}
										key={index}
										className="link"
									>
										{item.name}
										<span className="text-white">{index < genres.length - 1 ? ', ' : null}</span>
									</Link>
								)
							})}
						</span>
						<div className="flex flex-grow items-center mb-6 gap-16">
							<div className="flex flex-col items-center whitespace-nowrap">
								<h6 className="mb-2 font-semibold text-lg">Start</h6>
								<span className="text-center">
									{new Date(response?.[0].CompletedDetails.start_date).toLocaleDateString('en-US', {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									})}
								</span>
							</div>
							<div className="flex flex-col items-center whitespace-nowrap">
								<h6 className="mb-2 font-semibold text-lg">End</h6>
								<span className="text-center">
									{new Date(response?.[0].CompletedDetails.end_date).toLocaleDateString('en-US', {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									})}
								</span>
							</div>
						</div>
					</div>
				</div>
				<EditDialog
					editDialog={editDialog}
					setEditDialog={setEditDialog}
					details={{ id: response?.[0].id, title: response?.[0].title ?? '' }}
				/>
			</main>
		</>
	)
}
