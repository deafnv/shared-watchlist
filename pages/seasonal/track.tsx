import { createClient } from '@supabase/supabase-js';
import { GetStaticPropsContext } from 'next';
import { Database } from '../../lib/database.types';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useLoading } from '../../components/LoadingContext';
import { BaseSyntheticEvent, useEffect, useState, useRef } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';

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
	const editEpisodesCurrentRef = useRef<HTMLDivElement>(null);
	const contextMenuRef = useRef<HTMLDivElement>(null);
	const refreshReloadMenuRef = useRef<HTMLDivElement>(null);
	const refreshReloadMenuButtonRef = useRef<HTMLDivElement>(null);

	const [response, setResponse] = useState(res);
	const [validateArea, setValidateArea] = useState('');
	const [editEpisodesCurrent, setEditEpisodesCurrent] = useState<Database['public']['Tables']['SeasonalDetails']['Row'] | null>(null);
	const [contextMenu, setContextMenu] = useState<{
		top: number;
		left: number;
		currentItem: Database['public']['Tables']['SeasonalDetails']['Row'] | null;
	}>({ top: 0, left: 0, currentItem: null });
	const [refreshReloadMenu, setRefreshReloadMenu] = useState<{
		top: number;
		left: number;
		display: string;
	}>({ top: 0, left: 0, display: 'none' });

	const router = useRouter(); 
	const { setLoading } = useLoading();

	const supabase = createClient<Database>(
		'https://esjopxdrlewtpffznsxh.supabase.co',
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	); 

	useEffect(() => {
		const closeEditModal = (e: KeyboardEvent) => {
			if (e.key == 'Escape' && editEpisodesCurrentRef.current) setEditEpisodesCurrent(null);
		}
		
		const closeMenus = (e: any) => {
			if (
				e.target.tagName !== 'svg' &&
				!contextMenuRef.current?.contains(e.target) &&
				contextMenuRef.current
			) {
				setContextMenu({ top: 0, left: 0, currentItem: null });
			}
			if (
				e.target.parentNode !== refreshReloadMenuButtonRef.current &&
				!refreshReloadMenuRef.current?.contains(e.target) &&
				refreshReloadMenuRef.current
			) {
				setRefreshReloadMenu({ top: 0, left: 0, display: 'none' });
			}
		}

		document.addEventListener('keydown', closeEditModal);
		document.addEventListener('click', closeMenus);

		return () => {
			document.removeEventListener('keydown', closeEditModal);
			document.removeEventListener('click', closeMenus);
		}
	}, [])

	return (
		<>
			<Head>
				<title>Cytube Watchlist</title>
				<meta name="description" content="Seasonal Details" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="flex flex-col items-center justify-center p-6">
				<div className='relative'>
					<h2 className="mb-6 text-3xl">Seasonal Details</h2>
					<div
						ref={refreshReloadMenuButtonRef}
						onClick={handleRefreshReloadMenu}
						className="absolute top-[0.3rem] -right-10 z-10 flex items-center justify-center h-7 w-7 cursor-pointer rounded-full hover:bg-gray-500"
					>
						<MoreVertIcon sx={{ fontSize: 28 }} />
					</div>
				</div>
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
					{response.map((item) => {
						return (
							<article
								key={item.mal_id}
								className="relative flex flex-col gap-2 p-3 bg-slate-700 shadow-md shadow-black rounded-md group"
							>
								<span
									onClick={showTitle}
									className="h-[3rem] px-7 font-bold self-center text-center line-clamp-2"
								>
									{item.title}
								</span>
								<div
									onClick={(e) => {
										handleMenuClick(e, item);
									}}
									className="absolute top-3 right-3 z-10 flex items-center justify-center h-7 w-7 invisible group-hover:visible cursor-pointer rounded-full hover:bg-gray-500"
								>
									<MoreVertIcon />
								</div>
								<div className="flex">
									<Image
										src={
											item.image_url ?? 'https://via.placeholder.com/400x566'
										}
										alt="Art"
										height={200}
										width={150}
									/>
									<div className="flex flex-col items-center gap-1 justify-center w-full">
										<span className='text-center'>
											<span className="font-semibold">Episodes: </span>
											{item.num_episodes ? item.num_episodes : 'Unknown'}
										</span>
										<span style={{ textTransform: 'capitalize' }} className='text-center'>
											<span className="font-semibold">Status: </span>
											{item.status?.split('_').join(' ')}
										</span>
										<span className='text-center'>
											<span className="font-semibold">Start Date: </span>
											{item.start_date ? item.start_date : 'Unknown'}
										</span>
										<span style={{ textTransform: 'capitalize' }} className='text-center'>
											<span className="font-semibold">Broadcast: </span>
											{item.broadcast ?? 'Unknown'}
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
									<div className="relative w-full m-2 flex items-center justify-center">
										<span className="text-lg font-semibold">Episodes</span>
										{item.message?.includes('Exempt') && <span className='ml-2 text-lg font-semibold'>(Edited)</span>}
										<div
											onClick={() => setEditEpisodesCurrent(item)}
											className='absolute right-4 flex items-center justify-center h-6 w-6 rounded-full cursor-pointer transition-colors duration-150 invisible group-hover:visible hover:bg-slate-500'
										>
											<EditIcon fontSize='small' className='text-slate-500 hover:text-white' />
										</div>
									</div>
									<EpisodeTable item={item} />
								</div>
							</article>
						);
					})}
				</div>
				{editEpisodesCurrent && <EditEpisodes />}
				{contextMenu.currentItem && <ContextMenu />}
				{refreshReloadMenu.display == 'block' && <RefreshReloadMenu />}
			</main>
		</>
	);

	function RefreshReloadMenu() {
		return (
			<menu
				ref={refreshReloadMenuRef}
				style={{
					top: refreshReloadMenu.top,
					left: refreshReloadMenu.left
				}}
				className="absolute z-20 p-2 shadow-md shadow-black bg-black border-pink-400 border-[1px] rounded-md refresh-reload-menu"
			>
				<li className="flex justify-center py-2 h-fit rounded-md hover:bg-pink-400">
					<button 
						onClick={refresh} 
						className="w-full"
					>
						Refresh episode tracking
					</button>
				</li>
				<li className="flex justify-center py-2 h-fit rounded-md hover:bg-pink-400">
					<button 
						onClick={reload} 
						className="w-full"
					>
						Reload current season data from sheet
					</button>
				</li>
			</menu>
		);
	}

	function handleRefreshReloadMenu(e: BaseSyntheticEvent) {
		const { top, left } = e.target.getBoundingClientRect();

		setRefreshReloadMenu({
			top: top + window.scrollY,
			left: left + window.scrollX - 240,
			display: 'block',
		});
	}

	function ContextMenu() {
		return (
			<menu
				ref={contextMenuRef}
				style={{
					top: contextMenu.top,
					left: contextMenu.left
				}}
				className="absolute z-20 p-2 shadow-md shadow-gray-600 bg-slate-200 text-black rounded-sm border-black border-solid border-2 context-menu"
			>
				<li className="flex justify-center">
					<span className="text-center font-semibold line-clamp-2">
						{contextMenu.currentItem?.title}
					</span>
				</li>
				<hr className="my-2 border-gray-500 border-t-[1px]" />
				<li className="flex justify-center h-8 rounded-sm hover:bg-slate-500">
					<button  className="w-full">
						Details
					</button>
				</li>
				<li className="flex justify-center h-8 rounded-sm hover:bg-slate-500">
					<button  className="w-full">
						Visit on MAL
					</button>
				</li>
			</menu>
		);
	}

	function handleMenuClick(
		e: BaseSyntheticEvent,
		item: Database['public']['Tables']['SeasonalDetails']['Row']
	) {
		const { top, left } = e.target.getBoundingClientRect();

		setContextMenu({
			...contextMenu,
			top: top + window.scrollY,
			left: left + window.scrollX - 240,
			currentItem: item
		});
	}

	function EditEpisodes() {
		async function handleEditSubmit(e: BaseSyntheticEvent) {
			e.preventDefault();
			setLoading(true);
			const editLatestEpisode = parseInt(e.target[0].value);
			try {
				await axios.post('/api/updatedb', {
					content: { latest_episode: editLatestEpisode, message: 'Exempt:Manual Edit' },
					table: 'SeasonalDetails',
					id: editEpisodesCurrent?.mal_id,
					compare: 'mal_id'
				});
				router.reload();
			} 
			catch (error) {
				setLoading(false);
				alert(error);
			}
		}

		let counter = 1;
		return (
			<div ref={editEpisodesCurrentRef}>
				<div className="fixed top-0 left-0 h-[100dvh] w-[100dvw] bg-black opacity-30 modal-background" />
				<div className="fixed flex flex-col items-center gap-6 h-[30rem] w-[50rem] px-10 py-6 bg-gray-700 rounded-md shadow-md shadow-black drop-shadow-md border-4 border-black top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 modal">
					<h3 className="font-bold text-2xl">
						Manual Edit Episodes
					</h3>
					<div
						onClick={() => setEditEpisodesCurrent(null)}
						className="absolute right-6 flex items-center justify-center h-11 w-11 rounded-full cursor-pointer transition-colors duration-150 hover:bg-slate-500"
					>
						<CloseIcon fontSize="large" />
					</div>
					<span>{editEpisodesCurrent?.title}</span>
					<form onSubmit={handleEditSubmit}>
						<label className='flex flex-col items-center gap-2'>
							Enter latest episode:
							<input type='number' min={-1} max={9999} className='text-center input-text' />
						</label>
					</form>
					<div className="relative grid grid-cols-2 gap-4">
						{Array(4).fill('').map((i, index) => {
							return (
								<table key={index}>
									<tbody>
										<tr>
											<th className='w-11'>{editEpisodesCurrent?.latest_episode! > 12 ? counter++ + 12 : counter++}</th>
											<th className='w-11'>{editEpisodesCurrent?.latest_episode! > 12 ? counter++ + 12 : counter++}</th>
											<th className='w-11'>{editEpisodesCurrent?.latest_episode! > 12 ? counter++ + 12 : counter++}</th>
										</tr>
										<tr>
											<td style={{ background: determineEpisode(editEpisodesCurrent?.latest_episode!, (counter - 3)) }} className="p-6" />
											<td style={{ background: determineEpisode(editEpisodesCurrent?.latest_episode!, (counter - 2)) }} className="p-6" />
											<td style={{ background: determineEpisode(editEpisodesCurrent?.latest_episode!, (counter - 1)) }} className="p-6" />
										</tr>
									</tbody>
								</table>
							)
					})}
					</div>
				</div>
			</div>
		)
	}

	function showTitle(e: BaseSyntheticEvent) {
		const target = e.target as HTMLSpanElement;
		target.style.webkitLineClamp = '100';
		target.style.overflow = 'auto';
	}

	async function refresh() {
		try {
			setLoading(true);
			await axios.get('/api/seasonaldetails/loadtracker');
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
		let counter = 1;
		return (
			<div className="relative grid grid-cols-2 gap-4">
				{Array(4).fill('').map((i, index) => {
					return (
						<table key={index}>
							<tbody>
								<tr>
									<th className='w-11'>{item.latest_episode! > 12 ? counter++ + 12 : counter++}</th>
									<th className='w-11'>{item.latest_episode! > 12 ? counter++ + 12 : counter++}</th>
									<th className='w-11'>{item.latest_episode! > 12 ? counter++ + 12 : counter++}</th>
								</tr>
								<tr>
									<td style={{ background: determineEpisode(item.latest_episode!, (counter - 3)) }} className="p-6" />
									<td style={{ background: determineEpisode(item.latest_episode!, (counter - 2)) }} className="p-6" />
									<td style={{ background: determineEpisode(item.latest_episode!, (counter - 1)) }} className="p-6" />
								</tr>
							</tbody>
						</table>
					)
				})}
				<Validate item1={item} />
			</div>
		);
	}

	function determineEpisode(latestEpisode: number, index: number) {
		const accountFor2Cour = latestEpisode > 12 ? latestEpisode - 12 : latestEpisode;
		if (accountFor2Cour >= index) {
			return 'red';
		} else return 'black';
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
				router.reload();
			} catch (error) {
				setLoading(false);
				alert(error);
			}
		}

		async function handleIgnore() {
			try {
				setLoading(true);
				await axios.post('/api/updatedb', {
					content: { message: '' },
					table: 'SeasonalDetails',
					id: item1.mal_id,
					compare: 'mal_id'
				});

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
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] h-[125%] w-[105%] flex flex-col justify-center items-center gap-2 glass">
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
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] h-[125%] w-[105%] flex flex-col justify-center items-center gap-2 glass">
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
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] h-[125%] w-[105%] flex flex-col justify-center items-center gap-2 glass">
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

		return item1.message?.includes('Validate:') ? validateForm() : null;
	}
}
