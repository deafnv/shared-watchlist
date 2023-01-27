import { createClient } from '@supabase/supabase-js';
import { GetStaticPropsContext } from 'next';
import { Database } from '../../../lib/database.types';
import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import EditModal from '../../../components/EditModal';
import { useLoading } from '../../../components/LoadingContext';

export async function getStaticPaths() {
	const supabase = createClient<Database>(
		'https://esjopxdrlewtpffznsxh.supabase.co',
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	);
	const { data } = await supabase.from('Completed').select().order('id');

	const paths = data?.map((item) => ({
		params: { id: item.id.toString() }
	}));

	return {
		paths,
		fallback: true
	};
}

export function getStaticProps(context: GetStaticPropsContext) {
	return {
		props: {
			id: context.params?.id
		},
		revalidate: 360
	};
}

export default function CompletedPage({ id }: { id: number }) {
	const editModalRef = useRef<HTMLDivElement>(null);

	const [response, setResponse] = useState<any>();
	const { setLoading } = useLoading();

	useEffect(() => {
		const supabase = createClient<Database>(
			'https://esjopxdrlewtpffznsxh.supabase.co',
			process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
		);
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
				.eq('id', id);

			setResponse(data!);
			console.log(data);
		};
		getData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<Head>
				<title>Cytube Watchlist</title>
				<meta name="description" content={response?.[0].title} />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="flex flex-col items-center justify-center mx-auto mb-16 px-12 py-6 md:w-3/5 sm:w-full">
				<h3 className="p-2 text-2xl font-semibold text-center">
					{response?.[0].title}
				</h3>
				<div
					onClick={() => editModalRef.current!.style.display = 'block'}
					className='absolute top-24 right-96 flex items-center justify-center h-11 w-11 rounded-full cursor-pointer transition-colors duration-150 hover:bg-slate-500'
				>
					<EditIcon fontSize='large' />
				</div>
				<h5 className="text-lg text-center">
					{response?.[0].CompletedDetails.mal_alternative_title}
				</h5>
				<Image
					src={response?.[0].CompletedDetails.image_url}
					height={380}
					width={280}
					alt="Art"
					className="my-4"
				/>
				<p className="mb-8 text-center">
					{response?.[0].CompletedDetails.mal_synopsis}
				</p>
				<div className="flex gap-16">
					<div className="flex flex-col px-8 py-4 border-[1px] border-white">
						<h5 className="self-center mb-4 text-xl font-semibold">Ratings</h5>
						<table className="mb-8">
							<tbody>
								<tr>
									<th>GoodTaste</th>
									<th>TomoLover</th>
									<th>TTAHHP(?)</th>
								</tr>
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
								<span>{response?.[0].start}</span>
							</div>
							<div className="flex flex-col items-center">
								<h6 className="mb-2 font-semibold text-lg">End</h6>
								<span>{response?.[0].end}</span>
							</div>
						</div>
					</div>
					<div className="flex flex-col px-8 py-4 border-[1px] border-white">
						<h5 className="self-center mb-4 text-xl font-semibold link">
							<Link
								href={`https://myanimelist.net/anime/${response?.[0].CompletedDetails.mal_id}`}
								target="_blank"
							>
								MyAnimeList
							</Link>
						</h5>
						<div className="flex flex-grow items-center mb-6 gap-16">
							<div className="flex flex-col items-center whitespace-nowrap">
								<h6 className="mb-2 font-semibold text-lg">Start</h6>
								<span>
									{new Date(
										response?.[0].CompletedDetails.start_date
									).toLocaleDateString('en-US', {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									})}
								</span>
							</div>
							<div className="flex flex-col items-center whitespace-nowrap">
								<h6 className="mb-2 font-semibold text-lg">End</h6>
								<span>
									{new Date(
										response?.[0].CompletedDetails.end_date
									).toLocaleDateString('en-US', {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									})}
								</span>
							</div>
						</div>
					</div>
				</div>
				<EditModal editModalRef={editModalRef} detailsModal={response?.[0]} setLoading={setLoading} isInMainPage />
			</main>
		</>
	);
}
