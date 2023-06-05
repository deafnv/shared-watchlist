import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BaseSyntheticEvent, useEffect, useState, useRef, RefObject, Dispatch, SetStateAction, MutableRefObject } from 'react'
import axios from 'axios'
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion'
import isEqual from 'lodash/isEqual'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CloseIcon from '@mui/icons-material/Close'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { Seasonal } from '@prisma/client'
import { CurrentSeasonIsEdited, CurrentSeasonIsLoading, SeasonalWithDetails, SeasonalTableItemProps } from '@/lib/types'
import { updaterSocket } from '@/lib/socket'
import { useLoading } from '@/components/LoadingContext'

//TODO: Allow sort, and show save changes button to save sort
//TODO: Show error mesages on failed to load data

interface SettingsMenuPos {
	top: number;
	left: number;
	display: boolean;
}

export default function Seasonal() {
	const settingsMenuRef = useRef<HTMLMenuElement>(null)
	const settingsMenuButtonRef = useRef<HTMLDivElement>(null)
	const addRecordMenuRef = useRef<HTMLMenuElement>(null)
	const addRecordButtonRef = useRef<HTMLDivElement>(null)
	const contextMenuRef = useRef<HTMLDivElement>(null)
	const contextMenuButtonRef = useRef<any>([])
	const isEditedRef = useRef<CurrentSeasonIsEdited>('')
	const entryToDelete = useRef<SeasonalWithDetails | null>(null)

	const [response, setResponse] = useState<SeasonalWithDetails[]>()
	const [response1, setResponse1] = useState<SeasonalWithDetails[]>()
	const [isLoadingClient, setIsLoadingClient] = useState(true)
	const [isEdited, setIsEditedState] = useState<CurrentSeasonIsEdited>('')
	const [isLoadingEditForm, setIsLoadingEditForm] = useState<CurrentSeasonIsLoading[]>([])
	const [isAdded, setIsAdded] = useState(false)
	const [settingsMenu, setSettingsMenu] = useState<SettingsMenuPos>({ top: 0, left: 0, display: false })
	const [contextMenu, setContextMenu] = useState<{
		top: number
		left: number
		currentItem: SeasonalWithDetails | null
	}>({ top: 0, left: 0, currentItem: null })
	const [confirmModal, setConfirmModal] = useState<'' | 'DELETE' | 'DELETEALL'>('')
	const [editModal, setEditModal] = useState(false)
	const [reordered, setReordered] = useState(false)
	
	const { setLoading } = useLoading()

	const setIsEdited = (value: CurrentSeasonIsEdited) => {
		isEditedRef.current = value
		setIsEditedState(value)
	}

	const setConfirmModalDelEntry = () => {
		entryToDelete.current = contextMenu.currentItem
		setContextMenu({...contextMenu, currentItem: null})
		setConfirmModal('DELETE')
	}

	useEffect(() => {
		const getData = async () => {
			const { data } = await axios.get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/table/seasonal`)
			console.log(data)

			setResponse(data)
			setResponse1(data)
			setIsLoadingClient(false)

			await axios
				.get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/refresh`)
				.catch((error) => console.log(error))
		}
		getData()

		const updaterSocketHandler = () => getData()

		const initializeSocket = async () => {
			updaterSocket.connect()
			updaterSocket.on('Seasonal', updaterSocketHandler)
		}
		initializeSocket()

		const refresh = setInterval(
			() => axios.get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/refresh`),
			1700000
		)
		
		const closeMenusOnClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement
			if (target?.tagName !== 'INPUT' && target?.tagName !== 'SELECT') {
				setIsEdited('')
			}
			if (
				target.parentNode !== addRecordButtonRef.current &&
				target.parentNode?.parentNode !== addRecordButtonRef.current &&
				!addRecordMenuRef.current?.contains(target)
			) {
				setIsAdded(false)
			}
			if (
				target.parentNode !== settingsMenuButtonRef.current &&
				target.parentNode?.parentNode !== settingsMenuButtonRef.current &&
				!settingsMenuRef.current?.contains(target) &&
				settingsMenuRef.current
			) {
				setSettingsMenu({ ...settingsMenu, display: false })
			}
			if (
				!contextMenuButtonRef.current.includes(target.parentNode) &&
				!contextMenuButtonRef.current.includes(target.parentNode?.parentNode) &&
				!contextMenuRef.current?.contains(target) &&
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
			updaterSocket.off('Seasonal', updaterSocketHandler)
			updaterSocket.disconnect()
			clearInterval(refresh)
			document.removeEventListener('click', closeMenusOnClick)
			window.removeEventListener('focusout', closeMenusOnFocusout)
			window.removeEventListener('keydown', closeMenusOnEscape)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<>
			<Head>
				<title>Watchlist</title>
				<meta name="description" content="Current Season" />
			</Head>

			<main className="flex flex-col items-center justify-center mb-24 px-6 py-2">
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
					<div className='p-2 bg-neutral-700 rounded-md'>
						<div className="grid grid-cols-[5fr_1fr] lg:grid-cols-[30rem_10rem_10rem_8rem] min-w-[95dvw] lg:min-w-0 w-min border-b">
							<span className='flex items-center justify-center p-2 pt-1 text-center font-bold'>
								Title
							</span>
							<span className='flex items-center justify-center p-2 pt-1 text-center font-bold'>
								Status
							</span>
							<span className='hidden lg:flex items-center justify-center p-2 pt-1 text-center font-bold'>
								Start Date
							</span>
							<span className='hidden lg:flex items-center justify-center p-1 text-center font-bold'>
								Latest Episode
							</span>
						</div>
						{(isLoadingClient || !response) ? 
						<div className='flex items-center justify-center h-[26rem]'>
							<CircularProgress size={42} color="primary" />
						</div> : 
						<Reorder.Group
							values={response}
							onReorder={(newOrder) => {
								if (settingsMenu.display) setSettingsMenu({ ...settingsMenu, display: false })
								if (contextMenu.currentItem) setContextMenu({ ...contextMenu, currentItem: null })
								setResponse(newOrder)
								setReordered(true)
							}}
							className="flex flex-col lg:w-[40rem] min-w-[95dvw] lg:min-w-full w-min"
						>
							{response?.map((item, index) => (
								<SeasonalTableItem 
									key={item.title} 
									props={{ item, index, setIsLoadingEditForm, isLoadingEditForm, setIsEdited, isEdited, isEditedRef, contextMenuButtonRef, setContextMenu, response, setResponse }}
								/>
							))}
						</Reorder.Group>}
					</div>
					<div
						style={{
							visibility: reordered && !isEqual(response, response1) ? 'visible' : 'hidden'
						}}
						className="flex flex-col items-center w-[30rem] px-2"
					>
						<div className="flex gap-2 my-2">
							<Button
								onClick={() => {
									saveReorder()
									setReordered(false)
								}}
								variant='outlined'
							>
								Save changes
							</Button>
							<Button
								onClick={() => {
									setResponse(response1)
									setReordered(false)
								}}
								color='error'
							>
								Cancel
							</Button>
						</div>
					</div>
				</section>
				<AddRecordMenu 
					addRecordMenuRef={addRecordMenuRef}
					isAdded={isAdded}
					setIsAdded={setIsAdded}
					response={response}
				/>
				<ContextMenu 
					contextMenuRef={contextMenuRef}
					contextMenu={contextMenu}
					response1={response1}
					setConfirmModalDelEntry={setConfirmModalDelEntry}
				/>
				<SettingsMenu 
					settingsMenuRef={settingsMenuRef}
					settingsMenu={settingsMenu}
					setEditModal={setEditModal}
					setConfirmModal={setConfirmModal}
				/>
				<ConfirmModal 
					confirmModal={confirmModal}
					setConfirmModal={setConfirmModal}
					entryToDelete={entryToDelete}
					response1={response1}
				/>
				<ChangeStatusAllModal 
					editModal={editModal}
					setEditModal={setEditModal}
					response={response}
				/>
			</main>
		</>
	)

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
			console.error(error)
			return
		}
	}

	function handleSettingsMenu(e: BaseSyntheticEvent) {
		const { top, left } = e.target.getBoundingClientRect()

		setSettingsMenu({
			top: top + window.scrollY,
			left: left + window.scrollX - 180,
			display: true
		})
	}
}

function SettingsMenu({
	settingsMenuRef,
	settingsMenu,
	setEditModal,
	setConfirmModal
}: {
	settingsMenuRef: RefObject<HTMLMenuElement>;
	settingsMenu: SettingsMenuPos;
	setEditModal: Dispatch<SetStateAction<boolean>>;
	setConfirmModal: Dispatch<SetStateAction<"" | "DELETE" | "DELETEALL">>;
}) {
	return (
		<AnimatePresence>
			{settingsMenu.display && <motion.menu
				initial={{ height: 0, opacity: 0 }}
				animate={{ height: '6.2rem', opacity: 1 }}
				exit={{ height: 0, opacity: 0 }}
        transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
				ref={settingsMenuRef}
				style={{
					top: settingsMenu.top,
					left: settingsMenu.left
				}}
				className="absolute z-20 p-2 w-[11rem] shadow-md shadow-black bg-black border-pink-400 border-[1px] rounded-md overflow-hidden"
			>
				<li className="flex justify-center h-fit rounded-md hover:bg-pink-400">
					<button onClick={() => setEditModal(true)} className="py-2 w-full">
						Change status all
					</button>
				</li>
				<li className="flex justify-center h-fit rounded-md hover:bg-pink-400">
					<button onClick={() => setConfirmModal('DELETEALL')} className="py-2 w-full">
						Delete all
					</button>
				</li>
			</motion.menu>}
		</AnimatePresence>
	)
}

function AddRecordMenu({
	addRecordMenuRef,
	isAdded,
	setIsAdded,
	response
}: {
	addRecordMenuRef: RefObject<HTMLMenuElement>;
	isAdded: boolean;
	setIsAdded: Dispatch<SetStateAction<boolean>>;
	response: SeasonalWithDetails[] | undefined;
}) {
	const { setLoading } = useLoading()

	async	 function handleAddRecord(e: BaseSyntheticEvent) {
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
			}, { withCredentials: true })
			setIsAdded(false)
			setLoading(false)
		} catch (error) {
			setLoading(false)
			alert(error)
			return
		}
	}

	return (
		<AnimatePresence>
			{isAdded && <motion.menu 
				initial={{ y: -5, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				exit={{ y: -5, opacity: 0 }}
				transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
				ref={addRecordMenuRef} 
				className='absolute top-32 z-10 p-1 rounded-md bg-black border border-pink-400'
			>
				<form onSubmit={handleAddRecord}>
					<input placeholder='Add title' className='w-60 text-lg rounded-sm bg-black focus:outline-none' />
				</form>
			</motion.menu>}
		</AnimatePresence>
	)
}

//* Confirm delete items
function ConfirmModal({
	confirmModal,
	setConfirmModal,
	response1,
	entryToDelete
}: {
	confirmModal: "" | "DELETE" | "DELETEALL";
	setConfirmModal: Dispatch<SetStateAction<"" | "DELETE" | "DELETEALL">>;
	response1: SeasonalWithDetails[] | undefined;
	entryToDelete: MutableRefObject<SeasonalWithDetails | null>;
}) {
	const { setLoading } = useLoading()
	
	async function handleDeleteAll() {
		setLoading(true)
	
		try {
			await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/update`, {
				content: '',
				cell: 'O2:O22',
				type: 'MULTI',
				length: 21
			}, { withCredentials: true })
			setConfirmModal('')
			setLoading(false)
		} catch (error) {
			setLoading(false)
			alert(error)
			return
		}
	}

	async function handleDelete() {
		if (!entryToDelete.current) return
		setLoading(true)
		try {
			await axios.delete('/api/deleteentry', {
				data: {
					content: response1,
					id: entryToDelete.current.title,
					type: 'SEASONAL'
				}
			})
			setConfirmModal('')
			setLoading(false)
		} catch (error) {
			setLoading(false)
			alert(error)
		}
	}

	if (confirmModal === 'DELETEALL') {
		return (
			<Dialog
				fullWidth
				maxWidth="xs"
				open={!!confirmModal}
				onClose={() => setConfirmModal('')}
			>
				<div className='p-2'>
					<DialogTitle fontSize='large'>
						Confirm delete all entries?
					</DialogTitle>
					<DialogActions>
						<Button 
							onClick={handleDeleteAll}
							variant='outlined' 
						>
							Yes
						</Button>
						<Button 
							onClick={() => setConfirmModal('')}
							color='error' 
						>
							No
						</Button>
					</DialogActions>
				</div>
			</Dialog>
		)
	} else if (confirmModal === 'DELETE') {
		return (
			<Dialog
				fullWidth
				maxWidth="xs"
				open={!!confirmModal}
				onClose={() => setConfirmModal('')}
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
							onClick={() => setConfirmModal('')}
							color='error' 
						>
							No
						</Button>
					</DialogActions>
				</div>
			</Dialog>
		)
	} else return null
}

