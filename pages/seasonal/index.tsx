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
import Link from 'next/link'

//TODO: Load individual animes into tracker
//TODO: Reorder to release order

export default function Seasonal() {
	const settingsMenuRef = useRef<HTMLDivElement>(null)
	const settingsMenuButtonRef = useRef<HTMLDivElement>(null)

	const [response, setResponse] =
		useState<Database['public']['Tables']['PTW-CurrentSeason']['Row'][]>()
	const [isEdited, setIsEdited] = useState<string>('')
	const [isLoadingClient, setIsLoadingClient] = useState(true)
	const [isLoadingEditForm, setIsLoadingEditForm] = useState<Array<string>>([])
	const [isAdded, setIsAdded] = useState(false)
	const [settingsMenu, setSettingsMenu] = useState<{
		top: number
		left: number
		display: string
	}>({ top: 0, left: 0, display: 'none' })
	const [confirmModal, setConfirmModal] = useState(false)
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
			setIsLoadingClient(false)

			await axios
				.get('https://update.ilovesabrina.org/refresh')
				.catch((error) => console.log(error))
		}
		getData()

		const refresh = setInterval(
			() => axios.get('https://update.ilovesabrina.org/refresh'),
			3500000
		)
		
		const closeMenusOnClick = (e: any) => {
			if (e.target?.tagName !== 'INPUT' && e.target?.tagName !== 'SELECT') setIsEdited('')
			if (e.target?.tagName !== 'INPUT' && e.target?.tagName !== 'svg' && e.target?.tagName !== 'path') {
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

		return () => {
			databaseChannel.unsubscribe()
			clearInterval(refresh)
			document.removeEventListener('click', closeMenusOnClick)
			window.removeEventListener('focusout', closeMenusOnFocusout)
			window.removeEventListener('keydown', closeMenusOnEscape)
		}
	}, [])

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
						<div title='Add new entry' onClick={handleAddMenu} className='flex items-center justify-center h-7 w-7 cursor-pointer rounded-full hover:bg-gray-500 transition-colors duration-150 translate-y-[2px]'>
							<AddIcon />
						</div>
					</header>
					{isAdded && 
					<menu className='absolute top-14 z-10 p-1 rounded-lg bg-black border-[1px] border-pink-400'>
						<form onSubmit={handleAddRecord}>
							<input placeholder='Insert title' className='w-60 text-lg rounded-sm bg-gray-800 focus:outline-none' />
						</form>
					</menu>}
					<table>
						<tbody>
							<tr>
								<th className="w-[30rem]">Title</th>
								<th className="w-[10rem]">Status</th>
							</tr>
							{isLoadingClient
								? loadingGlimmer(2)
								: response?.map((item) => {
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
										return (
											<tr key={item.id}>
												<td
													style={{
														opacity: isLoadingEditForm.includes(`seasonal_title_${item.id}`) ? 0.5 : 1
													}}
													onDoubleClick={() => {
														setIsEdited(`seasonal_title_${item.title}_${item.id}`)
													}}
													className="relative"
												>
													<span className='px-4'>
														{isEdited == `seasonal_title_${item.title}_${item.id}`
															? editForm(`seasonal_title`, item.id, item.title!)
															: item.title}
													</span>
													{isLoadingEditForm.includes(`seasonal_title_${item.id}`) && (
														<CircularProgress size={30} className="absolute top-[20%] left-[48%]" />
													)}
												</td>
												<td
													style={{
														backgroundColor: status,
														opacity: isLoadingEditForm.includes(`status_${item.id}`) ? 0.5 : 1
													}}
													onDoubleClick={() => {
														setIsEdited(`seasonal_status_${item.title}_${item.id}`)
													}}
													className="relative"
												>
													<span>
														{isEdited == `seasonal_status_${item.title}_${item.id}`
															? editStatus(item.id)
															: ''}
													</span>
													{isLoadingEditForm.includes(`status_${item.id}`) && (
														<CircularProgress size={30} className="absolute top-[20%] left-[48%]" />
													)}
												</td>
											</tr>
										)
									})}
						</tbody>
					</table>
				</section>
				{settingsMenu.display == 'block' && <SettingsMenu />}
				{confirmModal && <ConfirmModal />}
			</main>
		</>
	)

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

	function handleAddMenu() {
		setIsAdded(true)
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
				{isLoadingEditForm.includes(`seasonal_title_${id}`) && (
					<CircularProgress size={30} className="absolute left-[48%]" />
				)}
			</div>
		)
	}

	function editStatus(id: number) {
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
				{isLoadingEditForm.includes(`status_${id}`) && (
					<CircularProgress size={30} className="absolute left-[48%]" />
				)}
			</div>
		)
	}
}
