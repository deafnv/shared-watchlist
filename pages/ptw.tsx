import Head from 'next/head'
import { BaseSyntheticEvent, useEffect, useState, useRef, Dispatch, SetStateAction, MutableRefObject } from 'react'
import axios from 'axios'
import { Reorder, useDragControls } from 'framer-motion'
import isEqual from 'lodash/isEqual'
import io, { Socket } from 'socket.io-client'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import DoneIcon from '@mui/icons-material/Done'
import CancelIcon from '@mui/icons-material/Cancel'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import Button from '@mui/material/Button'
import { createClient } from '@supabase/supabase-js'
import { EditFormParams, PTWRolledTableItemProps, getRandomInt, sortListByNamePTW, sortSymbol } from '@/lib/list_methods'
import { Database } from '@/lib/database.types'
import { loadingGlimmer } from '@/components/LoadingGlimmer'
import { useLoading } from '@/components/LoadingContext'

let socket: Socket

export default function PTW() {
	const rolledTitleRef = useRef('???')
	const rolledTitleElementRef = useRef<HTMLHeadingElement>(null)
	const onlineUsersRef = useRef<number>(0)
	const onlineUsersElementRef = useRef<HTMLSpanElement>(null)
	const latencyRef = useRef<HTMLSpanElement>(null)
	const latencyBadgeRef = useRef<HTMLDivElement>(null)
	const addGachaRollRef = useRef<HTMLDivElement>(null)
	const contextMenuRef = useRef<HTMLDivElement>(null)
	const contextMenuButtonRef = useRef<any>([])
	const sortMethodRef = useRef('')
	const isEditedRef = useRef('')
	const reordered = useRef(false)
	const entryToDelete = useRef<any | null>(null)
	const setReordered = (value: boolean) => reordered.current = value 

	const [responseRolled, setResponseRolled] =
		useState<Database['public']['Tables']['PTW-Rolled']['Row'][]>()
	const [responseRolled1, setResponseRolled1] =
		useState<Database['public']['Tables']['PTW-Rolled']['Row'][]>()
	const [responseCasual, setResponseCasual] =
		useState<Database['public']['Tables']['PTW-Casual']['Row'][]>()
	const [responseNonCasual, setResponseNonCasual] =
		useState<Database['public']['Tables']['PTW-NonCasual']['Row'][]>()
	const [responseMovies, setResponseMovies] =
		useState<Database['public']['Tables']['PTW-Movies']['Row'][]>()
	const [isEdited, setIsEditedState] = useState<string>('')
	const [isLoadingClient, setIsLoadingClient] = useState(true)
	const [isLoadingEditForm, setIsLoadingEditForm] = useState<Array<string>>([])
	const [confirmModal, setConfirmModal] = useState(false)
	const [contextMenu, setContextMenu] = useState<{
		top: number
		left: number
		currentItem: Database['public']['Tables']['PTW-Rolled']['Row'] | null
	}>({ top: 0, left: 0, currentItem: null })
	const [isAdded, setIsAdded] = useState<{
		top: number
		left: number
		response: Database['public']['Tables']['PTW-Casual']['Row'][] | undefined
		tableId: 'rolled' | 'casual' | 'noncasual' | 'movies'
	} | null>(null)
	const { setLoading } = useLoading()

	const setIsEdited = (value: string) => {
		isEditedRef.current = value
		setIsEditedState(value)
	}

	const setConfirmModalDelEntry = () => {
		entryToDelete.current = contextMenu.currentItem
		setConfirmModal(true)
	}

	const setRolledTitle = (value: string) => {
		if (value == '???') {
			addGachaRollRef.current!.style.visibility = 'hidden'
		} else {
			addGachaRollRef.current!.style.visibility = 'visible'
		}
		rolledTitleElementRef.current!.innerHTML = value
		rolledTitleRef.current = value
	}

	const setOnlineUsers = (value: any) => {
		if (!value) return
		const valueArr = Object.keys(value).map(key => value[key])
		onlineUsersRef.current = valueArr.length
		onlineUsersElementRef.current!.innerHTML = `${valueArr.length} user(s) online`
	}

	const editFormParams = {
		isLoadingEditForm,
		setIsLoadingEditForm,
		isEditedRef,
		setIsEdited,
		responseRolled,
		responseCasual,
		responseNonCasual,
		responseMovies,
		setResponseRolled,
		setResponseCasual,
		setResponseNonCasual,
		setResponseMovies
	}

	useEffect(() => {
		setRolledTitle(rolledTitleRef.current)
	})

	const setLatency = (value: number) => {
		if (latencyRef.current) latencyRef.current.innerHTML = `Latency: ${value.toFixed(1)}ms`
	}

	const supabase = createClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	)

	const channel = supabase.channel('room1')
	useEffect(() => {
		const getData = async () => {
			const dataRolled = await supabase.from('PTW-Rolled').select().order('id', { ascending: true })
			const dataCasual = await supabase.from('PTW-Casual').select().order('id', { ascending: true })
			const dataNonCasual = await supabase
				.from('PTW-NonCasual')
				.select()
				.order('id', { ascending: true })
			const dataMovies = await supabase.from('PTW-Movies').select().order('id', { ascending: true })

			setResponseRolled(dataRolled.data!)
			setResponseRolled1(dataRolled.data!)
			setResponseCasual(dataCasual.data!)
			setResponseNonCasual(dataNonCasual.data!)
			setResponseMovies(dataMovies.data!)
			setIsLoadingClient(false)

			await axios
				.get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/refresh`)
				.catch((error) => console.log(error))
		}
		getData()

		const initializeSocket = async () => {
			socket = io(process.env.NEXT_PUBLIC_API_URL!)
			socket.on('connect', () => {
				console.log('connected')
			})

			socket.on('roll', payload => {
				setRolledTitle(payload.message)
				if (payload.isLoading) {
					setLoading(true)
				} else setLoading(false)
			})
		}
		initializeSocket()

		const pingInterval = setInterval(() => {
			const start = Date.now()
		
			socket.emit("ping", () => {
				const duration = Date.now() - start
				setLatency(duration)
			})
		}, 2500)

		const refresh = setInterval(
			() => axios.get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/refresh`),
			3500000
		)

		const databaseChannel = supabase
			.channel('*')
			.on('postgres_changes', { event: '*', schema: '*' }, async (payload) => {
				if (
					payload.table == 'PTW-Rolled' ||
					payload.table == 'PTW-Casual' ||
					payload.table == 'PTW-NonCasual' ||
					payload.table == 'PTW-Movies'
				) {
					const { data } = await supabase
						.from(payload.table)
						.select()
						.order('id', { ascending: true })

					switch (payload.table) {
						case 'PTW-Rolled':
							sortMethodRef.current = ''
							setResponseRolled(data as Database['public']['Tables']['PTW-Rolled']['Row'][])
							setResponseRolled1(data as Database['public']['Tables']['PTW-Rolled']['Row'][])
							setReordered(false)
							break
						case 'PTW-Casual':
							setResponseCasual(data!)
							break
						case 'PTW-NonCasual':
							setResponseNonCasual(data!)
							break
						case 'PTW-Movies':
							setResponseMovies(data!)
							break
					}
				}
			})
			.subscribe()

		const onlineChannel = supabase
			.channel('online-users')
			.on('presence', { event: 'sync' }, () => {
				setOnlineUsers(onlineChannel.presenceState())
			})
			.subscribe(async (status) => {
				if (status === 'SUBSCRIBED') {
					const status = await onlineChannel.track({ online_at: new Date().toISOString() })
					console.log(status)
				}
			})

		const resetOnClickOut = (e: any) => {
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
			if (e.target?.tagName !== 'INPUT' && e.target?.tagName !== 'svg' && e.target?.tagName !== 'path') {
				setIsAdded(null)
			}
		}

		const resetEditedOnFocusOut = () => {
			setIsEdited('')
		}

		const resetEditedOnEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setIsEdited('')
		}

		document.addEventListener('click', resetOnClickOut)
		window.addEventListener('focusout', resetEditedOnFocusOut)
		window.addEventListener('keydown', resetEditedOnEscape)

		return () => {
			socket.off('roll')
			databaseChannel.unsubscribe()
			onlineChannel.unsubscribe()
			clearInterval(refresh)
			clearInterval(pingInterval)
			document.removeEventListener('click', resetOnClickOut)
			window.removeEventListener('focusout', resetEditedOnFocusOut)
			window.removeEventListener('keydown', resetEditedOnEscape)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<>
			<Head>
				<title>Watchlist</title>
				<meta name="description" content="Plan to Watch" />
			</Head>

			<main className="flex flex-col items-center justify-center gap-4 mb-24 px-6 py-2">
				<section className="flex flex-col lg:flex-row items-center justify-center w-full gap-12">
					<div className="flex flex-col items-center min-h-[40rem] w-[30rem] lg:w-auto">
						<header className='flex items-center mt-5'>
							<h2 className="p-2 text-2xl sm:text-3xl">
								Plan to Watch (Rolled)
							</h2>
							<div
						title='Add new entry' 
						tabIndex={0}
						onClick={(e) => handleAddMenu(e, responseRolled, 'rolled')} 
						className='flex items-center justify-center h-7 w-7 cursor-pointer rounded-full hover:bg-gray-500 transition-colors duration-150 sm:translate-y-[2px]'
					>
						<AddIcon />
					</div>
							{sortMethodRef.current &&
							<div
								title="Reset sort"
								tabIndex={0}
								onClick={() => {
									sortMethodRef.current = ''
									setResponseRolled(responseRolled1)
								}}
								className="flex items-center justify-center h-7 w-7 cursor-pointer rounded-full hover:bg-gray-500 transition-colors duration-150 translate-y-[1px]"
							>
								<RefreshIcon sx={{ fontSize: 28 }} />
							</div>}
						</header>
						<div className="grid grid-cols-[4fr_1.1fr] min-w-0 w-[80dvw] lg:w-[40rem] bg-sky-600 border-white border-solid border-[1px]">
							<span 
								tabIndex={0}
								onClick={() => {
									sortListByNamePTW(
										'title',
										responseRolled,
										sortMethodRef,
										setResponseRolled
									)
									setReordered(false)
								}}
								className='relative flex items-center justify-center p-2 h-full border-white border-r-[1px] text-center font-bold cursor-pointer'
							>
								Title
								<span className="absolute left-[54%]">{sortSymbol('title', sortMethodRef)}</span>
							</span>
							<span className='flex items-center justify-center p-2 h-full text-center font-bold'>
								Status
							</span>
						</div>
						{isLoadingClient ? (
							<div className="flex flex-col items-center justify-around h-[448px] w-[80dvw] lg:w-[40rem] border-white border-solid border-[1px] border-t-0">
								{Array(8)
									.fill('')
									.map((item, index) => (
										<Skeleton
											key={index}
											sx={{ backgroundColor: 'grey.700' }}
											animation="wave"
											variant="rounded"
											width={'95%'}
											height={40}
										/>
									))}
							</div>
						) : (
							<Reorder.Group
								values={responseRolled ?? []}
								draggable={sortMethodRef.current ? true : false}
								onReorder={(newOrder) => {
									setContextMenu({ top: 0, left: 0, currentItem: null })
									setResponseRolled(newOrder)
									setReordered(true)
								}}
								className="flex flex-col min-w-[80dvw] lg:min-w-full w-min border-white border-[1px] border-t-0"
							>
								{responseRolled?.map((item, index) => (
									!isLoadingClient && 
									<PTWRolledTableItem
										key={item.id}
										props={{ item, index, isLoadingEditForm, setIsEdited, isEdited, isEditedRef, sortMethodRef, setContextMenu, contextMenuButtonRef, responseRolled, setResponseRolled, setIsLoadingEditForm }}
										editFormParams={editFormParams}
									/>
								))}
							</Reorder.Group>)}
						<div
							style={{
								visibility: !sortMethodRef.current && reordered.current && !isEqual(responseRolled, responseRolled1) ? 'visible' : 'hidden'
							}}
							className="flex flex-col items-center w-[30rem] px-2"
						>
							{/* <span className="mt-2 text-red-500 text-center">
								⚠ Live updates will be paused while changes are being made to this table (Not
								really)
							</span> */}
							<div className="flex gap-2 my-2">
								<Button
									onClick={() => saveReorder(
										responseRolled,
										setLoading,
										setReordered
									)}
									variant='outlined'
								>
									Save changes
								</Button>
								<Button
									onClick={() => {
										setResponseRolled(responseRolled1)
										setReordered(false)
									}}
									color='error'
								>
									Cancel
								</Button>
							</div>
						</div>
					</div>
					<Gacha />
				</section>
				<section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<PTWTable response={responseCasual} tableName="Casual" tableId="casual" />
					<PTWTable response={responseNonCasual} tableName="Non-Casual" tableId="noncasual" />
					<PTWTable response={responseMovies} tableName="Movies" tableId="movies" />
				</section>
				<LatencyBadge />
				{contextMenu.currentItem && <ContextMenu />}
				{isAdded && <AddRecordMenu />}
				<ConfirmModal 
					confirmModal={confirmModal}
					setConfirmModal={setConfirmModal}
					entryToDelete={entryToDelete}
					responseCasual={responseCasual}
					responseNonCasual={responseNonCasual}
					responseMovies={responseMovies}
					responseRolled={responseRolled}
				/>
			</main>
		</>
	)

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
					<button onClick={handleAddToCompleted} className="w-full">
						Add to Completed
					</button>
				</li>
				<li className="flex justify-center h-8 rounded-sm hover:bg-slate-500">
					<button onClick={() => setConfirmModalDelEntry()} className="w-full">
						Delete entry
					</button>
				</li>
			</menu>
		)

		async function handleAddToCompleted() {
			setLoading(true)
			try {
				await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/addtocompleted`, {
					content: responseRolled,
					id: contextMenu.currentItem?.id,
					type: 'PTW'
				}, { withCredentials: true })
				setLoading(false)
			} catch (error) {
				setLoading(false)
				alert(error)
			}
		}
	}

	function LatencyBadge() {
		function handleOpen(e: BaseSyntheticEvent) {
			if (!latencyBadgeRef.current) return
			const child = latencyBadgeRef.current.children[1] as HTMLSpanElement
			if (latencyBadgeRef.current.style.width != '18rem') {
				latencyBadgeRef.current.style.width = '18rem'
				child.style.display = 'block'
			} else {
				latencyBadgeRef.current.style.width = '8.6rem'
				child.style.display = 'none'
			}
		}

		return (
			<div
				onClick={handleOpen}
				ref={latencyBadgeRef}
				style={{
					width: '18rem'
				}}
				className="fixed bottom-6 left-6 flex items-center justify-between z-50 p-2 max-h-[2.5rem] max-w-[60vw] rounded-full bg-black border-pink-500 border-[1px] whitespace-nowrap overflow-hidden cursor-pointer ease-out transition-[width]"
			>
				<span ref={latencyRef} className="text-gray-300 p-1 pointer-events-none">
					Latency: -1.0ms
				</span>
				<span>
					<span className="text-gray-300 mx-auto pointer-events-none"> · </span>
					<span 
						ref={onlineUsersElementRef}
						className="text-gray-300 ml-4 pointer-events-none"
					>
						{onlineUsersRef.current} user(s) online
					</span>
				</span>
			</div>
		)
	}

	function Gacha() {
		function handleSubmit(e: BaseSyntheticEvent) {
			e.preventDefault()
			if (!responseCasual || !responseNonCasual || !responseMovies) return

			const target = e.target as any
			const categoryCasual = target[0].checked
			const movies = target[2].checked
			let concatArr
			if (movies) {
				concatArr = responseMovies?.concat(categoryCasual ? responseCasual : responseNonCasual)
			} else {
				concatArr = categoryCasual ? responseCasual : responseNonCasual
			}

			if (categoryCasual) {
				const randomTitle = concatArr?.[getRandomInt(responseCasual.length)].title!
				socket.emit('roll', {
					message: randomTitle
				})
				setRolledTitle(randomTitle)
			} else {
				const randomTitle = concatArr?.[getRandomInt(responseNonCasual.length)].title!
				socket.emit('roll', {
					message: randomTitle
				})
				setRolledTitle(randomTitle)
			}
		}

		function handleCancel() {
			socket.emit('roll', {
				message: '???'
			})
			setRolledTitle('???')
		}

		async function addGachaRoll() {
			const rolledTitle = rolledTitleElementRef.current?.innerText
			if (
				!responseCasual ||
				!responseNonCasual ||
				!responseMovies ||
				!responseRolled ||
				rolledTitle == '???'
			)
				return
			if (responseRolled.length >= 21) {
				alert('Unable to add roll to record, insufficient space.')
				return
			}

			socket.emit('roll', {
				message: rolledTitle,
				isLoading: true
			})
			setLoading(true)
			const isInMovies = responseMovies.find((item) => item.title.trim() == rolledTitle)

			if (isInMovies) {
				//? If rolled title is a movie
				const changed = responseMovies.slice().filter((item) => item.title.trim() != rolledTitle)

				const range = `L22:L${22 + responseMovies.length - 1}`
				const updatePayload = changed.map((item) => item.title)
				updatePayload.push('')

				const addCell = `N${responseRolled.length + 2}:N${responseRolled.length + 2}`
				try {
					await addRolledAPI(range, updatePayload, addCell)
					setLoading(false)
					socket.emit('roll', {
						message: '???',
						isLoading: false
					})
					setRolledTitle('???')
					return
				} catch (error) {
					socket.emit('roll', {
						message: rolledTitle,
						isLoading: false
					})
					setLoading(false)
					alert(error)
					return
				}
			}

			const isInCasual = responseCasual.find((item) => item.title.trim() == rolledTitle)

			if (isInCasual) {
				//? If rolled title is in category casual
				console.log('CASUAL')
				const changed = responseCasual.slice().filter((item) => item.title.trim() != rolledTitle)

				const range = `L2:L${responseCasual.length + 1}`
				const updatePayload = changed.map((item) => item.title)
				updatePayload.push('')

				const addCell = `N${responseRolled.length + 2}:N${responseRolled.length + 2}`
				try {
					await addRolledAPI(range, updatePayload, addCell)
					socket.emit('roll', {
						message: '???',
						isLoading: false
					})
					setLoading(false)
					setRolledTitle('???')
					return
				} catch (error) {
					socket.emit('roll', {
						message: rolledTitle,
						isLoading: false
					})
					setLoading(false)
					alert(error)
					return
				}
			} 
			
			const isInNonCasual = responseNonCasual.find((item) => item.title.trim() == rolledTitle)

			if (isInNonCasual) { 
				//? If rolled title is in category non-casual
				console.log('NONCASUAL')
				const changed = responseNonCasual.slice().filter((item) => item.title.trim() != rolledTitle)

				const range = `M2:M${responseNonCasual.length + 1}`
				const updatePayload = changed.map((item) => item.title)
				updatePayload.push('')

				const addCell = `N${responseRolled.length + 2}:N${responseRolled.length + 2}`
				try {
					await addRolledAPI(range, updatePayload, addCell)
					socket.emit('roll', {
						message: '???',
						isLoading: false
					})
					setLoading(false)
					setRolledTitle('???')
					return
				} catch (error) {
					socket.emit('roll', {
						message: rolledTitle,
						isLoading: false
					})
					setLoading(false)
					alert(error)
					return
				}
			}

			//? In case title is not found
			alert('Error: Rolled title not found. Check entries to make sure they have no special characters.')

			async function addRolledAPI(
				range: string,
				updatePayload: Array<string | null>,
				addCell: string
			) {
				await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/ptw/addrolled`, {
					deleteStep: {
						range: range,
						content: updatePayload
					},
					addStep: {
						cell: addCell,
						content: rolledTitle
					}
				}, { withCredentials: true })
			}
		}

		return (
			<div className="relative flex flex-col items-center justify-center gap-4 h-[30rem] w-[80dvw] md:w-[25rem] bg-slate-700 rounded-lg -translate-y-8">
				<h2 className="absolute top-5 p-2 text-2xl sm:text-3xl">Gacha</h2>
				<div className="absolute top-20 flex items-center justify-center h-52 max-h-52 w-80">
					<div className="max-h-full max-w-[90%] bg-slate-100 border-black border-solid border-[1px] overflow-auto">
						<h3 ref={rolledTitleElementRef} className="p-2 text-black text-xl sm:text-2xl text-center">
							???
						</h3>
					</div>
				</div>
				<div ref={addGachaRollRef} className="absolute bottom-36 invisible">
					<Button onClick={addGachaRoll} variant='outlined'>
						Add to List
					</Button>
					<CancelIcon
						onClick={handleCancel}
						className="absolute top-2 right-[-32px] cursor-pointer transition-colors duration-100 hover:text-red-500"
					/>
				</div>
				<form
					onSubmit={handleSubmit}
					className="absolute flex flex-col items-center gap-2 bottom-6"
				>
					<div className="flex">
						<label className="relative flex gap-1 items-center mr-3 radio-container">
							<div className="custom-radio" />
							<input type="radio" name="table_to_roll" value="Casual" defaultChecked />
							Casual
						</label>
						<label className="relative flex gap-1 items-center radio-container">
							<div className="custom-radio" />
							<input type="radio" name="table_to_roll" value="NonCasual" />
							Non-Casual
						</label>
					</div>
					<div className="flex gap-1">
						<label className="relative flex gap-1 items-center checkbox-container">
							<div className="custom-checkbox" />
							<DoneIcon fontSize="inherit" className="absolute checkmark" />
							<input type="checkbox" value="IncludeMovies" />
							Include movies?
						</label>
					</div>
					<Button type='submit' variant='outlined'>Roll</Button>
				</form>
			</div>
		)
	}

	function AddRecordMenu() {
		async function handleAddRecord(e: BaseSyntheticEvent) {
			e.preventDefault()
			const enteredTitle = e.target[0].value
			if (!enteredTitle || !isAdded?.response) return

			let cell = 'L';
			switch (isAdded.tableId) {
				case 'rolled':
					cell = 'N'
					break
				case 'movies':
					cell = 'L'
				case 'casual':
					cell = 'L'
					break
				case 'noncasual':
					cell = 'M'
					break
			}
	
			setLoading(true)
			
			try {
				if (isAdded.tableId == 'movies') {
					if (isAdded.response.length >= 5) {
						setLoading(false)
						alert('No space left')
						return
					}
					await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/update`, {
						content: enteredTitle,
						cell: cell + (isAdded.response.length + 22).toString()
					}, { withCredentials: true })
				} else if (isAdded.tableId == 'rolled') {
					if (isAdded.response.length >= 21) {
						setLoading(false)
						alert('No space left')
						return
					}
					await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/update`, {
						content: enteredTitle,
						cell: cell + (isAdded.response.length + 2).toString()
					}, { withCredentials: true })
				} else {
					if (isAdded.response.length >= 15) {
						setLoading(false)
						alert('No space left')
						return
					}
					await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/update`, {
						content: enteredTitle,
						cell: cell + (isAdded.response.length + 2).toString()
					}, { withCredentials: true })
				}
				setIsAdded(null)
				setLoading(false)
			} catch (error) {
				setLoading(false)
				alert(error)
				return
			}
		}

		if (!isAdded) return null
		return (
			<menu 
				style={{
					top: isAdded.top + 38,
					left: isAdded.left - (isAdded.tableId == 'rolled' ? 280 : 190)
				}}
				className='absolute top-14 z-10 p-1 rounded-lg bg-black border-[1px] border-pink-400'
			>
				<form onSubmit={handleAddRecord}>
					<input placeholder='Insert title' className='w-60 text-lg rounded-sm bg-gray-800 focus:outline-none' />
				</form>
			</menu>
		)
	}

	function handleAddMenu(
		e: BaseSyntheticEvent, 
		response: Database['public']['Tables']['PTW-Casual']['Row'][] | undefined, 
		tableId: 'rolled' | 'casual' | 'noncasual' | 'movies'
	) {
		const { top, left } = e.target.getBoundingClientRect()

		setIsAdded({ 
			top: top + window.scrollY,
			left: left + window.scrollX,
			response, 
			tableId 
		 })
	}

	function handleDeleteUnrolled(
		tableId: 'casual' | 'noncasual' | 'movies',
		item: { id: number; title: string; }
	) {
		entryToDelete.current = { tableId, item }
		setConfirmModal(true)
	}

	function PTWTable({
		response,
		tableName,
		tableId
	}: {
		response: Database['public']['Tables']['PTW-Casual']['Row'][] | undefined
		tableName: string
		tableId: 'casual' | 'noncasual' | 'movies'
	}) {
		return (
			<section className="relative flex flex-col items-center">
				<header className='flex items-center'>
					<h2 className="p-2 text-2xl sm:text-3xl">{tableName}</h2>
					<div
						title='Add new entry' 
						tabIndex={0}
						onClick={(e) => handleAddMenu(e, response, tableId)} 
						className='flex items-center justify-center h-7 w-7 cursor-pointer rounded-full hover:bg-gray-500 transition-colors duration-150 sm:translate-y-[2px]'
					>
						<AddIcon />
					</div>
				</header>
				<table>
					<thead>
						<tr>
							<th className="w-[100dvw] sm:w-[30rem]">
								<span>Title</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{isLoadingClient ? 
						loadingGlimmer(1) : 
						response?.map((item) => (
							<tr key={item.id}>
								<td
									style={{
										opacity: isLoadingEditForm.includes(`${tableId}_title_${item.id}`)
											? 0.5
											: 1
									}}
									onDoubleClick={() => {
										setIsEdited(`${tableId}_${item.title}_${item.id}`)
									}}
									className="relative group"
								>
									<span className='pr-4'>
										{isEdited == `${tableId}_${item.title}_${item.id}`
											? EditForm(`${tableId}_title`, item.id, item.title!, editFormParams)
											: item.title}
									</span>
									{isLoadingEditForm.includes(`${tableId}_title_${item.id}`) && (
										<CircularProgress size={30} className="absolute top-[20%] left-[48%]" />
									)}
									<div
										onClick={() => handleDeleteUnrolled(tableId, item)}
										className="absolute flex items-center justify-center top-1/2 right-1 -translate-y-1/2 z-10 h-7 w-7 invisible group-hover:visible cursor-pointer rounded-full hover:bg-gray-500 transition-colors duration-150"
									>
										<DeleteOutlineIcon />
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		)
	}
}

//* Confirm deletes
function ConfirmModal({
	confirmModal,
	setConfirmModal,
	entryToDelete,
	responseCasual,
	responseNonCasual,
	responseMovies,
	responseRolled
}: {
	confirmModal: boolean;
	setConfirmModal: Dispatch<SetStateAction<boolean>>;
	entryToDelete: MutableRefObject<any>;
	responseCasual: Database['public']['Tables']['PTW-Casual']['Row'][] | undefined;
	responseNonCasual: Database['public']['Tables']['PTW-NonCasual']['Row'][] | undefined;
	responseMovies: Database['public']['Tables']['PTW-Movies']['Row'][] | undefined;
	responseRolled: Database['public']['Tables']['PTW-Rolled']['Row'][] | undefined;
}) {
	const { setLoading } = useLoading()

	async function handleDelete() {
		if (entryToDelete.current.tableId) {
			let responseTable
			switch (entryToDelete.current.tableId) {
				case 'casual':
					responseTable = responseCasual
					break
				case 'noncasual':
					responseTable = responseNonCasual
					break
				case 'movies':
					responseTable = responseMovies
					break
				default:
					break
			}
			setLoading(true)
			try {
				await axios.delete('/api/deleteentry', {
					data: {
						content: responseTable,
						id: entryToDelete.current.item.id,
						tableId: entryToDelete.current.tableId,
						type: 'PTW_UNROLLED'
					}
				})
				setConfirmModal(false)
				setLoading(false)
			} catch (error) {
				setLoading(false)
				console.log(error)
				alert(error)
			}
		} else {
			setLoading(true)
			try {
				await axios.delete('/api/deleteentry', {
					data: {
						content: responseRolled,
						id: entryToDelete.current.id,
						type: 'PTW'
					}
				})
				setConfirmModal(false)
				setLoading(false)
			} catch (error) {
				setLoading(false)
				alert(error)
			}
		}
	}

	return (
		<Dialog
			fullWidth
			maxWidth="xs"
			open={confirmModal}
			onClose={() => setConfirmModal(false)}
		>
			<div className='p-2'>
				<DialogTitle fontSize='large'>
					Confirm delete entry?
				</DialogTitle>
				<DialogActions>
					<Button 
						onClick={handleDelete}
						variant='outlined' 
					>
						Yes
					</Button>
					<Button 
						onClick={() => setConfirmModal(false)}
						color='error' 
					>
						No
					</Button>
				</DialogActions>
			</div>
		</Dialog>
	)
}

function PTWRolledTableItem({ props, editFormParams }: PTWRolledTableItemProps) {
	const { item, index, isLoadingEditForm, setIsEdited, isEdited, isEditedRef, sortMethodRef, setContextMenu, contextMenuButtonRef, responseRolled, setResponseRolled, setIsLoadingEditForm } = props
	const controls = useDragControls()
	const statusColor = determineStatus(item)
	return (
		<Reorder.Item 
			value={item}
			dragListener={false}
			dragControls={controls}
			dragConstraints={{ top: -25, bottom: 25 }}
			dragElastic={0.15}
			className="grid grid-cols-[4fr_1.1fr] p-0 bg-[#2e2e2e] hover:bg-neutral-700"
		>
			<div
				style={{
					opacity: isLoadingEditForm.includes(`rolled_title_${item.id}`) ? 0.5 : 1
				}}
				onDoubleClick={() => setIsEdited(`rolled_${item.title}_${item.id}`)}
				className="relative p-2 text-center group"
			>
				<span className=" cursor-text">
					{isEdited == `rolled_${item.title}_${item.id}`
						? EditForm('rolled_title', item.id, item.title!, editFormParams)
						: item.title}
				</span>
				{isLoadingEditForm.includes(`rolled_title_${item.id}`) && (
					<CircularProgress size={30} className="absolute top-[20%] left-[48%]" />
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
				<div
					onPointerDown={(e) => controls.start(e)}
					style={{ visibility: sortMethodRef.current ? 'hidden' : 'visible' }}
					className='absolute top-1/2 right-0 flex items-center justify-center h-7 w-7 cursor-grab rounded-full transition-colors duration-150 -translate-y-1/2'
				>
					<DragIndicatorIcon sx={{ color: 'silver'}} />
				</div>
			</div>
			<div
				style={{
					backgroundColor: statusColor,
					opacity: isLoadingEditForm.includes(`status_${item.id}`) ? 0.5 : 1
				}}
				onDoubleClick={() => {
					setIsEdited(`rolled_status_${item.id}`)
				}}
				className="relative flex items-center justify-center"
			>
				<span className='flex items-center justify-center'>
					{isEdited == `rolled_status_${item.id}`
						? editStatus(item.id, item.status!)
						: ''}
				</span>
				{isLoadingEditForm.includes(`rolled_status_${item.id}`) && (
					<CircularProgress size={30} className="absolute top-[16%] left-[35%]" />
				)}
			</div>
		</Reorder.Item>
	)

	function editStatus(id: number, ogvalue: string) {
		async function handleSubmit(event: BaseSyntheticEvent) {
			event.preventDefault()
			const currentlyProcessedEdit = isEditedRef.current

			if (ogvalue == event.target[0].value) {
				setIsEdited('')
				return
			}

			setIsLoadingEditForm(isLoadingEditForm.concat(`rolled_status_${id}`))

			let row = id + 2
			try {
				await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/updatestatus`, {
					content: event.target.childNodes[0].value,
					cells: `N${row}:N${row}`
				}, { withCredentials: true })

				const changed = responseRolled?.slice()
				if (!changed) return
				changed.find((item: any) => item.id === id)!['status'] = event.target.childNodes[0].value
				setResponseRolled(changed)
				if (isEditedRef.current == currentlyProcessedEdit) setIsEdited('')
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `rolled_status_${id}`))
			} catch (error) {
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `rolled_status_${id}`))
				alert(error)
				return
			}
		}

		return (
			<div
				style={{ backgroundColor: isLoadingEditForm.includes(`rolled_status_${id}`) ? 'black' : 'unset' }}
				className="flex items-center justify-center relative w-full"
			>
				<div
					style={{
						opacity: isLoadingEditForm.includes(`rolled_status_${id}`) ? 0.5 : 1,
						pointerEvents: isLoadingEditForm.includes(`rolled_status_${id}`) ? 'none' : 'unset'
					}}
					className="w-full"
				>
					<form onSubmit={handleSubmit} className="text-gray-800">
						<select
							onChange={(e) => (e.target.parentNode as HTMLFormElement)!.requestSubmit()}
							className="p-2 h-full w-full select-none text-white bg-[#2e2e2e] rounded-md"
						>
							<option>Select status</option>
							<option>Loaded</option>
							<option>Not loaded</option>
						</select>
					</form>
				</div>
			</div>
		)
	}

	function handleMenuClick(
		e: BaseSyntheticEvent,
		item: Database['public']['Tables']['PTW-Rolled']['Row']
	) {
		const { top, left } = e.target.getBoundingClientRect()

		setContextMenu({
			top: top + window.scrollY,
			left: left + window.scrollX + 25,
			currentItem: item
		})
	}

	function determineStatus(item: Database['public']['Tables']['PTW-Rolled']['Row']) {
		let status
		switch (item.status) {
			case 'Not loaded':
				status = 'crimson'
				break
			case 'Loaded':
				status = 'orange'
				break
			case 'Watched':
				status = 'green'
				break
			case 'Not aired':
				status = 'black'
				break
			default:
				status = ''
		}
		return status
	}
}

