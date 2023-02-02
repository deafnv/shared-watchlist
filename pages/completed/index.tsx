import { BaseSyntheticEvent, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../lib/database.types';
import {
	initialTitleItemSupabase,
	sortListByDateSupabase,
	sortListByNameSupabase,
	sortListByRatingSupabase,
	sortSymbol
} from '../../lib/list_methods';
import { loadingGlimmer } from '../../components/LoadingGlimmer';
import { CircularProgress } from '@mui/material';
import { useLoading } from '../../components/LoadingContext';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Image from 'next/image';
import Link from 'next/link';
import Skeleton from '@mui/material/Skeleton';
import { useRouter } from 'next/router';
import EditIcon from '@mui/icons-material/Edit';
import EditModal from '../../components/EditModal';
import SearchIcon from '@mui/icons-material/Search';

//! Non-null assertion for the response state variable here will throw some errors if it does end up being null, fix maybe.
//! ISSUES:
//!   - Fix sort symbol

export default function Completed() {
	const editModalRef = useRef<HTMLDivElement>(null);
	const contextMenuRef = useRef<HTMLDivElement>(null);
	const settingsMenuRef = useRef<HTMLDivElement>(null);
	const settingsMenuButtonRef = useRef<HTMLDivElement>(null);

	const [response, setResponse] =
		useState<Database['public']['Tables']['Completed']['Row'][]>();
	const [response1, setResponse1] =
		useState<Database['public']['Tables']['Completed']['Row'][]>();
	const [sortMethod, setSortMethod] = useState<string>('');
	const [isEdited, setIsEdited] = useState<string>('');
	const [isLoadingClient, setIsLoadingClient] = useState(true);
	const [isLoadingEditForm, setIsLoadingEditForm] = useState<Array<string>>([]);
	const [contextMenu, setContextMenu] = useState<{
		top: number;
		left: number;
		currentItem: Database['public']['Tables']['Completed']['Row'] | null;
	}>({ top: 0, left: 0, currentItem: null });
	const [settingsMenu, setSettingsMenu] = useState<{
		top: number;
		left: number;
		display: string;
	}>({ top: 0, left: 0, display: 'none' });
	const [detailsModal, setDetailsModal] = useState<Database['public']['Tables']['Completed']['Row'] | null>(null);
	const [width, setWidth] = useState<number>(0);
	const { setLoading } = useLoading();

	const router = useRouter();

	const supabase = createClient<Database>(
		'https://esjopxdrlewtpffznsxh.supabase.co',
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	);

	useEffect(() => {
		//FIXME: Don't expose API key to client side
		const supabase = createClient<Database>(
			'https://esjopxdrlewtpffznsxh.supabase.co',
			process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
		);
		const getData = async () => {
			const { data } = await supabase
				.from('Completed')
				.select()
				.order('id', { ascending: true });
			setResponse(data!);
			setResponse1(data!);
			setIsLoadingClient(false);

			await axios
				.get('https://update.ilovesabrina.org:3005/refresh')
				.catch((error) => console.log(error));
		};
		getData();

		const refresh = setInterval(
			() => axios.get('https://update.ilovesabrina.org:3005/refresh'),
			3500000
		);

		const closeMenus = (e: any) => {
			if (e.target?.tagName !== 'INPUT' && isEdited) {
				setIsEdited('');
			}
			if (
				e.target.tagName !== 'svg' &&
				!contextMenuRef.current?.contains(e.target) &&
				contextMenuRef.current
			) {
				setContextMenu({ top: 0, left: 0, currentItem: null });
			}
			if (
				e.target.parentNode !== settingsMenuButtonRef.current &&
				!settingsMenuRef.current?.contains(e.target) &&
				settingsMenuRef.current
			) {
				setSettingsMenu({ top: 0, left: 0, display: 'none' });
			}
		}

		const resetEditNoFocus = () => {
			setIsEdited('');
		}

		const handleWindowResize = () => setWidth(window.innerWidth)
		
		document.addEventListener('click', closeMenus);	
		window.addEventListener('focusout', resetEditNoFocus);
    window.addEventListener("resize", handleWindowResize);

		supabase
			.channel('public:Completed')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'Completed' },
				async (payload) => {
					//FIXME: Create timeout here so it doesn't query DB every change if change occurs too frequently
					const { data } = await supabase
						.from('Completed')
						.select()
						.order('id', { ascending: true });

					//? Meant to provide updates when user is in sort mode, currently non-functional, repeats the sorting 4 to 21 times.
					/* if (sortMethod) {
          if (sortMethod.includes('title')) {
            console.log('title sorted')
            sortListByNameSupabase('title', data!, sortMethod, setSortMethod, setResponse);
          } else if (sortMethod.includes('rating')) {

          } else if (sortMethod.includes('date')) {

          }
        } else setResponse(data!); */
					setResponse(data!);
					setResponse1(data!);
					setSortMethod('');
				}
			)
			.subscribe();

		return () => {
			supabase.removeAllChannels();
			clearInterval(refresh);
			document.removeEventListener('click', closeMenus);
			window.removeEventListener('focusout', resetEditNoFocus);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<Head>
				<title>Cytube Watchlist</title>
				<meta name="description" content="Completed" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="flex flex-col items-center justify-center mb-24 px-1 md:px-0">
				<div className='relative'>
					<h2 className="p-2 text-3xl">
						Completed
						{sortMethod ? (
							<span
								title='Reset sort'
								onClick={() => {
									setResponse(response1);
									setSortMethod('');
								}}
								className="cursor-pointer"
							>
								{' '}
								↻
							</span>
						) : null}
					</h2>
					<div
						ref={settingsMenuButtonRef}
						onClick={handleSettingsMenu}
						className="absolute top-[0.85rem] -right-6 flex items-center justify-center h-7 w-7 cursor-pointer rounded-full hover:bg-gray-500"
					>
						<MoreVertIcon sx={{ fontSize: 28 }} />
					</div>
				</div>
				<div className="flex items-center gap-2">
					<form className='px-3 mb-1 bg-neutral-700 shadow-md shadow-black rounded-md'>
						<SearchIcon />
						<input
							onChange={searchTable}
							type="search"
							placeholder=" Search Titles"
							className="input-text my-2 p-1 w-64 md:w-96 text-lg"
						></input>
					</form>
					<button
						onClick={addRecord}
						title="Add new record to table"
						className="input-submit h-3/5 px-2 py-2 mb-1 text-lg rounded-md"
					>
						<AddIcon fontSize='large' className="-translate-y-[2px]" /> {width > 768 ? 'Add New' : null}
					</button>
				</div>
				<table>
					<tbody>
						<tr>
							<th
								onClick={() =>
									sortListByNameSupabase(
										response,
										sortMethod,
										setSortMethod,
										setResponse
									)
								}
								className="w-[48rem] cursor-pointer"
							>
								<span>Title</span>
								<span className="absolute">
									{sortSymbol('title', sortMethod)}
								</span>
							</th>
							<th className="w-32 hidden md:table-cell">Type</th>
							<th className="w-36 hidden md:table-cell">Episode(s)</th>
							<th
								onClick={() =>
									sortListByRatingSupabase(
										'rating1',
										response,
										sortMethod,
										setSortMethod,
										setResponse
									)
								}
								className="w-32 cursor-pointer"
							>
								<span>GoodTaste</span>
								<span className="absolute">
									{sortSymbol('rating1', sortMethod)}
								</span>
							</th>
							<th
								onClick={() =>
									sortListByRatingSupabase(
										'rating2',
										response,
										sortMethod,
										setSortMethod,
										setResponse
									)
								}
								className="w-32 cursor-pointer"
							>
								<span>TomoLover</span>
								<span className="absolute">
									{sortSymbol('rating2', sortMethod)}
								</span>
							</th>
							<th
								onClick={() =>
									sortListByDateSupabase(
										'startconv',
										response,
										sortMethod,
										setSortMethod,
										setResponse
									)
								}
								className="w-40 cursor-pointer hidden md:table-cell"
							>
								<span>Start Date</span>
								<span className="absolute">
									{sortSymbol('start', sortMethod)}
								</span>
							</th>
							<th
								onClick={() =>
									sortListByDateSupabase(
										'endconv',
										response,
										sortMethod,
										setSortMethod,
										setResponse
									)
								}
								className="w-40 cursor-pointer hidden md:table-cell"
							>
								<span>End Date</span>
								<span className="absolute">
									{sortSymbol('end', sortMethod)}
								</span>
							</th>
						</tr>
						{isLoadingClient
							? loadingGlimmer(7)
							: response
									?.slice()
									.reverse()
									.map((item) => {
										return (
											<tr key={item.id} className="relative group">
												<td
													style={{
														opacity: isLoadingEditForm.includes(`title_${item.id}`) ? 0.5 : 1
													}}
													onDoubleClick={() => {
														setIsEdited(`title${item.id}`);
													}}
													className='relative'
												>
													<span>
														{isEdited == `title${item.id}` ? (
															editForm('title', item.id, item.title!)
														) : item.title ? (
															item.title
														) : (
															<span className="italic text-gray-400">
																Untitled
															</span>
														)}
														<div
															onClick={(e) => {
																handleMenuClick(e, item);
															}}
															className="absolute top-2 z-10 h-7 w-7 invisible group-hover:visible cursor-pointer rounded-full hover:bg-gray-500"
														>
															<MoreVertIcon />
														</div>
													</span>
													{isLoadingEditForm.includes(`title_${item.id}`) && <CircularProgress size={30} className="absolute top-[20%] left-[48%]" />}
												</td>
												<td
													style={{
														opacity: isLoadingEditForm.includes(`type_${item.id}`) ? 0.5 : 1
													}}
													onDoubleClick={() => {
														setIsEdited(`type${item.id}`);
													}}
													className='relative hidden md:table-cell'
												>
													<span>
														{isEdited == `type${item.id}`
															? editForm('type', item.id, item.type ?? '')
															: item.type}
													</span>
													{isLoadingEditForm.includes(`type_${item.id}`) && <CircularProgress size={30} className="absolute top-[20%] left-[40%]" />}
												</td>
												<td
													style={{
														opacity: isLoadingEditForm.includes(`episode_${item.id}`) ? 0.5 : 1
													}}
													onDoubleClick={() => {
														setIsEdited(`episode${item.id}`);
													}}
													className='relative hidden md:table-cell'
												>
													<span>
														{isEdited == `episode${item.id}`
															? editForm('episode', item.id, item.episode ?? '')
															: item.episode}
													</span>
													{isLoadingEditForm.includes(`episode_${item.id}`) && <CircularProgress size={30} className="absolute top-[20%] left-[40%]" />}
												</td>
												<td
													style={{
														opacity: isLoadingEditForm.includes(`rating1_${item.id}`) ? 0.5 : 1
													}}
													onDoubleClick={() => {
														setIsEdited(`rating1${item.id}`);
													}}
													className='relative'
												>
													<span>
														{isEdited == `rating1${item.id}`
															? editForm('rating1', item.id, item.rating1 ?? '')
															: item.rating1}
													</span>
													{isLoadingEditForm.includes(`rating1_${item.id}`) && <CircularProgress size={30} className="absolute top-[20%] left-[40%]" />}
												</td>
												<td
													style={{
														opacity: isLoadingEditForm.includes(`rating2_${item.id}`) ? 0.5 : 1
													}}
													onDoubleClick={() => {
														setIsEdited(`rating2${item.id}`);
													}}
													className='relative'
												>
													<span>
														{isEdited == `rating2${item.id}`
															? editForm('rating2', item.id, item.rating2 ?? '')
															: item.rating2}
													</span>
													{isLoadingEditForm.includes(`rating2_${item.id}`) && <CircularProgress size={30} className="absolute top-[20%] left-[40%]" />}
												</td>
												<td
													style={{
														opacity: isLoadingEditForm.includes(`start_${item.id}`) ? 0.5 : 1
													}}
													onDoubleClick={() => {
														setIsEdited(`start${item.id}`);
													}}
													className='relative hidden md:table-cell'
												>
													<span>
														{isEdited == `start${item.id}`
															? editForm('start', item.id, item.start ?? '')
															: item.start}
													</span>
													{isLoadingEditForm.includes(`start_${item.id}`) && <CircularProgress size={30} className="absolute top-[20%] left-[40%]" />}
												</td>
												<td
													style={{
														opacity: isLoadingEditForm.includes(`end_${item.id}`) ? 0.5 : 1
													}}
													onDoubleClick={() => {
														setIsEdited(`end${item.id}`);
													}}
													className='relative hidden md:table-cell'
												>
													<span>
														{isEdited == `end${item.id}`
															? editForm('end', item.id, item.end ?? '')
															: item.end}
													</span>
													{isLoadingEditForm.includes(`end_${item.id}`) && <CircularProgress size={30} className="absolute top-[20%] left-[40%]" />}
												</td>
											</tr>
										);
									})}
					</tbody>
				</table>
				{contextMenu.currentItem && <ContextMenu />}
				{detailsModal && <DetailsModal />}
				{settingsMenu.display == 'block' && <SettingsMenu />}
        <EditModal editModalRef={editModalRef} detailsModal={detailsModal} setLoading={setLoading} />
			</main>
		</>
	);

	function SettingsMenu() {
		return (
			<menu
				ref={settingsMenuRef}
				style={{
					top: settingsMenu.top,
					left: settingsMenu.left
				}}
				className="absolute z-20 p-2 shadow-md shadow-black bg-black border-pink-400 border-[1px] rounded-md completed-settings-menu"
			>
				<li className="flex justify-center py-2 h-fit rounded-md hover:bg-pink-400">
					<button 
						onClick={handleLoadDetails} 
						className="w-full"
					>
						Load details
					</button>
				</li>
				<li className="flex justify-center py-2 h-fit rounded-md hover:bg-pink-400">
					<Link href={'/completed/errors'} className='px-1 w-full text-center'>See Potential Errors</Link>
				</li>
			</menu>
		);

		async function handleLoadDetails() {
			setLoading(true);
			try {
				await axios.get('/api/completed/loadcompleteddetails');
				setLoading(false);
			} catch (error) {
				setLoading(false);
				alert(error);
			}
		}
	}

	function handleSettingsMenu(e: BaseSyntheticEvent) {
		const { top, left } = e.target.getBoundingClientRect();

		setSettingsMenu({
			top: top + window.scrollY,
			left: left + window.scrollX - 160,
			display: 'block',
		});
	}

	function DetailsModal() {
		const [details, setDetails] = useState<
			Database['public']['Tables']['CompletedDetails']['Row'] | null
		>();
		const [genres, setGenres] =
			useState<Array<{ id: number; name: string | null }>>();
		const [loadingDetails, setLoadingDetails] = useState(true);

		useEffect(() => {
			const getDetails = async () => {
				const { data } = await supabase
					.from('CompletedDetails')
					.select()
					.eq('id', detailsModal?.id);
				const dataGenre = await supabase
					.from('Genres')
					.select('*, Completed!inner( id )')
					.eq('Completed.id', detailsModal?.id);

				const titleGenres = dataGenre.data?.map((item) => {
					return {
						id: item.id,
						name: item.name
					};
				});
				setGenres(titleGenres);
				setDetails(data?.[0]);
				setLoadingDetails(false);
			};
			getDetails();
		}, []);

		async function handleReload() {
			try {
				setLoading(true);
				await axios.get('/api/loadcompleteddetails');
				router.reload();
			} catch (error) {
				setLoading(false);
				alert(error);
			}
		}

		if (
			!loadingDetails &&
			(!details || details.mal_id == -1 || !details.mal_title)
		) {
			return (
				<div className="z-40">
					<div
						onClick={() => setDetailsModal(null)}
						className="fixed top-0 left-0 h-[100dvh] w-[100dvw] glass-modal"
					/>
					<article className="fixed flex flex-col items-center justify-center h-[50rem] w-[60rem] px-10 py-6 bg-gray-700 rounded-md shadow-md shadow-black drop-shadow-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 modal">
						<h3 className="mb-6 font-bold text-2xl">
							Details for this title have not been loaded yet.
						</h3>
						<span onClick={handleReload} className="cursor-pointer link">
							Click here to reload database and view details
						</span>
					</article>
				</div>
			);
		}

		return (
			<div>
				<div
					onClick={() => setDetailsModal(null)}
					className="fixed top-0 left-0 h-[100dvh] w-[100dvw] glass-modal"
				/>
				<article className="fixed flex flex-col items-center h-[50rem] w-[60rem] px-10 py-6 bg-gray-700 rounded-md shadow-md shadow-black drop-shadow-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 modal">
					<Link href={`${location.origin}/completed/anime/${details?.id}`} className="px-12 font-bold text-2xl text-center link">
						{details?.mal_title}
					</Link>
          <div
            onClick={() => editModalRef.current!.style.display = 'block'}
            className='absolute top-8 right-12 flex items-center justify-center h-11 w-11 rounded-full cursor-pointer transition-colors duration-150 hover:bg-slate-500'
          >
            <EditIcon fontSize='large' />
          </div>
					{loadingDetails ? (
						<>
							<Skeleton
								animation="wave"
								variant="rounded"
								width={350}
								height={25}
								className="bg-gray-500"
							/>
							<Skeleton
								animation="wave"
								variant="rounded"
								width={220}
								height={310}
								className="my-5 bg-gray-500"
							/>
							<Skeleton
								animation="wave"
								variant="rounded"
								width={880}
								height={170}
								className="mb-6 bg-gray-500"
							/>
						</>
					) : (
						<>
							<span>{details?.mal_alternative_title}</span>
							<Image
								src={details?.image_url!}
								alt="Art"
								height={380}
								width={220}
								className="my-5"
							/>
							<p
								title={details?.mal_synopsis!}
								className="mb-6 text-center line-clamp-[8]"
							>
								{details?.mal_synopsis}
							</p>
						</>
					)}
					<div className="flex mb-6 gap-16">
						<div className="flex flex-col">
							<h5 className="mb-2 font-semibold text-lg">Start Date</h5>
							<span>{details?.start_date}</span>
						</div>
						<div className="flex flex-col items-center justify-center">
							<h5 className="mb-2 font-semibold text-lg">End Date</h5>
							<span>{details?.end_date}</span>
						</div>
					</div>
					<h5 className="font-semibold text-lg">Genres</h5>
					<span className="mb-2">
						{genres?.map((item, index) => {
							return (
								<Link
									href={`${location.origin}/completed/genres/${item.id}`}
									key={index}
									className="link"
								>
									{item.name}
									<span className="text-white">
										{index < genres.length - 1 ? ', ' : null}
									</span>
								</Link>
							);
						})}
					</span>
					<Link
						href={
							`https://myanimelist.net/anime/${details?.mal_id}` ??
							'https://via.placeholder.com/400x566'
						}
						target="_blank"
						className="text-lg link"
					>
						MyAnimeList
					</Link>
				</article>
			</div>
		);
	}

	function ContextMenu() {
		return (
			<menu
				ref={contextMenuRef}
				style={{
					top: contextMenu.top,
					left: contextMenu.left
				}}
				className="absolute z-10 p-2 shadow-md shadow-gray-600 bg-slate-200 text-black rounded-sm border-black border-solid border-2 context-menu"
			>
				<li className="flex justify-center">
					<span className="text-center font-semibold line-clamp-2">
						{contextMenu.currentItem?.title}
					</span>
				</li>
				<hr className="my-2 border-gray-500 border-t-[1px]" />
				<li className="flex justify-center h-8 rounded-sm hover:bg-slate-500">
					<button onClick={handleDetails} className="w-full">
						Details
					</button>
				</li>
				<li className="flex justify-center h-8 rounded-sm hover:bg-slate-500">
					<button onClick={handleVisit} className="w-full">
						Visit on MAL
					</button>
				</li>
			</menu>
		);

		function handleDetails() {
			setDetailsModal(contextMenu.currentItem);
			setContextMenu({...contextMenu, currentItem: null});
		}

		async function handleVisit() {
			const malURL = await supabase
				.from('CompletedDetails')
				.select('mal_id')
				.eq('id', contextMenu.currentItem?.id);
			window.open(
				`https://myanimelist.net/anime/${malURL.data?.[0]?.mal_id}`,
				'_blank'
			);
		}
	}

	function handleMenuClick(
		e: BaseSyntheticEvent,
		item: Database['public']['Tables']['Completed']['Row']
	) {
		const { top, left } = e.target.getBoundingClientRect();

		setContextMenu({
			top: top + window.scrollY,
			left: left + window.scrollX + 25,
			currentItem: item
		});
	}

	function searchTable(e: BaseSyntheticEvent) {
		if (e.target.value == '') {
			setResponse(response1);
			setSortMethod('');
		}
		if (!response || !response1) return;

		setResponse(
			response1
				.slice()
				.filter((item) =>
					item.title?.toLowerCase().includes(e.target.value.toLowerCase())
				)
		);
	}

	//TODO: Detect pressing tab so it jumps to the next field to be edited
	function editForm(
		field:
			| 'title'
			| 'type'
			| 'episode'
			| 'rating1'
			| 'rating2'
			| 'start'
			| 'end',
		id: number,
		ogvalue: string
	): React.ReactNode {
		let column: string;
		let row = (id + 1).toString();
		switch (field) {
			case 'title':
				column = 'B';
				break;
			case 'type':
				column = 'C';
				break;
			case 'episode':
				column = 'D';
				break;
			case 'rating1':
				column = 'E';
				break;
			case 'rating2':
				column = 'F';
				break;
			case 'start':
				column = 'H';
				break;
			case 'end':
				column = 'I';
				break;
			default:
				alert('Error: missing field');
				return;
		}

		async function handleSubmit(event: BaseSyntheticEvent): Promise<void> {
			event.preventDefault();
			setIsLoadingEditForm(isLoadingEditForm.concat(`${field}_${id}`));

			try {
				await axios.post('/api/update', {
					content: event.target[0].value,
					cell: column + row
				});

				const changed = response?.slice();
				if (!changed) return;
				changed.find((item) => item.id === id)![field] = event.target[0].value;
				setResponse(changed);
				setIsEdited('');
				setIsLoadingEditForm(isLoadingEditForm.filter(item => item == `${field}_${id}`));
			} catch (error) {
				setIsLoadingEditForm(isLoadingEditForm.filter(item => item == `${field}_${id}`));
				alert(error);
				return;
			}
		}

		return (
			<div className="flex items-center justify-center relative w-full">
				<div
					style={{
						opacity: isLoadingEditForm.includes(`${field}_${id}`) ? 0.5 : 1,
						pointerEvents: isLoadingEditForm.includes(`${field}_${id}`) ? 'none' : 'unset'
					}}
					className="w-full"
				>
					<form onSubmit={handleSubmit}>
						<input
							autoFocus
							type="text"
							defaultValue={ogvalue}
							className="input-text text-center w-full"
						/>
					</form>
				</div>
			</div>
		);
	}

	// TODO: add loading here to prevent spamming add record
	async function addRecord(
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>
	): Promise<void> {
		if (!response?.[response.length - 1].title) {
			alert('Insert title for latest row before adding a new one');
			return;
		}

		setLoading(true);
		try {
			await axios.post('/api/update', {
				content: (response.length + 1).toString(),
				cell: 'A' + (response.length + 2).toString()
			});

			const changed = response.slice();
			changed.push({ ...initialTitleItemSupabase, id: response.length + 1 });
			setResponse(changed);
			setIsEdited(`title${response.length + 1}`);
			setLoading(false);
		} catch (error) {
			setLoading(false);
			alert(error);
			return;
		}
	}
}
