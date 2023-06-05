import { GetStaticPropsContext } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import EditIcon from '@mui/icons-material/Edit'
import { Completed, CompletedDetails, Genres } from '@prisma/client'
import EditDialog from '@/components/dialogs/EditDialog'
import prisma from '@/lib/prisma'

export async function getStaticPaths() {
	const completeds = await prisma.completed.findMany({
		orderBy: {
			id:	'asc'
		}
	})

	const paths = completeds?.map((item) => ({
		params: { id: item.id.toString() }
	}))

	return {
		paths,
		fallback: true
	}
}

export async function getStaticProps(context: GetStaticPropsContext) {
	const id = context.params?.id as string
	const completed = await prisma.completed.findUnique({
		where: {
			id: parseInt(id)
		},
		include: {
			details: true
		}
	})

	const genres = await prisma.genres.findMany({
    where: {
      completeds: {
        every: {
          completed_id: {
            equals: parseInt(id)
          }
        }
      }
    }
  })

	return {
		props: {
			response: JSON.parse(JSON.stringify(completed)),
			responseGenres: genres
		},
		revalidate: 360
	}
}

export default function CompletedPage({ 
	response, 
	responseGenres 
}: { 
	response: (Completed & {
		details: CompletedDetails | null;
	}) | null;
	responseGenres: Genres[];
}) {
	const [editDialog, setEditDialog] = useState(false)
	const [startDate, setStartDate] = useState('Loading...')
	const [endDate, setEndDate] = useState('Loading...')

	useEffect(() => {
		const initialize = async () => {
			//? Workaround for wrong supabase inner join return type
			if (response && response.details && response.details.start_date && response.details.end_date) {
				setStartDate(new Date(response.details.start_date).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				}))
				setEndDate(new Date(response.details.end_date).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				}))
			}
		}
		initialize()

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
				<meta name="description" content={response?.title} />
			</Head>

			<main className="flex flex-col items-center justify-center mx-auto mb-16 px-6 sm:px-12 py-6 md:4/5 lg:w-3/5 sm:w-full">
				<div className="relative h-full">
					<h3 className="p-2 text-2xl sm:text-2xl font-semibold text-center">{response?.title}</h3>
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
					{response?.details?.mal_alternative_title}
				</h5>
				<Image
					src={response?.details?.image_url ?? ''}
					height={380}
					width={280}
					alt="Art"
					className="my-4"
				/>
				<p className="mb-8 text-center">{response?.details?.mal_synopsis}</p>
				<div className="grid md:grid-cols-2 gap-16">
					<div className="col-span-2 md:col-span-1 flex flex-col items-center px-8 py-4 max-w-[95%] min-w-fit bg-neutral-700 rounded-md">
						<h5 className="self-center mb-4 text-xl font-semibold">Ratings</h5>
						<div className='mb-8 p-2 bg-zinc-800 rounded-md'>
							<table>
								<thead className='border-b'>
									<tr>
										<th className='p-2 pt-1'>Rating 1</th>
										<th className='p-2 pt-1'>Rating 2</th>
										<th className='p-2 pt-1'>Rating 3</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td className='p-2 text-center'>{response?.rating1}</td>
										<td className='p-2 text-center'>{response?.rating2}</td>
										<td className='p-2 text-center'>{response?.rating3}</td>
									</tr>
								</tbody>
							</table>
						</div>
						<div className="flex mb-6 gap-8">
							<div className="flex flex-col items-center">
								<h6 className="mb-2 font-semibold text-lg">Start</h6>
								<span className="text-center">{response?.start}</span>
							</div>
							<div className="flex flex-col items-center">
								<h6 className="mb-2 font-semibold text-lg">End</h6>
								<span className="text-center">{response?.end}</span>
							</div>
						</div>
					</div>
					<div className="col-span-2 md:col-span-1 flex flex-col items-center px-8 py-4 max-w-[95%] min-w-fit bg-neutral-700 rounded-md">
						<h5 className="self-center mb-6 text-xl font-semibold link">
							<a
								href={`https://myanimelist.net/anime/${response?.details?.mal_id}`}
								target="_blank"
								rel='noopener noreferrer'
							>
								MyAnimeList
							</a>
						</h5>
						<h6 className="mb-2 font-semibold text-lg">Genres</h6>
						<span className="mb-2 text-center">
							{!responseGenres || !responseGenres.length && '–'}
							{responseGenres?.map((item, index) => {
								return (
									<Link
										href={`/completed/genres/${item.id}`}
										key={index}
										className="link"
									>
										{item.name}
										<span className="text-white">{index < responseGenres?.length - 1 ? ', ' : null}</span>
									</Link>
								)
							})}
						</span>
						<div className="flex flex-grow items-center mb-6 gap-8">
							<div className="flex flex-col items-center whitespace-nowrap">
								<h6 className="mb-2 font-semibold text-lg">Start</h6>
								<span className="text-center">
									{startDate}
								</span>
							</div>
							<div className="flex flex-col items-center whitespace-nowrap">
								<h6 className="mb-2 font-semibold text-lg">End</h6>
								<span className="text-center">
									{endDate}
								</span>
							</div>
						</div>
					</div>
				</div>
				<EditDialog
					editDialog={editDialog}
					setEditDialog={setEditDialog}
					details={{ id: response?.id ?? -1, title: response?.title ?? '' }}
				/>
			</main>
		</>
	)
}
