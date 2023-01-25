import { createClient } from '@supabase/supabase-js';
import { GetStaticPropsContext } from 'next';
import { Database } from '../../../lib/database.types';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export async function getStaticPaths() {
	const supabase = createClient<Database>(
		'https://esjopxdrlewtpffznsxh.supabase.co',
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	);
	const { data } = await supabase.from('Genres').select().order('id');

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

export default function GenrePage({ id }: { id: number }) {
	const [response, setResponse] = useState<
		| ({ id: number } & { title: string | null } & {
				Genres: { name: string | null } | { name: string | null }[] | null;
		  })[]
		| null
	>();

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
          id,
          title,
          Genres!inner (
            name
          )
        `
				)
				.eq('Genres.id', id);

			setResponse(data!);
		};
		getData();
	}, []);

	if (!response?.[0]) {
		return (
			<>
				<Head>
					<title>Cytube Watchlist</title>
					<meta
						name="description"
						content={`${
							(response?.[0]?.Genres as { name: string | null }[])?.[0].name
						} animes in Completed`}
					/>
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<link rel="icon" href="/favicon.ico" />
				</Head>

				<main className="flex flex-col items-center justify-center gap-3 mx-auto h-[90dvh] md:w-3/5 sm:w-full">
					<h2 className="p-2 text-3xl">No results found</h2>
				</main>
			</>
		);
	}

	return (
		<>
			<Head>
				<title>Cytube Watchlist</title>
				<meta
					name="description"
					content={`${
						(response?.[0]?.Genres as { name: string | null }[])?.[0].name
					} animes in Completed`}
				/>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="flex flex-col items-center justify-center gap-3 mx-auto md:w-3/5 sm:w-full">
				<h2 className="p-2 text-3xl">
					{(response?.[0]?.Genres as { name: string | null }[])?.[0].name}
				</h2>
				<ul className="flex flex-col gap-2 h-[80dvh] overflow-auto border-[1px] border-white">
					{response?.map((item, index) => {
						return (
							<li
								key={index}
								className="p-0 text-center rounded-md transition-colors duration-75 hover:bg-slate-500"
							>
								<Link
									href={`${location.origin}/completed/anime/${item.id}`}
									className="inline-block px-5 py-3 h-full w-full"
								>
									{item.title}
								</Link>
							</li>
						);
					})}
				</ul>
			</main>
		</>
	);
}
