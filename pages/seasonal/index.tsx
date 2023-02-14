import { createClient } from '@supabase/supabase-js'
import { Database } from '../../lib/database.types'
import { BaseSyntheticEvent, useEffect, useState, useRef, MutableRefObject, Dispatch, SetStateAction } from 'react'
import Head from 'next/head'
import axios from 'axios'
import { CircularProgress } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useLoading } from '../../components/LoadingContext'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Reorder, useDragControls } from 'framer-motion'
import isEqual from 'lodash/isEqual'
import Link from 'next/link'
import { useRouter } from 'next/router'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'

//TODO: Allow sort, and show save changes button to save sort

export default function Seasonal() {
	const settingsMenuRef = useRef<HTMLDivElement>(null)
	const settingsMenuButtonRef = useRef<HTMLDivElement>(null)
	const addRecordMenuRef = useRef<HTMLMenuElement>(null)
	const addRecordButtonRef = useRef<HTMLDivElement>(null)
	const contextMenuRef = useRef<HTMLDivElement>(null)
	const contextMenuButtonRef = useRef<any>([])
	const isEditedRef = useRef('')
	const statusRef = useRef<HTMLSpanElement>(null)

	const [response, setResponse] = useState<any>()
	const [response1, setResponse1] = useState<any>()
	const [isEdited, setIsEditedState] = useState<string>('')
	const [isLoadingEditForm, setIsLoadingEditForm] = useState<Array<string>>([])
	const [isAdded, setIsAdded] = useState(false)
	const [settingsMenu, setSettingsMenu] = useState<{
		top: number
		left: number
		display: string
	}>({ top: 0, left: 0, display: 'none' })
	const [contextMenu, setContextMenu] = useState<{
		top: number
		left: number
		currentItem: any | null
	}>({ top: 0, left: 0, currentItem: null })
	const [confirmModal, setConfirmModal] = useState(false)
	const [reordered, setReordered] = useState(false)
	const { setLoading } = useLoading()

	const router = useRouter()

	const setIsEdited = (value: string) => {
		isEditedRef.current = value
		setIsEditedState(value)
	}

	useEffect(() => {
		const supabase = createClient<Database>(
			'https://esjopxdrlewtpffznsxh.supabase.co',
			process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
		)
		const getData = async () => {
			const { data } = await supabase
				.from('PTW-CurrentSeason')
				.select('*, SeasonalDetails!left( mal_id, start_date, latest_episode )')
				.order('order', { ascending: true })

			setResponse(data!)
			setResponse1(data!)

			await axios
				.get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/refresh`)
				.catch((error) => console.log(error))
		}
		getData()

		const databaseChannel = supabase
			.channel('public:PTW-CurrentSeason')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'PTW-CurrentSeason' },
				async (payload) => {
					const { data } = await supabase
						.from('PTW-CurrentSeason')
						.select('*, SeasonalDetails!left( mal_id, start_date, latest_episode )')
						.order('order', { ascending: true })
					setResponse(data!)
				}
			)
			.subscribe()

		const statusInterval = setInterval(() => {
			if (supabase.getChannels()[0].state == 'joined') {
				statusRef.current!.innerHTML = 'Connected'
				statusRef.current!.style.color = 'limegreen'
			} else {
				statusRef.current!.innerHTML = 'Offline'
				statusRef.current!.style.color = 'orangered'
			}
		}, 1000)

		const refresh = setInterval(
			() => axios.get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/refresh`),
			3500000
		)
		
		const closeMenusOnClick = (e: any) => {
			if (e.target?.tagName !== 'INPUT' && e.target?.tagName !== 'SELECT') {
				setIsEdited('')
			}
			if (
				e.target.parentNode !== addRecordButtonRef.current &&
				e.target.parentNode?.parentNode !== addRecordButtonRef.current &&
				!addRecordMenuRef.current?.contains(e.target)
			) {
				setIsAdded(false)
			}
			if (
				e.target.parentNode !== settingsMenuButtonRef.current &&
				!settingsMenuRef.current?.contains(e.target) &&
				settingsMenuRef.current
			) {
				setSettingsMenu({ top: 0, left: 0, display: 'none' })
			}
			if (
				!contextMenuButtonRef.current.includes(e.target.parentNode) &&
				!contextMenuButtonRef.current.includes(e.target.parentNode?.parentNode) &&
				!contextMenuRef.current?.contains(e.target) &&
				contextMenuRef.current
			) {
				setContextMenu({ top: 0, left: 0, currentItem: null })
			}
		}

		const closeMenusOnFocusout = () => {
			setIsEdited('')
		}

		const closeMenusOnEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setIsEdited('')
		}

		document.addEventListener('click', closeMenusOnClick)
		window.addEventListener('focusout', closeMenusOnFocusout)
		window.addEventListener('keydown', closeMenusOnEscape)

		return () => {
			databaseChannel.unsubscribe()
			clearInterval(refresh)
			clearInterval(statusInterval)
			document.removeEventListener('click', closeMenusOnClick)
			window.removeEventListener('focusout', closeMenusOnFocusout)
			window.removeEventListener('keydown', closeMenusOnEscape)
		}
	}, [])

	if (!response) return null
	return (
		<>
			<Head>
				<title>Cytube Watchlist</title>
				<meta name="description" content="Current Season" />
			</Head>

			<main className="flex flex-col items-center justify-center mb-24 px-6 py-2">
				<span
					ref={statusRef}
					className='fixed top-0 left-8 z-[60] m-4 font-semibold lg:visible invisible'
				></span>
				<section className='relative flex flex-col items-center'>
					<header className='flex items-center mb-2'>
						<h2 className="p-2 text-2xl sm:text-3xl">Current Season</h2>
						<div
							ref={settingsMenuButtonRef}
							tabIndex={0}
							onClick={handleSettingsMenu}
							className="flex items-center justify-center h-7 w-7 cursor-pointer rounded-full hover:bg-gray-500 transition-colors duration-150 translate-y-[2px]"
						>
							<MoreVertIcon sx={{ fontSize: 28 }} />
						</div>
						<div
							ref={addRecordButtonRef}
						 	title='Add new entry'
							tabIndex={0}
							onClick={() => setIsAdded(true)} 
							className='flex items-center justify-center h-7 w-7 cursor-pointer rounded-full hover:bg-gray-500 transition-colors duration-150 translate-y-[2px]'
						>
							<AddIcon />
						</div>
					</header>
					{isAdded && 
					<menu ref={addRecordMenuRef} className='absolute top-14 z-10 p-1 rounded-lg bg-black border-[1px] border-pink-400'>
						<form onSubmit={handleAddRecord}>
							<input placeholder='Insert title' className='w-60 text-lg rounded-sm bg-gray-800 focus:outline-none' />
						</form>
					</menu>}
					<div className="grid grid-cols-[5fr_1fr] lg:grid-cols-[30rem_10rem_10rem_8rem] min-w-[95dvw] lg:min-w-0 w-min bg-sky-600 border-white border-solid border-[1px]">
						<span className='flex items-center justify-center p-2 h-full border-white border-r-[1px] text-center font-bold'>
							Title
						</span>
						<span className='flex items-center justify-center p-2 h-full border-white lg:border-r-[1px] text-center font-bold'>
							Status
						</span>
						<span className='hidden lg:flex items-center justify-center p-2 h-full border-white border-r-[1px] text-center font-bold'>
							Start Date
						</span>
						<span className='hidden lg:flex items-center justify-center p-2 h-full text-center font-bold'>
							Latest Episode
						</span>
					</div>
					<Reorder.Group
						values={response}
						/* draggable={sortMethod ? true : false} */
						onReorder={(newOrder) => {
							setResponse(newOrder)
							setReordered(true)
						}}
						className="flex flex-col lg:w-[40rem] min-w-[95dvw] lg:min-w-full w-min border-white border-[1px] border-t-0"
					>
						{response?.map((item: any, index: any) => (
							<Item 
								key={item.order} 
								props={{ item, index, setIsLoadingEditForm, isLoadingEditForm, setIsEdited, isEdited, isEditedRef, contextMenuButtonRef, setContextMenu, response, setResponse }}
							/>
						))}
					</Reorder.Group>
					<div
						style={{
							visibility: reordered && !isEqual(response, response1) ? 'visible' : 'hidden'
						}}
						className="flex flex-col items-center w-[30rem] px-2"
					>
						{/* <span className="mt-2 text-red-500 text-center">
							⚠ Live updates will be paused while changes are being made to this table (Not
							really)
						</span> */}
						<div className="flex gap-2 my-2">
							<button
								className="input-submit p-2 rounded-md"
								onClick={() => {
									saveReorder()
									setReordered(false)
								}}
							>
								Save Changes
							</button>
							<button
								className="input-submit p-2 rounded-md"
								onClick={() => {
									setResponse(response1)
									setReordered(false)
								}}
							>
								Cancel
							</button>
						</div>
					</div>
				</section>
				{contextMenu.currentItem && <ContextMenu />}
				{settingsMenu.display == 'block' && <SettingsMenu />}
				{confirmModal && <ConfirmModal />}
			</main>
		</>
	)
	
	function ContextMenu() {
		async function loadItemDetails() {
			if (!contextMenu.currentItem) return
			setLoading(true)
			try {
				await axios.post('/api/seasonaldetails/loaditem', {
					title: contextMenu.currentItem.title
				})
				router.reload()
			} catch (error) {
				setLoading(false)
				alert(error)
				console.log(error)
				return
			}
		}

		async function handleAddToCompleted() {
			setLoading(true)
			try {
				await axios.post('/api/addtocompleted', {
					content: response1,
					id: contextMenu.currentItem?.title,
					type: 'SEASONAL'
				})
				setLoading(false)
			} catch (error) {
				setLoading(false)
				alert(error)
			}
		}

		return (
			<menu
				ref={contextMenuRef}
				style={{
					top: contextMenu.top,
					left: contextMenu.left
				}}
				className="absolute z-10 p-2 shadow-md shadow-gray-600 bg-slate-200 text-black rounded-sm border-black border-solid border-2 seasonal-context-menu"
			>
				<li className="flex justify-center">
					<span className="text-center font-semibold line-clamp-2">
						{contextMenu.currentItem?.title}
					</span>
				</li>
				<hr className="my-2 border-gray-500 border-t-[1px]" />
				{contextMenu.currentItem.SeasonalDetails?.[0]?.mal_id && 
				<li className="flex justify-center h-8 rounded-sm hover:bg-slate-500">
					<Link
						href={`https://myanimelist.net/anime/${contextMenu.currentItem.SeasonalDetails[0].mal_id}`} 
						target='_blank' 
						rel='noopener noreferrer' 
						className="p-1 w-full text-center"
					>
						Visit on MAL
					</Link>
				</li>}
				<li className="flex justify-center h-8 rounded-sm hover:bg-slate-500">
					<button onClick={loadItemDetails} className="w-full">
						Load details
					</button>
				</li>
				<li className="flex justify-center h-8 rounded-sm hover:bg-slate-500">
					<button onClick={handleAddToCompleted} className="w-full">
						Add to Completed
					</button>
				</li>
			</menu>
		)
	}

	async function saveReorder() {
		if (!response) return
		setLoading(true)
		let endRowIndex = response.length + 1
		try {
			await axios.post('/api/ptw/reorder', {
				content: response,
				cells: `O2:P${endRowIndex}`,
				type: 'SEASONAL'
			})

			setLoading(false)
			setReordered(false)
		} catch (error) {
			setLoading(false)
			alert(error)
			console.log(error)
			return
		}
	}

	function ConfirmModal() {
		async function handleDeleteAll() {
			setLoading(true)
		
			try {
				await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/update`, {
					content: '',
					cell: 'O2:O22',
					type: 'MULTI',
					length: 21
				})
				setConfirmModal(false)
				setLoading(false)
			} catch (error) {
				setLoading(false)
				alert(error)
				return
			}
		}

		return (
			<menu>
				<div className="fixed top-0 left-0 h-[100dvh] w-[100dvw] bg-black opacity-30" />
				<div className="fixed flex flex-col items-center justify-center gap-4 h-[15rem] w-[30rem] px-10 py-6 bg-gray-700 rounded-md shadow-md shadow-black drop-shadow-md border-4 border-black top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 modal">
					<h3 className='text-2xl'>Confirm Delete All Entries?</h3>
					<div className='flex gap-4'>
						<button onClick={handleDeleteAll} className='px-3 py-1 input-submit'>Yes</button>
						<button onClick={() => setConfirmModal(false)} className='px-3 py-1 input-submit'>No</button>
					</div>
				</div>
			</menu>
		)
	}

	function SettingsMenu() {
		return (
			<menu
				ref={settingsMenuRef}
				style={{
					top: settingsMenu.top,
					left: settingsMenu.left
				}}
				className="absolute z-20 p-2 shadow-md shadow-black bg-black border-pink-400 border-[1px] rounded-md seasonal-settings-menu"
			>
				<li className="flex justify-center h-fit rounded-md hover:bg-pink-400">
					<button onClick={() => setConfirmModal(true)} className="py-2 w-full">
						Delete All
					</button>
				</li>
			</menu>
		)
	}

	function handleSettingsMenu(e: BaseSyntheticEvent) {
		const { top, left } = e.target.getBoundingClientRect()

		setSettingsMenu({
			top: top + window.scrollY,
			left: left + window.scrollX - 160,
			display: 'block'
		})
	}

	async function handleAddRecord(e: BaseSyntheticEvent) {
		e.preventDefault()
		const enteredTitle = e.target[0].value
		if (!enteredTitle || !response) return

		setLoading(true)
		
		try {
			if (response.length >= 21) {
				setLoading(false)
				alert('No space left')
				return
			}
			await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/update`, {
				content: enteredTitle,
				cell: 'O' + (response.length + 2).toString()
			})
			setIsAdded(false)
			setLoading(false)
		} catch (error) {
			setLoading(false)
			alert(error)
			return
		}
	}
}

