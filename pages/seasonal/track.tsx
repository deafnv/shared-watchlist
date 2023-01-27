import { createClient } from '@supabase/supabase-js';
import { GetStaticPropsContext } from 'next';
import { Database } from '../../lib/database.types';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useLoading } from '../../components/LoadingContext';
import { BaseSyntheticEvent, useState } from 'react';

export const getStaticProps = async (context: GetStaticPropsContext) => {
	const supabase = createClient<Database>(
		'https://esjopxdrlewtpffznsxh.supabase.co',
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	);
	const { data } = await supabase
		.from('SeasonalDetails')
		.select()
		.order('start_date', { ascending: true });

	return {
		props: {
			res: data
		}
	};
};

export default function SeasonalDetails({
	res
}: {
	res: Database['public']['Tables']['SeasonalDetails']['Row'][];
}) {
	const [response, setResponse] = useState(res);
	const [validateArea, setValidateArea] = useState('');
	const router = useRouter();
	const { setLoading } = useLoading();

	const supabase = createClient<Database>(
		'https://esjopxdrlewtpffznsxh.supabase.co',
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	);

	return (
		<>
			<Head>
				<title>Cytube Watchlist</title>
				<meta name="description" content="Seasonal Details" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="flex flex-col items-center justify-center p-6">
				<div className="absolute top-20 left-8 flex gap-2">
					<button
						onClick={refresh}
						title="Refresh episode tracking"
						className="input-submit px-2 p-1"
					>
						Refresh
					</button>
					<button
						onClick={reload}
						title="Reload current season data from sheet"
						className="input-submit px-2 p-1"
					>
						Reload
					</button>
				</div>
				<h2 className="mb-6 text-3xl">Seasonal Details</h2>
				<div className="grid grid-cols-4 gap-6">
					{response.map((item) => {
						return (
							<article
								key={item.mal_id}
								className="flex flex-col gap-2 p-3 bg-slate-700 shadow-md shadow-gray-700 rounded-md"
							>
								<span
									onClick={showTitle}
									className="h-[3rem] font-bold self-center text-center line-clamp-2"
								>
									{item.title}
								</span>
								<div className="flex">
									<Image
										src={
											item.image_url ?? 'https://via.placeholder.com/400x566'
										}
										alt="Art"
										height={200}
										width={150}
									/>
									<div className="flex flex-col items-center justify-center w-full">
										<span>
											<span className="font-semibold">Start Date: </span>
											{item.start_date ? item.start_date : 'Unknown'}
										</span>
										<span style={{ textTransform: 'capitalize' }}>
											<span className="font-semibold">Broadcast: </span>
											{item.broadcast ?? 'Unknown'}
										</span>
										<span>
											<span className="font-semibold">Episodes: </span>
											{item.num_episodes ? item.num_episodes : 'Unknown'}
										</span>
										<Link
											href={`https://myanimelist.net/anime/${item.mal_id}`}
											target="_blank"
											className="link"
										>
											MyAnimeList
										</Link>
									</div>
								</div>
								<div>
									<div className="w-full m-2 flex items-center justify-center">
										<span className="text-lg font-semibold">Episodes</span>
									</div>
									<EpisodeTable item={item} />
								</div>
							</article>
						);
					})}
				</div>
			</main>
		</>
	);

	function showTitle(e: BaseSyntheticEvent) {
		const target = e.target as HTMLSpanElement;
		target.style.webkitLineClamp = '100';
		target.style.overflow = 'auto';
	}

	async function refresh() {
		try {
			setLoading(true);
			await axios.get('/api/seasonaldetails/loadtracker');
			await axios.get('/api/seasonaldetails/revalidate');
			router.reload();
		} catch (error) {
			setLoading(false);
			alert(error);
		}
	}

	async function reload() {
		try {
			setLoading(true);
			await axios.get('/api/seasonaldetails/refreshseasonal');
			await axios.get('/api/seasonaldetails/revalidate');
			router.reload();
		} catch (error) {
			setLoading(false);
			alert(error);
		}
	}

	function EpisodeTable({
		item
	}: {
		item: Database['public']['Tables']['SeasonalDetails']['Row'];
	}) {
		let cutoff = 0;
		let cutoff1 = -3;
		return (
			<div className="relative grid grid-cols-2 gap-4">
				{Array(4)
					.fill('')
					.map((item1, index) => {
						cutoff = cutoff + 3;
						cutoff1 = cutoff1 + 3;
						return (
							<table key={index}>
								<tbody>
									<tr>
										{Array(12)
											.fill('')
											.map((item1, index1) => {
												if (index1 < cutoff && index1 >= cutoff1)
													return (
														<th className="w-11" key={index1}>
															{item.latest_episode! > 12
																? index1 + 13
																: index1 + 1}
														</th>
													);
											})}
									</tr>
									<tr>
										{Array(12)
											.fill('')
											.map((item1, index1) => {
												if (index1 < cutoff && index1 >= cutoff1)
													return (
														<td
															style={{
																background: determineEpisode(
																	item.latest_episode!,
																	index1
																)
															}}
															className="p-6"
															key={index1}
														></td>
													);
											})}
									</tr>
								</tbody>
							</table>
						);
					})}
				<Validate item1={item} />
			</div>
		);

		function determineEpisode(latestEpisode: number, index: number) {
			const accountFor2Cour =
				latestEpisode > 12 ? latestEpisode - 12 : latestEpisode;
			if (accountFor2Cour > index) {
				//* Not sure why this isn't index + 1
				return 'red';
			} else return 'black';
		}
	}

	function Validate({
		item1
	}: {
		item1: Database['public']['Tables']['SeasonalDetails']['Row'];
	}) {
		async function handleChange(e: BaseSyntheticEvent) {
			e.preventDefault();
			setLoading(true);

			const linkInput = e.target[0].value;
			if (
				!linkInput.match(
					/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi
				)
			) {
				setLoading(false);
				return alert('Enter a valid link');
			}

			const url = new URL(linkInput);
			if (url.hostname != 'myanimelist.net') {
				setLoading(false);
				return alert('Enter a link from myanimelist.net');
			}

			const idInput = parseInt(url.pathname.split('/')[2]);
			if (!idInput) {
				setLoading(false);
				return alert('ID not found. Enter a valid link');
			}

			try {
				await axios.post('/api/seasonaldetails/changevalidated', {
					id: item1.id,
					mal_id: idInput
				});
				await axios.get('/api/seasonaldetails/revalidate');
				router.reload();
			} catch (error) {
				setLoading(false);
				alert(error);
			}
		}

		async function handleIgnore() {
			try {
				setLoading(true);
				await supabase
					.from('SeasonalDetails')
					.update({ message: '' })
					.eq('mal_id', item1.mal_id);

				await axios.get('/api/seasonaldetails/revalidate');

				const changed = response.slice();
				changed.find((item) => item.id === item1.id)!['message'] = '';
				setResponse(changed);
				setLoading(false);
			} catch (error) {
				setLoading(false);
				alert(error);
			}
		}

		function validateForm() {
			switch (validateArea) {
				case `${item1.mal_id}_change`:
					return (
						<div className="absolute top-[-35px] left-[-10px] h-[125%] w-[105%] flex flex-col justify-center items-center gap-2 glass">
							<span className="text-center text-lg">Enter correct link: </span>
							<Link
								href={item1.message?.split('Validate:')[1] ?? ''}
								target="_blank"
								className="link mb-4 col-span-2 text-center"
							>
								Search on MAL
							</Link>
							<form
								onSubmit={handleChange}
								className="col-span-2 grid grid-cols-2 gap-2"
							>
								<input
									autoFocus
									type="text"
									className="col-span-2 input-text text-center"
								></input>
								<button
									type="submit"
									className="input-submit w-min mx-auto px-2 p-1"
								>
									Update
								</button>
								<button
									onClick={() => setValidateArea('')}
									type="reset"
									className="input-submit w-min mx-auto px-2 p-1"
								>
									Cancel
								</button>
							</form>
						</div>
					);
				case `${item1.mal_id}_ignore`:
					return (
						<div className="absolute top-[-35px] left-[-10px] h-[125%] w-[105%] flex flex-col justify-center items-center gap-2 glass">
							<span className="text-red-500 text-lg">⚠ Are you sure?</span>
							<div className="flex gap-4">
								<button
									onClick={handleIgnore}
									className="input-submit px-2 p-1"
								>
									Yes
								</button>
								<button
									onClick={() => setValidateArea('')}
									className="input-submit px-2 p-1 bg-rose-600 hover:bg-rose"
								>
									No
								</button>
							</div>
						</div>
					);
				default:
					return (
						<div className="absolute top-[-35px] left-[-10px] h-[125%] w-[105%] flex flex-col justify-center items-center gap-2 glass">
							<span className="text-red-500 text-lg">
								⚠ This entry appears to be wrong
							</span>
							<div className="flex gap-4">
								<button
									onClick={() => setValidateArea(`${item1.mal_id}_change`)}
									className="input-submit px-2 p-1"
								>
									Change
								</button>
								<button
									onClick={() => setValidateArea(`${item1.mal_id}_ignore`)}
									className="input-submit px-2 p-1 bg-rose-600 hover:bg-rose"
								>
									Ignore
								</button>
							</div>
						</div>
					);
			}
		}

		return item1.message?.includes('Validate') ? validateForm() : null;
	}
}