//* Change status of all shows
function ChangeStatusAllModal({
	editModal,
	setEditModal,
	response
}: {
	editModal: boolean;
	setEditModal: Dispatch<SetStateAction<boolean>>;
	response: SeasonalWithDetails[] | undefined;
}) {
	const { setLoading } = useLoading()

	const router = useRouter()

	async function handleSubmit(event: BaseSyntheticEvent) {
		event.preventDefault()
		if (!response) return
		const row = response.length + 1
		try {
			setLoading(true)
			await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/updatestatus`, {
				content: event.target.childNodes[0].value,
				cells: `P2:P${row}`
			}, { withCredentials: true })
			router.reload()
		} catch (error) {
			setLoading(false)
			alert(error)
			console.error(error)
		}
	}

	return (
		<Dialog
			fullWidth
			maxWidth="xs"
			open={editModal}
			onClose={() => setEditModal(false)}
		>
			<div className='flex flex-col items-center gap-4 p-6'>
				<CloseIcon 
					fontSize="large" 
					onClick={() => setEditModal(false)}
					className='absolute top-6 right-6 cursor-pointer hover:fill-red-500'
				/>
				<h3 className='text-2xl'>Change status all</h3>
				<form onSubmit={handleSubmit} className="text-gray-800">
					<select
						onChange={(e) => (e.target.parentNode as HTMLFormElement)!.requestSubmit()}
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
		</Dialog>
	)
}

//* Component for each seasonal show in table
function SeasonalTableItem({ props }: SeasonalTableItemProps) {
	const [startDate, setStartDate] = useState('Loading...')

	const { item, index, setIsLoadingEditForm, isLoadingEditForm, setIsEdited, isEdited, isEditedRef, contextMenuButtonRef, setContextMenu, response, setResponse } = props
	const controls = useDragControls()
	const statusColor = determineStatus(item)
	
	useEffect(() => {
		setStartDate(
			new Date(item?.details?.start_date ?? '').toLocaleDateString('en-US', { 
				day: 'numeric', 
				month: 'long', 
				year: 'numeric' 
			})
		)
	}, [item.details])

	return (
		<Reorder.Item 
			value={item}
			dragListener={false}
      dragControls={controls}
			dragConstraints={{ top: -25, bottom: 25 }}
			dragElastic={0.15}
			className="grid grid-cols-[5fr_1fr] lg:grid-cols-[30rem_10rem_10rem_8rem] p-0 bg-neutral-700 hover:bg-zinc-800 rounded-md"
		>
			<div
				style={{
					opacity: isLoadingEditForm.includes(`seasonal-title_${item.order}`) ? 0.5 : 1
				}}
				onDoubleClick={() => {
					setIsEdited(`seasonal-title_${item.title}_${item.order}`)
				}}
				className="relative p-2 text-center group"
			>
				<span 
					style={{ margin: isEdited == `seasonal-title_${item.title}_${item.order}` ? 0 : '0 1rem' }}
					className='cursor-text'
				>
					{isEdited == `seasonal-title_${item.title}_${item.order}`
						? editForm(`seasonal-title`, item.order, item.title!)
						: item.title}
				</span>
				{isLoadingEditForm.includes(`seasonal-title_${item.order}`) && (
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
					opacity: isLoadingEditForm.includes(`seasonal-status_${item.order}`) ? 0.5 : 1
				}}
				onDoubleClick={() => {
					setIsEdited(`seasonal-status_${item.title}_${item.order}`)
				}}
				className="relative flex items-center justify-center"
			>
				<span className='flex items-center justify-center'>
					{isEdited == `seasonal-status_${item.title}_${item.order}` && 
					<EditStatus order={item.order} ogvalue={item.status ?? ''} />}
				</span>
				{isLoadingEditForm.includes(`seasonal-status_${item.order}`) && (
					<CircularProgress size={30} className="absolute top-[15%] left-[38%]" />
				)}
			</div>
			<div className='hidden lg:flex items-center justify-center'>
				{startDate != 'Invalid Date' ? startDate : 'N/A'}
			</div>
			<div className='relative hidden lg:flex items-center justify-center'>
				{item?.details?.latest_episode ?? 'N/A'}
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
		item: SeasonalWithDetails
	) {
		const { top, left } = e.target.getBoundingClientRect()

		setContextMenu({
			top: top + window.scrollY,
			left: left + window.scrollX + 25,
			currentItem: item
		})
	}

	function editForm(field: 'seasonal-title', order: number, ogvalue: string): React.ReactNode {
		let column: string
		let row = (order + 2).toString()
		switch (field) {
			case 'seasonal-title':
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
				}, { withCredentials: true })

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
						opacity: isLoadingEditForm.includes(`seasonal-title_${order}`) ? 0.5 : 1,
						pointerEvents: isLoadingEditForm.includes(`seasonal-title_${order}`) ? 'none' : 'unset'
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

	//* Status edit dropdown
	function EditStatus({
		order,
		ogvalue
	}: {
		order: number; 
		ogvalue: string;
	}) {
		async function handleSubmit(event: BaseSyntheticEvent) {
			event.preventDefault()
			const currentlyProcessedEdit = isEditedRef.current

			if (ogvalue == event.target[0].value) {
				setIsEdited('')
				return
			}

			setIsLoadingEditForm(isLoadingEditForm.concat(`seasonal-status_${order}`))

			let row = order + 2
			try {
				await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/updatestatus`, {
					content: event.target.childNodes[0].value,
					cells: `P${row}:P${row}`
				}, { withCredentials: true })

				const changed = response?.slice()
				if (!changed) return
				changed.find(item => item.order === order)!['status'] = event.target.childNodes[0].value
				setResponse(changed)
				if (isEditedRef.current == currentlyProcessedEdit) setIsEdited('')
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `seasonal-status_${order}`))
			} catch (error) {
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `seasonal-status_${order}`))
				alert(error)
				return
			}
		}

		return (
			<div
				style={{ backgroundColor: isLoadingEditForm.includes(`seasonal-status_${order}`) ? 'black' : 'unset' }}
				className="flex items-center justify-center relative w-full"
			>
				<div
					style={{
						opacity: isLoadingEditForm.includes(`seasonal-status_${order}`) ? 0.5 : 1,
						pointerEvents: isLoadingEditForm.includes(`seasonal-status_${order}`) ? 'none' : 'unset'
					}}
					className="w-full"
				>
					<form onSubmit={handleSubmit} className="text-gray-800">
						<select
							onChange={(e) => (e.target.parentNode as HTMLFormElement)!.requestSubmit()}
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

	function determineStatus(item: Seasonal) {
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

//* Context menu for each table item
function ContextMenu({
	contextMenuRef,
	contextMenu,
	response1,
	setConfirmModalDelEntry
}: {
	contextMenuRef: RefObject<HTMLDivElement>;
	contextMenu: {
    top: number;
    left: number;
    currentItem: SeasonalWithDetails | null;
	};
	response1: SeasonalWithDetails[] | undefined;
	setConfirmModalDelEntry: () => void;
}) {
	const router = useRouter()

	const { setLoading } = useLoading()

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
			await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/addtocompleted`, {
				content: response1,
				id: contextMenu.currentItem?.title,
				type: 'SEASONAL'
			}, { withCredentials: true })
			setLoading(false)
		} catch (error) {
			setLoading(false)
			alert(error)
		}
	}

	return (
		<AnimatePresence>
			{contextMenu.currentItem && <motion.menu
				initial={{ height: 0, opacity: 0 }}
				animate={{ height: '11.6rem', opacity: 1 }}
				exit={{ height: 0, opacity: 0 }}
        transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
				ref={contextMenuRef}
				style={{
					top: contextMenu.top,
					left: contextMenu.left
				}}
				className="absolute z-10 p-2 w-[15rem] shadow-md shadow-gray-600 bg-black border border-pink-400 rounded-md overflow-hidden"
			>
				<li className="flex justify-center">
					<span className="text-center font-semibold line-clamp-1">
						{contextMenu.currentItem?.title}
					</span>
				</li>
				<hr className="my-2 border-t" />
				{contextMenu.currentItem.details && 
				<li className="flex justify-center h-8 rounded-sm hover:bg-pink-400">
					<Link
						href={`https://myanimelist.net/anime/${contextMenu.currentItem.details.mal_id}`} 
						target='_blank' 
						rel='noopener noreferrer' 
						className="p-1 w-full text-center"
					>
						Visit on MAL
					</Link>
				</li>}
				<li className="flex justify-center h-8 rounded-sm hover:bg-pink-400">
					<button onClick={loadItemDetails} className="w-full">
						Load details
					</button>
				</li>
				<li className="flex justify-center h-8 rounded-sm hover:bg-pink-400">
					<button onClick={handleAddToCompleted} className="w-full">
						Add to Completed
					</button>
				</li>
				<li className="flex justify-center h-8 rounded-sm hover:bg-pink-400">
					<button onClick={() => setConfirmModalDelEntry()} className="w-full">
						Delete entry
					</button>
				</li>
			</motion.menu>}
		</AnimatePresence>
	)
}