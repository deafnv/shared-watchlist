import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BaseSyntheticEvent, useEffect, useRef, useState, Dispatch, SetStateAction, RefObject, Fragment } from 'react'
import debounce from 'lodash/debounce'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import { createClient } from '@supabase/supabase-js'
import { useLoading } from '@/components/LoadingContext'
import EditDialog from '@/components/dialogs/EditDialog'
import {
	sortListByDateSupabase,
	sortListByEpisodeSupabase,
	sortListByNameSupabase,
	sortListByRatingSupabase,
	sortListByTypeSupabase,
	sortSymbol
} from '@/lib/list_methods'
import { Database } from '@/lib/database.types'
import { CompletedFields } from '@/lib/types'

interface SettingsMenuPos {
	top: number;
	left: number;
	display: boolean;
}

export default function Completed() {
	const settingsMenuRef = useRef<HTMLDivElement>(null)
	const settingsMenuButtonRef = useRef<HTMLDivElement>(null)
	const sortMethodRef = useRef<`${'asc' | 'desc'}_${CompletedFields}` | ''>('')
	const isEditedRef = useRef<`${CompletedFields}_${number}` | ''>('')

	const [response, setResponse] = useState<Database['public']['Tables']['Completed']['Row'][]>()
	const [response1, setResponse1] = useState<Database['public']['Tables']['Completed']['Row'][]>()
	const [isEdited, setIsEditedState] = useState<`${CompletedFields}_${number}` | ''>('')
	const [isLoadingClient, setIsLoadingClient] = useState(true)
	const [isLoadingEditForm, setIsLoadingEditForm] = useState<`${CompletedFields}_${number}`[]>([])
	const [settingsMenu, setSettingsMenu] = useState<SettingsMenuPos>({ top: 0, left: 0, display: false })
	const [detailsOpen, setDetailsOpen] = useState<number[]>([])
	const [editDialog, setEditDialog] = useState<{ id: number; title: string; }>()

	const { setLoading } = useLoading()

	const setIsEdited = (value: `${CompletedFields}_${number}` | '') => {
		isEditedRef.current = value
		setIsEditedState(value)
	}

	const supabase = createClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	)

	useEffect(() => {
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
				async () => {
					const { data } = await supabase
						.from('Completed')
						.select()
						.order('id', { ascending: false })
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

		const closeMenus = (e: MouseEvent) => {
			const target = e.target as HTMLElement
			if (target?.tagName !== 'INPUT' && isEdited) {
				setIsEdited('')
			}
			if (
				target.parentNode !== settingsMenuButtonRef.current &&
				target.parentNode?.parentNode !== settingsMenuButtonRef.current &&
				!settingsMenuRef.current?.contains(target) &&
				settingsMenuRef.current
			) {
				setSettingsMenu({ top: 0, left: 0, display: false })
			}
		}

		const resetEditNoFocus = () => {
			setIsEdited('')
		}

		const closeKeyboard = (e: KeyboardEvent) => {
			if (e.key == 'Escape') {
				if (editDialog) setEditDialog(undefined)
				if (isEditedRef.current) setIsEdited('')
			}
			if (e.key == 'Tab' && isEditedRef.current != '') {
				e.preventDefault()
				const fields: ['title', 'type', 'episode', 'rating1', 'rating2', 'endconv'] = ['title', 'type', 'episode', 'rating1', 'rating2', 'endconv']
				const split = isEditedRef.current.split('_') as [CompletedFields, string]
				const nextField = fields.findIndex(item => item == split[0]) + 1
				const nextIsEdited: `${CompletedFields}_${number}` = nextField < fields.length ? `${fields[nextField]}_${parseInt(split[1])}` : `title_${parseInt(split[1]) - 1}`;
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

	const debouncedSearch = debounce(async function (e: BaseSyntheticEvent) {
		console.log('Searching...')
		const Fuse = (await import('fuse.js')).default
		const fuse = new Fuse(response1 ?? [], { 
			keys: ['title'],
			threshold: 0.35
		})
		const results = fuse.search(e.target.value).map(item => item.item)

		setResponse(results)
	}, 200)

	return (
		<>
			<Head>
				<title>Watchlist</title>
				<meta name="description" content="Completed" />
			</Head>

			<main className="flex flex-col items-center justify-center gap-2 mb-24 px-0 sm:px-6 py-2">
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
				<div className="flex items-center justify-center gap-2">
					<div className="px-3 mb-1 bg-neutral-700 shadow-md shadow-black rounded-md">
						<SearchIcon />
						<input
							onChange={searchTable}
							type="search"
							placeholder=" Search titles"
							className="input-text my-2 p-1 w-[60dvw] md:w-96 text-sm sm:text-lg"
						/>
					</div>
					<IconButton
						onClick={addRecord}
						title="Add new record to table"
					>
						<AddIcon sx={{ fontSize: 24 }} />
					</IconButton>
				</div>
				{isLoadingClient ? 
				<div className='flex items-center justify-center h-[36rem]'>
					<CircularProgress size={50} color="primary" />
				</div> : 
				<div className='p-2 bg-neutral-700 rounded-md'>
					<table>
						<thead className='border-b'>
							<tr>
								<th
									tabIndex={0}
									onClick={() =>
										sortListByNameSupabase(response, sortMethodRef, setResponse)
									}
									className="p-2 min-w-[1rem] sm:min-w-0 w-[42rem] cursor-pointer"
								>
									<span className='relative'>
										Title
										<span className="absolute -right-6">{sortSymbol('title', sortMethodRef)}</span>
									</span>
								</th>
								<th
									tabIndex={0}
									onClick={() =>
										sortListByTypeSupabase(response, sortMethodRef, setResponse)
									}
									className="p-2 w-32 hidden md:table-cell cursor-pointer"
								>
									<span className='relative'>
										Type
										<span className="absolute -right-6">{sortSymbol('type', sortMethodRef)}</span>
									</span>
								</th>
								<th 
									tabIndex={0}
									onClick={() =>
										sortListByEpisodeSupabase(response, sortMethodRef, setResponse)
									}
									className="p-2 w-36 hidden md:table-cell cursor-pointer"
								>
									<span className='relative'>
										Episode(s)
										<span className="absolute -right-6">{sortSymbol('episode', sortMethodRef)}</span>
									</span>
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
									className="p-2 w-32 cursor-pointer"
								>
									<span className='relative'>
										Rating 1
										<span className="absolute -right-6">{sortSymbol('rating1', sortMethodRef)}</span>
									</span>
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
									className="p-2 w-32 cursor-pointer"
								>
									<span className='relative'>
										Rating 2
										<span className="absolute -right-6">{sortSymbol('rating2', sortMethodRef)}</span>
									</span>
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
									className="p-2 w-40 cursor-pointer hidden md:table-cell"
								>
									<span className='relative'>
										Start Date
										<span className="absolute -right-6">{sortSymbol('start', sortMethodRef)}</span>
									</span>
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
									className="p-2 w-40 cursor-pointer hidden md:table-cell"
								>
									<span className='relative'>
										End Date
										<span className="absolute -right-6">{sortSymbol('end', sortMethodRef)}</span>
									</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{response?.map(item => (
								<Fragment key={item.id}>
									<tr className="relative group">
										<td
											style={{
												opacity: isLoadingEditForm.includes(`title_${item.id}`) ? 0.5 : 1
											}}
											className="relative flex items-center py-2 min-w-[1rem] group-hover:bg-zinc-800 rounded-s-md"
										>
											<div
												onClick={(e) => {
													if (detailsOpen.includes(item.id)) setDetailsOpen(vals => vals.filter(val => val != item.id))
													else setDetailsOpen(val => [...val, item.id])
												}}
												className="flex items-center justify-center h-7 w-7 cursor-pointer rounded-full transition-colors duration-150"
											>
												<ExpandMoreIcon className={`fill-gray-500 group-hover:fill-white ${detailsOpen.includes(item.id) ? '' : '-rotate-90'} transition-transform`} />
											</div>
											<span 
												onDoubleClick={() => setIsEdited(`title_${item.id}`)}
												className={`w-full ${item.title ? '' : 'italic text-gray-400'}`}
											>
												{isEdited == `title_${item.id}` ? editForm('title', item.id, item.title!) : (item.title ? item.title : 'Untitled')}
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
											className="relative hidden md:table-cell text-center group-hover:bg-zinc-800"
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
											className="relative hidden md:table-cell text-center group-hover:bg-zinc-800"
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
											className="relative group-hover:bg-zinc-800 text-center"
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
											className="relative text-center group-hover:bg-zinc-800"
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
												opacity: isLoadingEditForm.includes(`startconv_${item.id}`) ? 0.5 : 1
											}}
											onDoubleClick={() => {
												setIsEdited(`startconv_${item.id}`)
											}}
											className="relative hidden md:table-cell text-center group-hover:bg-zinc-800"
										>
											<span>
												{isEdited == `start_${item.id}`
													? editForm('startconv', item.id, item.start ?? '')
													: item.start}
											</span>
											{isLoadingEditForm.includes(`startconv_${item.id}`) && (
												<CircularProgress size={30} className="absolute top-[20%] left-[40%]" />
											)}
										</td>
										<td
											style={{
												opacity: isLoadingEditForm.includes(`endconv_${item.id}`) ? 0.5 : 1
											}}
											onDoubleClick={() => {
												setIsEdited(`endconv_${item.id}`)
											}}
											className="relative hidden md:table-cell text-center group-hover:bg-zinc-800 rounded-e-md"
										>
											<span>
												{isEdited == `end_${item.id}`
													? editForm('endconv', item.id, item.end ?? '')
													: item.end}
											</span>
											{isLoadingEditForm.includes(`endconv_${item.id}`) && (
												<CircularProgress size={30} className="absolute top-[20%] left-[40%]" />
											)}
										</td>
									</tr>
									<tr>
										<td
											colSpan={7}
											className='table-cell bg-black rounded-md p-0'
										>
											<AnimatePresence>
												{detailsOpen.includes(item.id) && 
												<motion.div 
													initial={{ height: 0, opacity: 0 }}
													animate={{ height: '18rem', opacity: 1 }}
													exit={{ height: 0, opacity: 0 }}
													transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
													className='relative flex p-5 h-72 sm:h-80 overflow-hidden'
												>
													<CompletedItemDetails 
														item={item} 
														setEditDialog={setEditDialog}
													/>
												</motion.div>}
											</AnimatePresence>
										</td>
									</tr>
								</Fragment>
							))}
						</tbody>
					</table>
				</div>}
				<SettingsMenu 
					settingsMenuRef={settingsMenuRef}
					settingsMenu={settingsMenu}
				/>
				<EditDialog
					editDialog={!!editDialog}
					setEditDialog={() => setEditDialog(undefined)}
					details={editDialog ?? { id: -1, title: '' }}
				/>
			</main>
		</>
	)

	function handleSettingsMenu(e: BaseSyntheticEvent) {
		const { top, left } = e.target.getBoundingClientRect()

		setSettingsMenu({
			top: top + window.scrollY,
			left: left + window.scrollX - 160,
			display: true
		})
	}

	async function searchTable(e: BaseSyntheticEvent) {
		if (e.target.value == '') { //TODO: Resetting state is super laggy, could fix by changing display property instead of adding/removing from the DOM
			sortMethodRef.current = ''
			setResponse(response1)
			return	
		}
		if (!response || !response1) return
		debouncedSearch(e)
	}

	function editForm(
		field: CompletedFields,
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
			case 'startconv':
				column = 'H'
				break
			case 'endconv':
				column = 'I'
				break
			default:
				alert('Error: missing field')
				return
		}

		async function handleSubmit(event: BaseSyntheticEvent): Promise<void> {
			const isDate = field == 'startconv' || field == 'endconv'
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
				}, { withCredentials: true })

				const changed = response?.slice()
				if (!changed) return
				changed.find((item) => item.id === id)![field] = isDate ? dateEntered.toLocaleDateString('en-US', {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				}) : event.target[0].value
				setResponse(changed)
				if (isEditedRef.current == currentlyProcessedEdit) setIsEdited('')
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${id}`))
			} catch (error) {
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${id}`))
				alert(error)
				return
			}
		}

		if (field == 'startconv' || field == 'endconv') {
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
					className="w-full"
				>
					<form onSubmit={handleSubmit}>
						<input
							autoFocus
							type="text"
							defaultValue={ogvalue}
							className={`input-text w-full ${field == 'title' ? 'text-left' : 'text-center'}`}
						/>
					</form>
				</div>
			</div>
		)
	}

	async function addRecord() {	
		if (!response?.[0].title) {
			alert('Insert title for latest row before adding a new one')
			return
		}

		setLoading(true)
		try {
			await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/update`, {
				content: (response.length + 1).toString(),
				cell: 'A' + (response.length + 2).toString()
			}, { withCredentials: true })

			setIsEdited(`title_${response.length + 1}`)
			setLoading(false)
		} catch (error) {
			setLoading(false)
			alert(error)
			return
		}
	}
}

function SettingsMenu({
	settingsMenuRef,
	settingsMenu,
}: {
	settingsMenuRef: RefObject<HTMLDivElement>;
	settingsMenu: SettingsMenuPos;
}) {
	const { setLoading } = useLoading()

	async function handleLoadDetails() {
		setLoading(true)
		try {
			await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/completed/loadcompleteddetails`, { withCredentials: true })
			await axios.post('/api/revalidate', {
				route: '/completed/statistics'
			})
			setLoading(false)
		} catch (error) {
			setLoading(false)
			alert(error)
		}
	}

	return (
		<AnimatePresence>
			{settingsMenu.display && 
			<motion.menu 
				initial={{ height: 0, opacity: 0 }}
				animate={{ height: '7.6rem', opacity: 1 }}
				exit={{ height: 0, opacity: 0 }}
				transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
				ref={settingsMenuRef}
				style={{
					top: settingsMenu.top,
					left: settingsMenu.left
				}}
				className="absolute z-20 p-2 w-[10rem] shadow-md shadow-black bg-black border-pink-400 border-[1px] rounded-md overflow-hidden"
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
			</motion.menu>}
		</AnimatePresence>
	)
}