interface ItemProps { 
	props: {
		item: any, 
		index: number,
		setIsLoadingEditForm: Dispatch<SetStateAction<string[]>>,
		isLoadingEditForm: string[],
		setIsEdited: (value: string) => void,
		isEdited: string,
		isEditedRef: MutableRefObject<string>,
		contextMenuButtonRef: MutableRefObject<any>,
		setContextMenu: Dispatch<SetStateAction<{
			top: number;
			left: number;
			currentItem: any | null;
		}>>,
		response: any,
		setResponse: Dispatch<any>
	}
}

function Item({ props }: ItemProps) {
	const { item, index, setIsLoadingEditForm, isLoadingEditForm, setIsEdited, isEdited, isEditedRef, contextMenuButtonRef, setContextMenu, response, setResponse } = props
	const controls = useDragControls()
	const statusColor = determineStatus(item)
	const startDate = new Date(item?.SeasonalDetails?.[0]?.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
	return (
		<Reorder.Item 
			value={item}
			dragListener={false}
      dragControls={controls}
			dragConstraints={{ top: -25, bottom: 25 }}
			dragElastic={0.15}
			className="grid grid-cols-[5fr_1fr] lg:grid-cols-[30rem_10rem_10rem_8rem] p-0 bg-[#2e2e2e] hover:bg-neutral-700"
		>
			<div
				style={{
					opacity: isLoadingEditForm.includes(`seasonal_title_${item.order}`) ? 0.5 : 1
				}}
				onDoubleClick={() => {
					setIsEdited(`seasonal_title_${item.title}_${item.order}`)
				}}
				className="relative p-2 text-center group"
			>
				<span 
					style={{ margin: isEdited == `seasonal_title_${item.title}_${item.order}` ? 0 : '0 1rem' }}
					className='cursor-text'
				>
					{isEdited == `seasonal_title_${item.title}_${item.order}`
						? editForm(`seasonal_title`, item.order, item.title!)
						: item.title}
				</span>
				{isLoadingEditForm.includes(`seasonal_title_${item.order}`) && (
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
			</div>
			<div
				style={{
					backgroundColor: statusColor,
					opacity: isLoadingEditForm.includes(`status_${item.order}`) ? 0.5 : 1
				}}
				onDoubleClick={() => {
					setIsEdited(`seasonal_status_${item.title}_${item.order}`)
				}}
				className="relative flex items-center justify-center"
			>
				<span className='flex items-center justify-center'>
					{isEdited == `seasonal_status_${item.title}_${item.order}`
						? editStatus(item.order, item.title!, item.status)
						: ''}
				</span>
				{isLoadingEditForm.includes(`status_${item.order}`) && (
					<CircularProgress size={30} className="absolute top-[20%] left-[48%]" />
				)}
			</div>
			<div className='hidden lg:flex items-center justify-center'>
				{startDate != 'Invalid Date' ? startDate : 'N/A'}
			</div>
			<div className='relative hidden lg:flex items-center justify-center'>
				{item?.SeasonalDetails?.[0]?.latest_episode ?? 'N/A'}
				<div
					onPointerDown={(e) => controls.start(e)}
					className="absolute top-1/2 right-0 z-10 flex items-center justify-center h-7 w-7 cursor-grab rounded-full transition-colors duration-150 -translate-y-1/2"
				>
					<DragIndicatorIcon sx={{ color: 'silver'}} />
				</div>
			</div>
		</Reorder.Item>
	)

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

	function editForm(field: 'seasonal_title', order: number, ogvalue: string): React.ReactNode {
		let column: string
		let row = (order + 2).toString()
		switch (field) {
			case 'seasonal_title':
				column = 'O'
				break
		}

		async function handleSubmit(event: BaseSyntheticEvent): Promise<void> {
			event.preventDefault()
			const currentlyProcessedEdit = isEditedRef.current

			if (ogvalue == event.target[0].value) {
				setIsEdited('')
				return
			}

			setIsLoadingEditForm(isLoadingEditForm.concat(`${field}_${order}`))

			try {
				await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/update`, {
					content: event.target[0].value,
					cell: column + row
				})

				if (isEditedRef.current == currentlyProcessedEdit) setIsEdited('')
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${order}`))
			} catch (error) {
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${order}`))
				alert(error)
				return
			}
		}

		return (
			<div className="flex items-center justify-center relative w-full">
				<div
					style={{
						opacity: isLoadingEditForm.includes(`seasonal_title_${order}`) ? 0.5 : 1,
						pointerEvents: isLoadingEditForm.includes(`seasonal_title_${order}`) ? 'none' : 'unset'
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

	function editStatus(order: number, title: string, ogvalue: string) {
		async function handleSubmit(event: BaseSyntheticEvent) {
			event.preventDefault()
			const currentlyProcessedEdit = isEditedRef.current

			if (ogvalue == event.target[0].value) {
				setIsEdited('')
				return
			}

			setIsLoadingEditForm(isLoadingEditForm.concat(`status_${order}`))

			let row = order + 2
			try {
				await axios.post('/api/seasonal/updatestatus', {
					content: event.target.childNodes[0].value,
					cells: `P${row}:P${row}`
				})

				const changed = response?.slice()
				if (!changed) return
				changed.find((item: any) => item.order === order)!['status'] = event.target.childNodes[0].value
				setResponse(changed)
				if (isEditedRef.current == currentlyProcessedEdit) setIsEdited('')
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `status_${order}`))
			} catch (error) {
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `status_${order}`))
				alert(error)
				return
			}
		}

		return (
			<div
				style={{ backgroundColor: isLoadingEditForm.includes(`status_${order}`) ? 'black' : 'unset' }}
				className="flex items-center justify-center relative w-full"
			>
				<div
					style={{
						opacity: isLoadingEditForm.includes(`status_${order}`) ? 0.5 : 1,
						pointerEvents: isLoadingEditForm.includes(`status_${order}`) ? 'none' : 'unset'
					}}
					className="w-full"
				>
					<form onSubmit={handleSubmit} className="text-gray-800">
						<select
							onChange={(e) => {
								;(e.target.parentNode as HTMLFormElement)!.requestSubmit()
							}}
							className="p-2 h-full w-full select-none text-white bg-[#2e2e2e] rounded-md"
						>
							<option>Select status</option>
							<option>Watched</option>
							<option>Loaded</option>
							<option>Not loaded</option>
							<option>Not aired</option>
						</select>
					</form>
				</div>
			</div>
		)
	}

	function determineStatus(item: Database['public']['Tables']['PTW-CurrentSeason']['Row']) {
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