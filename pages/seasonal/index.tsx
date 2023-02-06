import { createClient } from '@supabase/supabase-js'
import { Database } from '../../lib/database.types'
import { BaseSyntheticEvent, useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import axios from 'axios'
import { loadingGlimmer } from '../../components/LoadingGlimmer'
import { CircularProgress } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useLoading } from '../../components/LoadingContext'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Reorder } from 'framer-motion'
import isEqual from 'lodash/isEqual'

//TODO: Load individual animes into tracker
//TODO: Reorder to release order

export default function Seasonal() {
	const settingsMenuRef = useRef<HTMLDivElement>(null)
	const settingsMenuButtonRef = useRef<HTMLDivElement>(null)
	const addRecordMenuRef = useRef<HTMLMenuElement>(null)
	const addRecordButtonRef = useRef<HTMLDivElement>(null)

	const [response, setResponse] =
		useState<Database['public']['Tables']['PTW-CurrentSeason']['Row'][]>()
	const [response1, setResponse1] =
		useState<Database['public']['Tables']['PTW-CurrentSeason']['Row'][]>()
	const [isEdited, setIsEdited] = useState<string>('')
	const [isLoadingEditForm, setIsLoadingEditForm] = useState<Array<string>>([])
	const [isAdded, setIsAdded] = useState(false)
	const [settingsMenu, setSettingsMenu] = useState<{
		top: number
		left: number
		display: string
	}>({ top: 0, left: 0, display: 'none' })
	const [confirmModal, setConfirmModal] = useState(false)
	const [reordered, setReordered] = useState(false)
	const { setLoading } = useLoading()

	useEffect(() => {
		const supabase = createClient<Database>(
			'https://esjopxdrlewtpffznsxh.supabase.co',
			process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
		)
		const getData = async () => {
			const { data } = await supabase
				.from('PTW-CurrentSeason')
				.select()
				.order('id', { ascending: true })

			setResponse(data!)
			setResponse1(data!)

			await axios
				.get('https://update.ilovesabrina.org/refresh')
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
						.select()
						.order('id', { ascending: true })
					setResponse(data!)
					console.log(payload)
				}
			)
			.subscribe()

		const refresh = setInterval(
			() => axios.get('https://update.ilovesabrina.org/refresh'),
			3500000
		)
		
		const closeMenusOnClick = (e: any) => {
			if (e.target?.tagName !== 'INPUT' && e.target?.tagName !== 'SELECT') setIsEdited('')
			if (
				e.target.parentNode !== addRecordButtonRef.current &&
				e.target.parentNode.parentNode !== addRecordButtonRef.current &&
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
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="flex flex-col items-center justify-center mb-24 px-1">
				<section className='relative flex flex-col items-center'>
					<header className='flex items-center'>
						<h2 className="p-2 text-3xl">Current Season</h2>
						<div
							ref={settingsMenuButtonRef}
							onClick={handleSettingsMenu}
							className="flex items-center justify-center h-7 w-7 cursor-pointer rounded-full hover:bg-gray-500 transition-colors duration-150 translate-y-[2px]"
						>
							<MoreVertIcon sx={{ fontSize: 28 }} />
						</div>
						<div
							ref={addRecordButtonRef}
						 	title='Add new entry'
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
					<div className="grid grid-cols-[5fr_1fr] xl:grid-cols-[30rem_10rem] min-w-[95dvw] xl:min-w-0 w-min bg-sky-600 border-white border-solid border-[1px]">
						<span className='flex items-center justify-center p-2 h-full border-white border-r-[1px] text-center font-bold'>
							Title
						</span>
						<span className='flex items-center justify-center p-2 h-full text-center font-bold'>
							Status
						</span>
					</div>
					<Reorder.Group
						values={response ?? []}
						dragConstraints={{ top: 500 }}
						/* draggable={sortMethod ? true : false} */
						onReorder={(newOrder) => {
							setResponse(newOrder)
							setReordered(true)
						}}
						className="flex flex-col xl:w-[40rem] min-w-[95dvw] xl:min-w-full w-min border-white border-[1px] border-t-0"
					>
						{response?.map((item) => {
							const statusColor = determineStatus(item)
							return (
								<Reorder.Item value={item} key={item.id} className="grid grid-cols-[5fr_1fr] xl:grid-cols-[30rem_10rem] p-0 cursor-move hover:bg-neutral-700">
									<div
										style={{
											opacity: isLoadingEditForm.includes(`seasonal_title_${item.id}`) ? 0.5 : 1
										}}
										onDoubleClick={() => {
											setIsEdited(`seasonal_title_${item.title}_${item.id}`)
										}}
										className="relative p-2 text-center"
									>
										<span 
											style={{ margin: isEdited == `seasonal_title_${item.title}_${item.id}` ? 0 : '0 1rem' }}
											className='cursor-text'
										>
											{isEdited == `seasonal_title_${item.title}_${item.id}`
												? editForm(`seasonal_title`, item.id, item.title!)
												: item.title}
										</span>
										{isLoadingEditForm.includes(`seasonal_title_${item.id}`) && (
											<CircularProgress size={30} className="absolute top-[20%] left-[48%]" />
										)}
									</div>
									<div
										style={{
											backgroundColor: statusColor,
											opacity: isLoadingEditForm.includes(`status_${item.id}`) ? 0.5 : 1
										}}
										onDoubleClick={() => {
											setIsEdited(`seasonal_status_${item.title}_${item.id}`)
										}}
										className="relative flex items-center justify-center"
									>
										<span className='flex items-center justify-center'>
											{isEdited == `seasonal_status_${item.title}_${item.id}`
												? editStatus(item.id, item.title!)
												: ''}
										</span>
										{isLoadingEditForm.includes(`status_${item.id}`) && (
											<CircularProgress size={30} className="absolute top-[20%] left-[48%]" />
										)}
									</div>
								</Reorder.Item>
							)
						})}
					</Reorder.Group>
					<div
						style={{
							visibility: reordered && !isEqual(response, response1) ? 'visible' : 'hidden'
						}}
						className="flex flex-col items-center w-[30rem] px-2"
					>
						<span className="mt-2 text-red-500 text-center">
							⚠ Live updates will be paused while changes are being made to this table (Not
							really)
						</span>
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
				{settingsMenu.display == 'block' && <SettingsMenu />}
				{confirmModal && <ConfirmModal />}
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
			console.log(error)
			return
		}
	}

	function ConfirmModal() {
		async function handleDeleteAll() {
			setLoading(true)
		
			try {
				await axios.post('/api/update', {
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
			await axios.post('/api/update', {
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

	function editForm(field: 'seasonal_title', id: number, ogvalue: string): React.ReactNode {
		let column: string
		let row = (id + 2).toString()
		switch (field) {
			case 'seasonal_title':
				column = 'O'
				break
		}

		async function handleSubmit(event: BaseSyntheticEvent): Promise<void> {
			event.preventDefault()
			setIsLoadingEditForm(isLoadingEditForm.concat(`${field}_${id}`))

			try {
				await axios.post('/api/update', {
					content: event.target[0].value,
					cell: column + row
				})

				const changed = response?.slice()
				if (!changed) return
				changed.find((item) => item.id === id)!['title'] = event.target[0].value
				setResponse(changed)
				setIsEdited('')
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${id}`))
			} catch (error) {
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${id}`))
				alert(error)
				return
			}
		}

		return (
			<div className="flex items-center justify-center relative w-full">
				<div
					style={{
						opacity: isLoadingEditForm.includes(`seasonal_title_${id}`) ? 0.5 : 1,
						pointerEvents: isLoadingEditForm.includes(`seasonal_title_${id}`) ? 'none' : 'unset'
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

	function editStatus(id: number, title: string) {
		async function handleSubmit(event: BaseSyntheticEvent) {
			event.preventDefault()
			setIsLoadingEditForm(isLoadingEditForm.concat(`status_${id}`))

			let row = id + 2
			try {
				await axios.post('/api/seasonal/updatestatus', {
					content: event.target.childNodes[0].value,
					cells: `P${row}:P${row}`
				})

				const changed = response?.slice()
				if (!changed) return
				changed.find((item) => item.id === id)!['status'] = event.target.childNodes[0].value
				setResponse(changed)
				setIsEdited('')
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `status_${id}`))
			} catch (error) {
				setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `status_${id}`))
				alert(error)
				return
			}
		}

		return (
			<div
				style={{ backgroundColor: isLoadingEditForm ? 'black' : 'unset' }}
				className="flex items-center justify-center relative w-full"
			>
				<div
					style={{
						opacity: isLoadingEditForm.includes(`status_${id}`) ? 0.5 : 1,
						pointerEvents: isLoadingEditForm.includes(`status_${id}`) ? 'none' : 'unset'
					}}
					className="w-full"
				>
					<form onSubmit={handleSubmit} className="text-gray-800">
						<select
							onChange={(e) => {
								;(e.target.parentNode as HTMLFormElement)!.requestSubmit()
							}}
							className="h-full w-full"
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