function CompletedItemDetails({
	item,
	setEditDialog
}: {
	item: Database['public']['Tables']['Completed']['Row']
	setEditDialog: Dispatch<SetStateAction<{
		id: number;
		title: string;
	} | undefined>>
}) {
	const [details, setDetails] = useState<Database['public']['Tables']['CompletedDetails']['Row']>()
	const [genres, setGenres] = useState<{ id: number; name: string | null; }[]>()
	const [isLoading, setIsLoading] = useState(true)

	const router = useRouter()

	const { setLoading } = useLoading()

	useEffect(() => {
		const supabase = createClient<Database>(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
		)

		const getDetails = async () => {
			const { data } = await supabase.from('CompletedDetails').select().eq('id', item.id)
			const dataGenre = await supabase
				.from('Genres')
				.select('*, Completed!inner( id )')
				.eq('Completed.id', item.id)

			const titleGenres = dataGenre.data?.map((item) => {
				return {
					id: item.id,
					name: item.name
				}
			})
			setGenres(titleGenres)
			setDetails(data?.[0])
			setIsLoading(false)
		}
		getDetails()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	async function handleReload() {
		try {
			setLoading(true)
			await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/completed/loadcompleteddetails`, { withCredentials: true })
			await axios.post('/api/revalidate', {
				route: '/completed/statistics'
			})
			router.reload()
		} catch (error) {
			console.error(error)
			alert(error)
		} finally {
			setLoading(false)
		}
	}

	if (isLoading) {
		return (
			<div className='flex items-center justify-center self-center mx-auto p-5 h-72 sm:h-80'>
				<CircularProgress color="primary" />
			</div>
		)
	} if (!details || !genres) {
		return (
			<div className='flex flex-col items-center justify-center self-center mx-auto p-5 h-72 sm:h-80'>
				<h3 className="mb-6 font-bold text-center text-xl sm:text-2xl">
					Details for this title have not been loaded yet
				</h3>
				<span onClick={handleReload} className="cursor-pointer link">
					Click here to reload database and view details
				</span>
			</div>
		)
	} else {
		return (
			<>
				<div className='relative w-32 sm:w-60 mr-4 sm:mr-0 overflow-hidden'>
					<Image
						src={details?.image_url!}
						alt={`${item.title} Art`}
						fill
						sizes="30vw"
						className="object-contain"
						draggable={false}
					/>
				</div>
				<div className='flex flex-col items-start justify-center gap-4 w-3/5'>
					<Link
						href={`/completed/anime/${details?.id}`}
						title={details?.mal_title ?? ''}
						className="font-bold text-lg sm:text-xl md:text-2xl line-clamp-2 link"
					>
						{details?.mal_title}
					</Link>
					<p className='text-sm line-clamp-4'>
						{details?.mal_synopsis}
					</p>
					<div>
					<h5 className="font-semibold text-lg">Genres</h5>
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
					</div>
				</div>
				<div className="hidden grow md:flex flex-col justify-center gap-3">
					<h4 className='font-semibold text-center text-lg'>Airing Dates</h4>
					<div className='flex justify-center gap-4'>
						<div className="flex flex-col">
							<h5 className="mb-2 font-semibold text-center text-lg">Start</h5>
							<span className='text-center'>{details?.start_date ? details.start_date : '–'}</span>
						</div>
						<div className="flex flex-col items-center justify-center">
							<h5 className="mb-2 font-semibold text-center text-lg">End</h5>
							<span className='text-center'>{details?.end_date ? details.end_date : '–'}</span>
						</div>
					</div>
					<a
						href={`https://myanimelist.net/anime/${details?.mal_id}`}
						target="_blank"
						rel='noopener noreferrer'
						className="mt-6 text-center link"
					>
						MyAnimeList
					</a>
				</div>
				<IconButton
					sx={{
						position: 'absolute',
						top: '0.75rem',
						right: '1rem'
					}}
					onClick={() => setEditDialog({ id: item.id, title: item.title ?? '' })}
					className='!hidden md:!block'
				>
					<EditIcon />
				</IconButton>
			</>
		)
	}
}