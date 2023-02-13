import { BaseSyntheticEvent, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../../lib/database.types'
import {
	initialTitleItemSupabase,
	sortListByDateSupabase,
	sortListByEpisodeSupabase,
	sortListByNameSupabase,
	sortListByRatingSupabase,
	sortListByTypeSupabase,
	sortSymbol
} from '../../lib/list_methods'
import { loadingGlimmer } from '../../components/LoadingGlimmer'
import { CircularProgress } from '@mui/material'
import { useLoading } from '../../components/LoadingContext'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import Image from 'next/image'
import Link from 'next/link'
import Skeleton from '@mui/material/Skeleton'
import { useRouter } from 'next/router'
import EditIcon from '@mui/icons-material/Edit'
import EditModal from '../../components/EditModal'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh';

//! Non-null assertion for the response state variable here will throw some errors if it does end up being null, fix maybe.
//! ISSUES:
//!   - Fix sort symbol

export default function Completed() {
	const editModalRef = useRef<HTMLDivElement>(null)
	const contextMenuRef = useRef<HTMLDivElement>(null)
	const contextMenuButtonRef = useRef<any>([])
	const settingsMenuRef = useRef<HTMLDivElement>(null)
	const settingsMenuButtonRef = useRef<HTMLDivElement>(null)
	const sortMethodRef = useRef('')
	const isEditedRef = useRef('')
	const detailsModalRef = useRef<Database['public']['Tables']['Completed']['Row'] | null>(null)

	const [response, setResponse] = useState<Database['public']['Tables']['Completed']['Row'][]>()
	const [response1, setResponse1] = useState<Database['public']['Tables']['Completed']['Row'][]>()
	const [isEdited, setIsEditedState] = useState<string>('')
	const [isLoadingClient, setIsLoadingClient] = useState(true)
	const [isLoadingEditForm, setIsLoadingEditForm] = useState<Array<string>>([])
	const [contextMenu, setContextMenu] = useState<{
		top: number
		left: number
		currentItem: Database['public']['Tables']['Completed']['Row'] | null
	}>({ top: 0, left: 0, currentItem: null })
	const [settingsMenu, setSettingsMenu] = useState<{
		top: number
		left: number
		display: string
	}>({ top: 0, left: 0, display: 'none' })
	const [detailsModal, setDetailsModalState] = useState<
		Database['public']['Tables']['Completed']['Row'] | null
	>(null)
	const { setLoading } = useLoading()

	const router = useRouter()

	const setIsEdited = (value: string) => {
		isEditedRef.current = value
		setIsEditedState(value)
	}

	const setDetailsModal = (value: Database['public']['Tables']['Completed']['Row'] | null) => {
		detailsModalRef.current = value
		setDetailsModalState(value)
	}

	const supabase = createClient<Database>(
		'https://esjopxdrlewtpffznsxh.supabase.co',
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	)

	useEffect(() => {
		//FIXME: Don't expose API key to client side (currently exposing read-only key)
		const supabase = createClient<Database>(
			'https://esjopxdrlewtpffznsxh.supabase.co',
			process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
		)
		const getData = async () => {
			const { data } = await supabase.from('Completed').select().order('id', { ascending: false })
			setResponse(data!)
			setResponse1(data!)
			setIsLoadingClient(false)

			await axios
				.get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/refresh`)
				.catch((error) => console.log(error))
		}
		getData()

		const databaseChannel = supabase
			.channel('public:Completed')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'Completed' },
				async (payload) => {
					const { data } = await supabase
						.from('Completed')
						.select()
						.order('id', { ascending: false })

					//? Meant to provide updates when user is in sort mode, currently non-functional, repeats the sorting 4 to 21 times.
					/* if (sortMethod) {
          if (sortMethod.includes('title')) {
            console.log('title sorted')
            sortListByNameSupabase('title', data!, sortMethod, setSortMethod, setResponse);
          } else if (sortMethod.includes('rating')) {

          } else if (sortMethod.includes('date')) {

          }
        } else setResponse(data!); */
					sortMethodRef.current = ''
					setResponse(data!)
					setResponse1(data!)
				}
			)
			.subscribe()

		const refresh = setInterval(
			() => axios.get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/refresh`),
			3500000
		)

		const closeMenus = (e: any) => {
			if (e.target?.tagName !== 'INPUT' && isEdited) {
				setIsEdited('')
			}
			if (
				!contextMenuButtonRef.current.includes(e.target.parentNode) &&
				!contextMenuButtonRef.current.includes(e.target.parentNode?.parentNode) &&
				!contextMenuRef.current?.contains(e.target) &&
				contextMenuRef.current
			) {
				setContextMenu({ top: 0, left: 0, currentItem: null })
			}
			if (
				e.target.parentNode !== settingsMenuButtonRef.current &&
				e.target.parentNode?.parentNode !== settingsMenuButtonRef.current &&
				!settingsMenuRef.current?.contains(e.target) &&
				settingsMenuRef.current
			) {
				setSettingsMenu({ top: 0, left: 0, display: 'none' })
			}
		}

		const resetEditNoFocus = () => {
			setIsEdited('')
		}

		const closeKeyboard = (e: KeyboardEvent) => {
			if (e.key == 'Escape') {
				if (detailsModalRef.current && editModalRef.current?.style.display == 'none') setDetailsModal(null)
				if (editModalRef.current?.style.display == 'block') editModalRef.current.style.display = 'none'
				if (isEditedRef.current) setIsEdited('')
			}
			if (e.key == 'Tab' && isEditedRef.current) {
				e.preventDefault()
				const fields = ['title', 'type', 'episode', 'rating1', 'rating2', 'start', 'end']
				const split = isEditedRef.current.split('_')
				const nextField = fields.findIndex(item => item == split[0]) + 1
				const nextIsEdited = nextField < fields.length ? `${fields[nextField]}_${split[1]}` : `title_${parseInt(split[1]) - 1}`;
				((e.target as HTMLElement).parentNode as HTMLFormElement).requestSubmit()
				setIsEdited('')
				setTimeout(() => setIsEdited(nextIsEdited), 100)
			}
		}

		document.addEventListener('click', closeMenus)
		window.addEventListener('focusout', resetEditNoFocus)
		document.addEventListener('keydown', closeKeyboard)

		return () => {
			clearInterval(refresh)
			databaseChannel.unsubscribe()
			document.removeEventListener('click', closeMenus)
			window.removeEventListener('focusout', resetEditNoFocus)
			document.removeEventListener('keydown', closeKeyboard)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<>
			<Head>
				<title>Cytube Watchlist</title>
				<meta name="description" content="Completed" />
			</Head>

			<main className="flex flex-col items-center justify-center mb-24 px-0 sm:px-6 py-2">
				<header className='flex items-center'>
					<h2 className="p-2 text-2xl sm:text-3xl">
						Completed
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
					<div
						ref={settingsMenuButtonRef}
						tabIndex={0}
						onClick={handleSettingsMenu}
						className="flex items-center justify-center h-7 w-7 cursor-pointer rounded-full hover:bg-gray-500 transition-colors duration-150 translate-y-[1px]"
					>
						<MoreVertIcon sx={{ fontSize: 28 }} />
					</div>
				</header>
				<div className="flex items-center gap-2">
					<div className="px-3 mb-1 bg-neutral-700 shadow-md shadow-black rounded-md">
						<SearchIcon />
						<input
							onChange={searchTable}
							type="search"
							placeholder=" Search Titles"
							className="input-text my-2 p-1 w-[60dvw] md:w-96 text-sm sm:text-lg"
						/>
					</div>
					<button
						onClick={addRecord}
						title="Add new record to table"
						className="input-submit h-3/5 mb-1 px-2 py-2 text-lg rounded-md"
					>
						<AddIcon sx={{ fontSize: 28 }} />
					</button>
				</div>
				<table>
					<thead>
						<tr>
						<th
								tabIndex={0}
								onClick={() =>
									sortListByNameSupabase(response, sortMethodRef, setResponse)
								}
								className="min-w-[1rem] sm:min-w-0 w-[48rem] cursor-pointer"
							>
								<span>Title</span>
								<span className="absolute">{sortSymbol('title', sortMethodRef)}</span>
							</th>
							<th
								tabIndex={0}
								onClick={() =>
									sortListByTypeSupabase(response, sortMethodRef, setResponse)
								}
								className="w-32 hidden md:table-cell cursor-pointer"
							>
								<span>Type</span>
								<span className="absolute">{sortSymbol('type', sortMethodRef)}</span>
							</th>
							<th 
								tabIndex={0}
								onClick={() =>
									sortListByEpisodeSupabase(response, sortMethodRef, setResponse)
								}
								className="w-36 hidden md:table-cell cursor-pointer"
							>
								<span>Episode(s)</span>
								<span className="absolute">{sortSymbol('episode', sortMethodRef)}</span>
							</th>
							<th
								tabIndex={0}
								onClick={() =>
									sortListByRatingSupabase(
										'rating1',
										response,
										sortMethodRef,
										setResponse
									)
								}
								className="w-32 cursor-pointer"
							>
								<span>GoodTaste</span>
								<span className="absolute">{sortSymbol('rating1', sortMethodRef)}</span>
							</th>
							<th
								tabIndex={0}
								onClick={() =>
									sortListByRatingSupabase(
										'rating2',
										response,
										sortMethodRef,
										setResponse
									)
								}
								className="w-32 cursor-pointer"
							>
								<span>TomoLover</span>
								<span className="absolute">{sortSymbol('rating2', sortMethodRef)}</span>
							</th>
							<th
								tabIndex={0}
								onClick={() =>
									sortListByDateSupabase(
										'startconv',
										response,
										sortMethodRef,
										setResponse
									)
								}
								className="w-40 cursor-pointer hidden md:table-cell"
							>
								<span>Start Date</span>
								<span className="absolute">{sortSymbol('start', sortMethodRef)}</span>
							</th>
							<th
								tabIndex={0}
								onClick={() =>
									sortListByDateSupabase(
										'endconv',
										response,
										sortMethodRef,
										setResponse
									)
								}
								className="w-40 cursor-pointer hidden md:table-cell"
							>
								<span>End Date</span>
								<span className="absolute">{sortSymbol('end', sortMethodRef)}</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{isLoadingClient ? 
						loadingGlimmer(7) : 
						response?.map((item, index) => (
							<tr key={item.id} className="relative group">
								<td
									style={{
										opacity: isLoadingEditForm.includes(`title_${item.id}`) ? 0.5 : 1
									}}
									onDoubleClick={() => {
										setIsEdited(`title_${item.id}`)
									}}
									className="relative min-w-[1rem]"
								>
									<span>
										{isEdited == `title_${item.id}` ? (
											editForm('title', item.id, item.title!)
										) : item.title ? (
											item.title
										) : (
											<span className="italic text-gray-400">Untitled</span>
										)}
										<div
											ref={element => (contextMenuButtonRef.current[index] = element)}
											onClick={(e) => {
												handleMenuClick(e, item)
											}}
											className="absolute flex items-center justify-center top-1/2 -translate-y-1/2 z-10 h-7 w-7 invisible group-hover:visible cursor-pointer rounded-full hover:bg-gray-500 transition-colors duration-150"
										>
											<MoreVertIcon />
										</div>
									</span>
									{isLoadingEditForm.includes(`title_${item.id}`) && (
										<CircularProgress size={30} className="absolute top-[20%] left-[48%]" />
									)}
								</td>
								<td
									style={{
										opacity: isLoadingEditForm.includes(`type_${item.id}`) ? 0.5 : 1
									}}
									onDoubleClick={() => {
										setIsEdited(`type_${item.id}`)
									}}
									className="relative hidden md:table-cell"
								>
									<span>
										{isEdited == `type_${item.id}`
											? editForm('type', item.id, item.type ?? '')
											: item.type}
									</span>
									{isLoadingEditForm.includes(`type_${item.id}`) && (
										<CircularProgress size={30} className="absolute top-[20%] left-[40%]" />
									)}
								</td>
								<td
									style={{
										opacity: isLoadingEditForm.includes(`episode_${item.id}`) ? 0.5 : 1
									}}
									onDoubleClick={() => {
										setIsEdited(`episode_${item.id}`)
									}}
									className="relative hidden md:table-cell"
								>
									<span>
										{isEdited == `episode_${item.id}`
											? editForm('episode', item.id, item.episode ?? '')
											: item.episode}
									</span>
									{isLoadingEditForm.includes(`episode_${item.id}`) && (
										<CircularProgress size={30} className="absolute top-[20%] left-[40%]" />
									)}
								</td>
								<td
									style={{
										opacity: isLoadingEditForm.includes(`rating1_${item.id}`) ? 0.5 : 1
									}}
									onDoubleClick={() => {
										setIsEdited(`rating1_${item.id}`)
									}}
									className="relative"
								>
									<span>
										{isEdited == `rating1_${item.id}`
											? editForm('rating1', item.id, item.rating1 ?? '')
											: item.rating1}
									</span>
									{isLoadingEditForm.includes(`rating1_${item.id}`) && (
										<CircularProgress size={30} className="absolute top-[20%] left-[40%]" />
									)}
								</td>
								<td
									style={{
										opacity: isLoadingEditForm.includes(`rating2_${item.id}`) ? 0.5 : 1
									}}
									onDoubleClick={() => {
										setIsEdited(`rating2_${item.id}`)
									}}
									className="relative"
								>
									<span>
										{isEdited == `rating2_${item.id}`
											? editForm('rating2', item.id, item.rating2 ?? '')
											: item.rating2}
									</span>
									{isLoadingEditForm.includes(`rating2_${item.id}`) && (
										<CircularProgress size={30} className="absolute top-[20%] left-[40%]" />
									)}
								</td>
								<td
									style={{
										opacity: isLoadingEditForm.includes(`start_${item.id}`) ? 0.5 : 1
									}}
									onDoubleClick={() => {
										setIsEdited(`start_${item.id}`)
									}}
									className="relative hidden md:table-cell"
								>
									<span>
										{isEdited == `start_${item.id}`
											? editForm('start', item.id, item.start ?? '')
											: item.start}
									</span>
									{isLoadingEditForm.includes(`start_${item.id}`) && (
										<CircularProgress size={30} className="absolute top-[20%] left-[40%]" />
									)}
								</td>
								<td
									style={{
										opacity: isLoadingEditForm.includes(`end_${item.id}`) ? 0.5 : 1
									}}
									onDoubleClick={() => {
										setIsEdited(`end_${item.id}`)
									}}
									className="relative hidden md:table-cell"
								>
									<span>
										{isEdited == `end_${item.id}`
											? editForm('end', item.id, item.end ?? '')
											: item.end}
									</span>
									{isLoadingEditForm.includes(`end_${item.id}`) && (
										<CircularProgress size={30} className="absolute top-[20%] left-[40%]" />
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{contextMenu.currentItem && <ContextMenu />}
				{detailsModal && <DetailsModal />}
				{settingsMenu.display == 'block' && <SettingsMenu />}
				<EditModal
					editModalRef={editModalRef}
					detailsModal={detailsModal}
					setLoading={setLoading}
				/>
			</main>
		</>
	)

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
				<li className="flex justify-center h-fit rounded-md hover:bg-pink-400">
					<button tabIndex={0} onClick={handleLoadDetails} className="py-2 w-full">
						Load details
					</button>
				</li>
				<li className="flex justify-center h-fit rounded-md hover:bg-pink-400">
					<Link href={'/completed/errors'} className="px-1 py-2 w-full text-center">
						See Potential Errors
					</Link>
				</li>
			</menu>
		)

		async function handleLoadDetails() {
			setLoading(true)
			try {
				await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/completed/loadcompleteddetails`)
				await axios.post('/api/revalidate', {
					route: '/completed/statistics'
				})
				setLoading(false)
			} catch (error) {
				setLoading(false)
				alert(error)
			}
		}
	}

	function handleSettingsMenu(e: BaseSyntheticEvent) {
		const { top, left } = e.target.getBoundingClientRect()

		setSettingsMenu({
			top: top + window.scrollY,
			left: left + window.scrollX - 160,
			display: 'block'
		})
	}

	function DetailsModal() {
		const [details, setDetails] = useState<
			Database['public']['Tables']['CompletedDetails']['Row'] | null
		>()
		const [genres, setGenres] = useState<Array<{ id: number; name: string | null }>>()
		const [loadingDetails, setLoadingDetails] = useState(true)

		useEffect(() => {
			const getDetails = async () => {
				const { data } = await supabase.from('CompletedDetails').select().eq('id', detailsModal?.id)
				const dataGenre = await supabase
					.from('Genres')
					.select('*, Completed!inner( id )')
					.eq('Completed.id', detailsModal?.id)

				const titleGenres = dataGenre.data?.map((item) => {
					return {
						id: item.id,
						name: item.name
					}
				})
				setGenres(titleGenres)
				setDetails(data?.[0])
				setLoadingDetails(false)
			}
			getDetails()
		}, [])

		async function handleReload() {
			try {
				setLoading(true)
				await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/completed/loadcompleteddetails`)
				await axios.post('/api/revalidate', {
					route: '/completed/statistics'
				})
				router.reload()
			} catch (error) {
				setLoading(false)
				alert(error)
			}
		}

		if (!loadingDetails && (!details || details.mal_id == -1 || !details.mal_title)) {
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
			)
		}

		return (
			<div>
				<div
					onClick={() => setDetailsModal(null)}
					className="fixed top-0 left-0 h-[100dvh] w-[100dvw] glass-modal"
				/>
				<article className="fixed flex flex-col items-center h-[80dvh] w-[80dvw] md:w-[60dvw] px-4 sm:px-10 py-6 bg-gray-700 rounded-md shadow-md shadow-black drop-shadow-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 modal">
					<Link
						href={`${location.origin}/completed/anime/${details?.id}`}
						className="px-12 font-bold text-lg sm:text-2xl text-center line-clamp-3 link"
					>
						{details?.mal_title}
					</Link>
					<div
						onClick={() => (editModalRef.current!.style.display = 'block')}
						className="absolute top-4 sm:top-8 right-4 sm:right-12 flex items-center justify-center h-7 sm:h-11 w-7 sm:w-11 rounded-full cursor-pointer transition-colors duration-150 hover:bg-slate-500"
					>
						<EditIcon sx={{
							fontSize: {
								sm: 25,
								lg: 30
							}
						}} />
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
								width={'80%'}
								height={170}
								className="mb-6 bg-gray-500"
							/>
						</>
					) : (
						<>
							<span className='hidden lg:block'>{details?.mal_alternative_title}</span>
							<div className='relative my-5 h-[18rem] sm:h-[20rem] w-[12rem] sm:w-[15rem] overflow-hidden'>
								<Image
									src={details?.image_url!}
									alt="Art"
									fill
									sizes="30vw"
									className="object-contain"
								/>
							</div>
							<p title={details?.mal_synopsis!} className="mb-6 text-center lg:line-clamp-3 hidden">
								{details?.mal_synopsis}
							</p>
						</>
					)}
					<div className="flex mb-6 gap-16">
						<div className="flex flex-col">
							<h5 className="mb-2 font-semibold text-center text-lg">Start Date</h5>
							<span className='text-center'>{details?.start_date}</span>
						</div>
						<div className="flex flex-col items-center justify-center">
							<h5 className="mb-2 font-semibold text-center text-lg">End Date</h5>
							<span className='text-center'>{details?.end_date}</span>
						</div>
					</div>
					<h5 className="font-semibold text-lg">Genres</h5>
					<span className="mb-2 text-center">
						{genres?.map((item, index) => {
							return (
								<Link
									href={`${location.origin}/completed/genres/${item.id}`}
									key={index}
									className="link"
								>
									{item.name}
									<span className="text-white">{index < genres.length - 1 ? ', ' : null}</span>
								</Link>
							)
						})}
					</span>
					<Link
						href={
							`https://myanimelist.net/anime/${details?.mal_id}` ??
							'https://via.placeholder.com/400x566'
						}
						target="_blank"
						rel='noopener noreferrer'
						className="text-base sm:text-lg link"
					>
						MyAnimeList
					</Link>
				</article>
			</div>
		)
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
		)

		function handleDetails() {
			setDetailsModal(contextMenu.currentItem)
			setContextMenu({ ...contextMenu, currentItem: null })
		}

		async function handleVisit() {
			const malURL = await supabase
				.from('CompletedDetails')
				.select('mal_id')
				.eq('id', contextMenu.currentItem?.id)
			window.open(`https://myanimelist.net/anime/${malURL.data?.[0]?.mal_id}`, '_blank')
		}
	}

	function handleMenuClick(
		e: BaseSyntheticEvent,
		item: Database['public']['Tables']['Completed']['Row']
	) {
		const { top, left } = e.target.getBoundingClientRect()

		setContextMenu({
			top: top + window.scrollY,
			left: left + window.scrollX + 25,
			currentItem: item
		})
	}

	function searchTable(e: BaseSyntheticEvent) {
		if (e.target.value == '') {
			sortMethodRef.current = ''
			setResponse(response1)
		}
		if (!response || !response1) return

		setResponse(
			response1
				.slice()
				.filter((item) => item.title?.toLowerCase().includes(e.target.value.toLowerCase()))
		)
	}

	function editForm(
		field: 'title' | 'type' | 'episode' | 'rating1' | 'rating2' | 'start' | 'end',
		id: number,
		ogvalue: string
	): React.ReactNode {
		let column: string
		let row = (id + 1).toString()
		switch (field) {
			case 'title':
				column = 'B'
				break
			case 'type':
				column = 'C'
				break
			case 'episode':
				column = 'D'
				break
			case 'rating1':
				column = 'E'
				break
			case 'rating2':
				column = 'F'
				break
			case 'start':
				column = 'H'
				break
			case 'end':
				column = 'I'
				break
			default:
				alert('Error: missing field')
				return
		}

		async function handleSubmit(event: BaseSyntheticEvent): Promise<void> {
			const isDate = field == 'start' || field == 'end'
			const dateEntered = new Date(event.target[0].value)
			const currentlyProcessedEdit = isEditedRef.current
			event.preventDefault()
			
			if (ogvalue == event.target[0].value || ogvalue == dateEntered.toLocaleDateString('en-US', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			})) {
				setIsEdited('')
				return
			}
			
			setIsLoadingEditForm(isLoadingEditForm.concat(`${field}_${id}`))
			try {
				await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/update`, {
					content: isDate ? (dateEntered.toString() == 'Invalid Date' ? 'Unknown' : dateEntered.toLocaleDateString('en-US', {
						day: 'numeric',
						month: 'long',
						year: 'numeric'
					})) : event.target[0].value,
					cell: column + row
				})

				const changed = response?.slice()
				if (!changed) return
				changed.find((item) => item.id === id)!['title'] = event.target[0].value
				setResponse(changed)
				if (isEditedRef.current == currentlyProcessedEdit) setIsEdited('')
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${id}`))
			} catch (error) {
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${id}`))
				alert(error)
				return
			}
		}

		if (field == 'start' || field == 'end') {
			return (
				<div className="flex items-center justify-center relative w-full">
					<div
						style={{
							opacity: isLoadingEditForm.includes(`${field}_${id}`) ? 0.5 : 1,
							pointerEvents: isLoadingEditForm.includes(`${field}_${id}`) ? 'none' : 'unset',
						}}
						className="w-[90%]"
					>
						<form onChange={(e) => (e.target as HTMLElement).focus()} onSubmit={handleSubmit}>
							<input
								autoFocus
								type="date"
								defaultValue={new Date(ogvalue).toLocaleDateString('en-CA')}
								className="input-text text-center w-full"
							/>
							<input type='submit' className='hidden' />
						</form>
					</div>
				</div>
			)
		}

		return (
			<div className="flex items-center justify-center relative w-full">
				<div
					style={{
						opacity: isLoadingEditForm.includes(`${field}_${id}`) ? 0.5 : 1,
						pointerEvents: isLoadingEditForm.includes(`${field}_${id}`) ? 'none' : 'unset',
					}}
					className="w-[90%]"
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
		)
	}

	async function addRecord(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> {	
		if (!response?.[0].title) {
			alert('Insert title for latest row before adding a new one')
			return
		}

		setLoading(true)
		try {
			await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/update`, {
				content: (response.length + 1).toString(),
				cell: 'A' + (response.length + 2).toString()
			})

			setIsEdited(`title_${response.length + 1}`)
			setLoading(false)
		} catch (error) {
			setLoading(false)
			alert(error)
			return
		}
	}
}
