import Head from 'next/head'
import { BaseSyntheticEvent, useEffect, useState, useRef, Dispatch, SetStateAction, MutableRefObject } from 'react'
import axios from 'axios'
import { Reorder, useDragControls } from 'framer-motion'
import { getRandomInt, sortListByNamePTW, sortSymbol } from '../lib/list_methods'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/database.types'
import { loadingGlimmer } from '../components/LoadingGlimmer'
import { CircularProgress, Skeleton } from '@mui/material'
import DoneIcon from '@mui/icons-material/Done'
import { useLoading } from '../components/LoadingContext'
import CancelIcon from '@mui/icons-material/Cancel'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import AddIcon from '@mui/icons-material/Add'
import isEqual from 'lodash/isEqual'
import RefreshIcon from '@mui/icons-material/Refresh'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'

export default function PTW() {
	const rolledTitleRef = useRef('???')
	const rolledTitleElementRef = useRef<HTMLHeadingElement>(null)
	const latencyRef = useRef<HTMLSpanElement>(null)
	const addGachaRollRef = useRef<HTMLDivElement>(null)
	const contextMenuRef = useRef<HTMLDivElement>(null)
	const contextMenuButtonRef = useRef<any>([])
	const sortMethodRef = useRef('')
	const reordered = useRef(false)
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
	const [isEdited, setIsEdited] = useState<string>('')
	const [isLoadingClient, setIsLoadingClient] = useState(true)
	const [isLoadingEditForm, setIsLoadingEditForm] = useState<Array<string>>([])
	const [contextMenu, setContextMenu] = useState<{
		top: number
		left: number
		currentItem: Database['public']['Tables']['PTW-Rolled']['Row'] | null
	}>({ top: 0, left: 0, currentItem: null })
	const [isAdded, setIsAdded] = useState('')
	const { setLoading } = useLoading()

	const editFormParams = {
		isLoadingEditForm,
		setIsLoadingEditForm,
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

	const setRolledTitle = (value: string) => {
		if (value == '???') {
			addGachaRollRef.current!.style.visibility = 'hidden'
		} else {
			addGachaRollRef.current!.style.visibility = 'visible'
		}
		rolledTitleElementRef.current!.innerHTML = value
		rolledTitleRef.current = value
	}

	useEffect(() => {
		setRolledTitle(rolledTitleRef.current)
	})

	const setLatency = (value: number) => {
		if (latencyRef.current) latencyRef.current.innerHTML = `Latency: ${value.toFixed(1)}ms`
	}

	const supabase = createClient<Database>(
		'https://esjopxdrlewtpffznsxh.supabase.co',
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
				.get('https://update.ilovesabrina.org/refresh')
				.catch((error) => console.log(error))
		}
		getData()

		const refresh = setInterval(
			() => axios.get('https://update.ilovesabrina.org/refresh'),
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

		channel
			.on('broadcast', { event: 'ROLL' }, (payload) => {
				setRolledTitle(payload.message)
				if (payload.isLoading) {
					setLoading(true)
				} else setLoading(false)
			})
			.subscribe()

		let pingInterval: ReturnType<typeof setInterval> | undefined
		const latencyChannel = supabase
			.channel(`ping:${getRandomInt(1000000000)}`, {
				config: {
					broadcast: { ack: true }
				}
			})
			.subscribe((status) => {
				if (status == 'SUBSCRIBED') {
					pingInterval = setInterval(async () => {
						const begin = performance.now()

						const response = await latencyChannel.send({
							type: 'broadcast',
							event: 'latency',
							payload: {}
						})

						if (response !== 'ok') {
							console.log('Ping error')
							setLatency(-1)
						} else {
							const end = performance.now()
							const newLatency = end - begin
							setLatency(newLatency)
						}
					}, 5000)
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
				setIsAdded('')
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
			latencyChannel.unsubscribe()
			databaseChannel.unsubscribe()
			channel.unsubscribe()
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
				<title>Cytube Watchlist</title>
				<meta name="description" content="Plan to Watch" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="flex flex-col items-center justify-center gap-4 mb-24 px-6 py-2">
				<section className="flex flex-col lg:flex-row items-center justify-center w-full gap-12">
					<div className="flex flex-col items-center min-h-[40rem] w-[30rem] lg:w-auto">
						<header className='flex items-center mt-5'>
							<h2 className="p-2 text-3xl">
								Plan to Watch (Rolled)
							</h2>
							{sortMethodRef.current &&
							<div
								title="Reset sort"
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
								onClick={() => {
									sortListByNamePTW(
										'title',
										responseRolled,
										sortMethodRef,
										setResponseRolled
									)
									setReordered(false)
								}}
								className='flex items-center justify-center p-2 h-full border-white border-r-[1px] text-center font-bold'
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
									<Item 
										key={item.id}
										props={{ item, index, isLoadingEditForm, setIsEdited, isEdited, sortMethodRef, setContextMenu, contextMenuButtonRef, responseRolled, setResponseRolled, setIsLoadingEditForm }}
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
							<span className="mt-2 text-red-500 text-center">
								⚠ Live updates will be paused while changes are being made to this table (Not
								really)
							</span>
							<div className="flex gap-2 my-2">
								<button
									className="input-submit p-2 rounded-md"
									onClick={() => saveReorder(
											responseRolled,
											setLoading,
											setReordered
									)}
								>
									Save Changes
								</button>
								<button
									className="input-submit p-2 rounded-md"
									onClick={() => {
										setResponseRolled(responseRolled1)
										setReordered(false)
									}}
								>
									Cancel
								</button>
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
					<button onClick={addToCompleted} className="w-full">
						Add to Completed
					</button>
				</li>
			</menu>
		)

		async function addToCompleted() {
			setLoading(true)
			try {
				await axios.post('/api/addtocompleted', {
					content: responseRolled,
					id: contextMenu.currentItem?.id,
					type: 'PTW'
				})
				setLoading(false)
			} catch (error) {
				setLoading(false)
				alert(error)
			}
		}
	}

	function LatencyBadge() {
		return (
			<div
				className="fixed bottom-6 left-6 flex items-center justify-center z-50 p-2 max-h-[2.5rem] rounded-full bg-black border-pink-500 border-[1px] whitespace-nowrap"
			>
				<span ref={latencyRef} className="text-gray-300 p-1 pointer-events-none">
					Latency: -1.0ms
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

			if (supabase.getChannels()[0].state != 'joined') channel.subscribe()
			if (categoryCasual) {
				const randomTitle = concatArr?.[getRandomInt(responseCasual.length)].title!
				channel.send({
					type: 'broadcast',
					event: 'ROLL',
					message: randomTitle
				})
				setRolledTitle(randomTitle)
			} else {
				const randomTitle = concatArr?.[getRandomInt(responseNonCasual.length)].title!
				channel.send({
					type: 'broadcast',
					event: 'ROLL',
					message: randomTitle
				})
				setRolledTitle(randomTitle)
			}
		}

		function handleCancel() {
			if (supabase.getChannels()[0].state != 'joined') channel.subscribe()
			channel.send({
				type: 'broadcast',
				event: 'ROLL',
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
			if (responseRolled.length >= 20) {
				alert('Unable to add roll to record, insufficient space.')
				return
			}

			if (supabase.getChannels()[0].state != 'joined') channel.subscribe()
			channel.send({
				type: 'broadcast',
				event: 'ROLL',
				message: rolledTitle,
				isLoading: true
			})
			setLoading(true)
			const isInMovies = responseMovies.find((item) => item.title == rolledTitle)

			if (isInMovies) {
				//? If rolled title is a movie
				const changed = responseMovies.slice().filter((item) => item.title != rolledTitle)

				const range = `L22:L${22 + responseMovies.length - 1}`
				const updatePayload = changed.map((item) => item.title)
				updatePayload.push('')

				const addCell = `N${responseRolled.length + 2}:N${responseRolled.length + 2}`
				try {
					await addRolledAPI(range, updatePayload, addCell)
					setLoading(false)
					if (supabase.getChannels()[0].state != 'joined') channel.subscribe()
					channel.send({
						type: 'broadcast',
						event: 'ROLL',
						message: '???',
						isLoading: false
					})
					setRolledTitle('???')
					return
				} catch (error) {
					if (supabase.getChannels()[0].state != 'joined') channel.subscribe()
					channel.send({
						type: 'broadcast',
						event: 'ROLL',
						message: rolledTitle,
						isLoading: false
					})
					setLoading(false)
					alert(error)
					return
				}
			}

			const isInCasual = responseMovies.find((item) => item.title == rolledTitle)

			if (isInCasual) {
				//? If rolled title is in category casual
				const changed = responseCasual.slice().filter((item) => item.title != rolledTitle)

				const range = `L2:L${responseCasual.length + 1}`
				const updatePayload = changed.map((item) => item.title)
				updatePayload.push('')

				const addCell = `N${responseRolled.length + 2}:N${responseRolled.length + 2}`
				try {
					await addRolledAPI(range, updatePayload, addCell)
					if (supabase.getChannels()[0].state != 'joined') channel.subscribe()
					channel.send({
						type: 'broadcast',
						event: 'ROLL',
						message: '???',
						isLoading: false
					})
					setLoading(false)
					setRolledTitle('???')
					return
				} catch (error) {
					if (supabase.getChannels()[0].state != 'joined') channel.subscribe()
					channel.send({
						type: 'broadcast',
						event: 'ROLL',
						message: rolledTitle,
						isLoading: false
					})
					setLoading(false)
					alert(error)
					return
				}
			} else {
				//? If rolled title is in category non-casual
				const changed = responseNonCasual.slice().filter((item) => item.title != rolledTitle)

				const range = `M2:M${responseNonCasual.length + 1}`
				const updatePayload = changed.map((item) => item.title)
				updatePayload.push('')

				const addCell = `N${responseRolled.length + 2}:N${responseRolled.length + 2}`
				try {
					await addRolledAPI(range, updatePayload, addCell)
					if (supabase.getChannels()[0].state != 'joined') channel.subscribe()
					channel.send({
						type: 'broadcast',
						event: 'ROLL',
						message: '???',
						isLoading: false
					})
					setLoading(false)
					setRolledTitle('???')
					return
				} catch (error) {
					if (supabase.getChannels()[0].state != 'joined') channel.subscribe()
					channel.send({
						type: 'broadcast',
						event: 'ROLL',
						message: rolledTitle,
						isLoading: false
					})
					setLoading(false)
					alert(error)
					return
				}
			}

			async function addRolledAPI(
				range: string,
				updatePayload: Array<string | null>,
				addCell: string
			) {
				await axios.post('/api/ptw/addrolled', {
					deleteStep: {
						range: range,
						content: updatePayload
					},
					addStep: {
						cell: addCell,
						content: rolledTitle
					}
				})
			}
		}

		return (
			<div className="relative flex flex-col items-center justify-center gap-4 h-[30rem] w-[80dvw] md:w-[25rem] bg-slate-700 rounded-lg -translate-y-8">
				<h2 className="absolute top-5 p-2 text-3xl">Gacha</h2>
				<div className="absolute top-20 flex items-center justify-center h-52 max-h-52 w-80">
					<div className="max-h-full max-w-[90%] bg-slate-100 border-black border-solid border-[1px] overflow-auto">
						<h3 ref={rolledTitleElementRef} className="p-2 text-black text-2xl text-center">
							???
						</h3>
					</div>
				</div>
				<div ref={addGachaRollRef} className="absolute bottom-36 invisible">
					<button onClick={addGachaRoll} className="px-2 p-1 input-submit">
						Add to List
					</button>
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
					<input type="submit" value="Roll" className="input-submit px-2 p-1" />
				</form>
			</div>
		)
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
		function handleAddMenu() {
			setIsAdded(tableName)
		}

		async function handleAddRecord(e: BaseSyntheticEvent) {
			e.preventDefault()
			const enteredTitle = e.target[0].value
			if (!enteredTitle || !response) return

			let cell = 'L';
			switch (tableId) {
				case 'casual':
					cell = 'L'
					break
				case 'noncasual':
					cell = 'M'
					break
			}
	
			setLoading(true)
			
			try {
				if (tableId == 'movies') {
					if (response.length >= 5) {
						setLoading(false)
						alert('No space left')
						return
					}
					await axios.post('/api/update', {
						content: enteredTitle,
						cell: cell + (response.length + 22).toString()
					})
				} else {
					if (response.length >= 15) {
						setLoading(false)
						alert('No space left')
						return
					}
					await axios.post('/api/update', {
						content: enteredTitle,
						cell: cell + (response.length + 2).toString()
					})
				}
				setIsAdded('')
				setLoading(false)
			} catch (error) {
				setLoading(false)
				alert(error)
				return
			}
		}

		return (
			<section className="relative flex flex-col items-center">
				<header className='flex items-center'>
					<h2 className="p-2 text-3xl">{tableName}</h2>
					<div
						title='Add new entry' 
						onClick={handleAddMenu} 
						className='flex items-center justify-center h-7 w-7 cursor-pointer rounded-full hover:bg-gray-500 transition-colors duration-150 translate-y-[2px]'
					>
						<AddIcon />
					</div>
				</header>
				{isAdded == tableName && 
				<menu className='absolute top-14 z-10 p-1 rounded-lg bg-black border-[1px] border-pink-400'>
					<form onSubmit={handleAddRecord}>
						<input placeholder='Insert title' className='w-60 text-lg rounded-sm bg-gray-800 focus:outline-none' />
					</form>
				</menu>}
				<table>
					<tbody>
						<tr>
							<th className="w-[100dvw] sm:w-[30rem]">
								<span>Title</span>
							</th>
						</tr>
						{isLoadingClient
							? loadingGlimmer(1)
							: response?.map((item) => {
									return (
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
												className="relative"
											>
												<span>
													{isEdited == `${tableId}_${item.title}_${item.id}`
														? editForm(`${tableId}_title`, item.id, item.title!, editFormParams)
														: item.title}
												</span>
												{isLoadingEditForm.includes(`${tableId}_title_${item.id}`) && (
													<CircularProgress size={30} className="absolute top-[20%] left-[48%]" />
												)}
											</td>
										</tr>
									)
							  })}
					</tbody>
				</table>
			</section>
		)
	}
}

function Item({ props, editFormParams }: ItemProps) {
	const { item, index, isLoadingEditForm, setIsEdited, isEdited, sortMethodRef, setContextMenu, contextMenuButtonRef, responseRolled, setResponseRolled, setIsLoadingEditForm } = props
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
				<span className="mx-7 cursor-text">
					{isEdited == `rolled_${item.title}_${item.id}`
						? editForm('rolled_title', item.id, item.title!, editFormParams)
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
					className="absolute top-2 z-10 h-7 w-7 invisible group-hover:visible cursor-pointer rounded-full hover:bg-gray-500 transition-colors duration-150"
				>
					<MoreVertIcon />
				</div>
				<div
					onPointerDown={(e) => controls.start(e)}
					style={{ visibility: sortMethodRef.current ? 'hidden' : 'visible' }}
					className='absolute top-1/2 right-0 z-10 flex items-center justify-center h-7 w-7 cursor-grab rounded-full transition-colors duration-150 -translate-y-1/2'
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
						? editStatus(item.id)
						: ''}
				</span>
				{isLoadingEditForm.includes(`rolled_status_${item.id}`) && (
					<CircularProgress size={30} className="absolute top-[16%] left-[35%]" />
				)}
			</div>
		</Reorder.Item>
	)

	function editStatus(id: number) {
		async function handleSubmit(event: BaseSyntheticEvent) {
			event.preventDefault()
			setIsLoadingEditForm(isLoadingEditForm.concat(`rolled_status_${id}`))

			let row = id + 2
			try {
				await axios.post('/api/seasonal/updatestatus', {
					content: event.target.childNodes[0].value,
					cells: `N${row}:N${row}`
				})

				const changed = responseRolled?.slice()
				if (!changed) return
				changed.find((item: any) => item.id === id)!['status'] = event.target.childNodes[0].value
				setResponseRolled(changed)
				setIsEdited('')
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
							onChange={(e) => {
								;(e.target.parentNode as HTMLFormElement)!.requestSubmit()
							}}
							className="h-full w-full"
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

interface ItemProps {
	props: {
		item: Database['public']['Tables']['PTW-Rolled']['Row'],
		index: number,
		isLoadingEditForm: string[],
		setIsEdited: Dispatch<SetStateAction<string>>,
		isEdited: string,
		sortMethodRef: MutableRefObject<string>,
		setContextMenu: Dispatch<SetStateAction<{
			top: number;
			left: number;
			currentItem: Database['public']['Tables']['PTW-Rolled']['Row'] | null;
		}>>,
		contextMenuButtonRef: MutableRefObject<any>,
		responseRolled: Database['public']['Tables']['PTW-Rolled']['Row'][] | undefined,
		setResponseRolled: Dispatch<SetStateAction<Database['public']['Tables']['PTW-Rolled']['Row'][] | undefined>>,
		setIsLoadingEditForm: Dispatch<SetStateAction<string[]>>,
	}
	editFormParams: EditFormParams
}

function editForm(
	field: 'rolled_title' | 'casual_title' | 'noncasual_title' | 'movies_title',
	id: number,
	ogvalue: string,
	{
		isLoadingEditForm,
		setIsLoadingEditForm,
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
		setIsLoadingEditForm(isLoadingEditForm.concat(`${field}_${id}`))

		try {
			await axios.post('/api/update', {
				content: event.target[0].value,
				cell: column + row
			})

			switch (field) {
				case 'rolled_title':
					const changedRolled = responseRolled?.slice()
					if (!changedRolled) return
					changedRolled.find((item) => item.id === id)!['title'] = event.target[0].value
					setResponseRolled(changedRolled)
					setIsEdited('')
					setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${id}`))
					break
				case 'casual_title':
					const changedCasual = responseCasual?.slice()
					if (!changedCasual) return
					changedCasual.find((item) => item.id === id)!['title'] = event.target[0].value
					setResponseCasual(changedCasual)
					setIsEdited('')
					setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${id}`))
					break
				case 'noncasual_title':
					const changedNonCasual = responseNonCasual?.slice()
					if (!changedNonCasual) return
					changedNonCasual.find((item) => item.id === id)!['title'] = event.target[0].value
					setResponseNonCasual(changedNonCasual)
					setIsEdited('')
					setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${id}`))
					break
				case 'movies_title':
					const changedMovies = responseMovies?.slice()
					if (!changedMovies) return
					changedMovies.find((item) => item.id === id)!['title'] = event.target[0].value
					setResponseMovies(changedMovies)
					setIsEdited('')
					setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${id}`))
					break
			}
		} catch (error) {
			alert(error)
			return
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

interface EditFormParams {
	isLoadingEditForm: string[],
	setIsLoadingEditForm: Dispatch<SetStateAction<string[]>>,
	setIsEdited: Dispatch<SetStateAction<string>>,
	responseRolled: Database['public']['Tables']['PTW-Rolled']['Row'][] | undefined,
	responseCasual: Database['public']['Tables']['PTW-Casual']['Row'][] | undefined,
	responseNonCasual: Database['public']['Tables']['PTW-NonCasual']['Row'][] | undefined,
	responseMovies: Database['public']['Tables']['PTW-Movies']['Row'][] | undefined,
	setResponseRolled: Dispatch<SetStateAction<Database['public']['Tables']['PTW-Rolled']['Row'][] | undefined>>,
	setResponseCasual: Dispatch<SetStateAction<Database['public']['Tables']['PTW-Casual']['Row'][] | undefined>>,
	setResponseNonCasual: Dispatch<SetStateAction<Database['public']['Tables']['PTW-NonCasual']['Row'][] | undefined>>,
	setResponseMovies: Dispatch<SetStateAction<Database['public']['Tables']['PTW-Movies']['Row'][] | undefined>>
}