//* Input field for editing any table items
function EditForm(
	field: 'rolled_title' | 'casual_title' | 'noncasual_title' | 'movies_title',
	id: number,
	ogvalue: string,
	{
		isLoadingEditForm,
		setIsLoadingEditForm,
		isEditedRef,
		setIsEdited,
		responseRolled,
		responseCasual,
		responseNonCasual,
		responseMovies,
		setResponseRolled,
		setResponseCasual,
		setResponseNonCasual,
		setResponseMovies
	}: EditFormParams
): React.ReactNode {
	let column: string
	let row = (id + 2).toString()
	if (field == 'movies_title') row = (id + 22).toString()
	switch (field) {
		case 'rolled_title':
			column = 'N'
			break
		case 'casual_title':
			column = 'L'
			break
		case 'noncasual_title':
			column = 'M'
			break
		case 'movies_title':
			column = 'L'
			break
		default:
			alert('Error: missing field')
			return
	}

	async function handleSubmit(event: BaseSyntheticEvent): Promise<void> {
		event.preventDefault()
		const currentlyProcessedEdit = isEditedRef.current

		if (ogvalue == event.target[0].value) {
			setIsEdited('')
			return
		}

		setIsLoadingEditForm(isLoadingEditForm.concat(`${field}_${id}`))

		try {
			await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/update`, {
				content: event.target[0].value,
				cell: column + row
			}, { withCredentials: true })

			switch (field) {
				case 'rolled_title':
					changeResponse(responseRolled, setResponseRolled)
					break
				case 'casual_title':
					changeResponse(responseCasual, setResponseCasual)
					break
				case 'noncasual_title':
					changeResponse(responseNonCasual, setResponseNonCasual)
					break
				case 'movies_title':
					changeResponse(responseMovies, setResponseMovies)
					break
			}
		} catch (error) {
			alert(error)
			return
		}

		function changeResponse(response: Array<{[key: string]: any}> | undefined, setResponse: Dispatch<SetStateAction<any>>, ) {
			const changed = response?.slice()
			if (!changed) return
			changed.find((item) => item.id === id)!['title'] = event.target[0].value
			setResponse(changed)
			if (isEditedRef.current == currentlyProcessedEdit) setIsEdited('')
			setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${id}`))
		}
	}

	return (
		<div className="flex items-center justify-center relative w-full">
			<div
				style={{
					opacity: isLoadingEditForm.includes(`${field}_${id}`) ? 0.5 : 1,
					pointerEvents: isLoadingEditForm.includes(`${field}_${id}`) ? 'none' : 'unset'
				}}
				className="w-[85%]"
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

async function saveReorder(
	responseRolled: Database['public']['Tables']['PTW-Rolled']['Row'][] | undefined,
	setLoading: Dispatch<SetStateAction<boolean>>,
	setReordered: (value: boolean) => boolean
) {
	setLoading(true)
	let endRowIndex = responseRolled!.length + 1
	try {
		await axios.post('/api/ptw/reorder', {
			content: responseRolled,
			cells: `N2:N${endRowIndex}`,
			type: 'PTW'
		})

		setReordered(false)
		setLoading(false)
	} catch (error) {
		setLoading(false)
		alert(error)
		console.log(error)
		return
	}
}

