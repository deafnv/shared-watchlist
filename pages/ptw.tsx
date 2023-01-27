import Head from 'next/head';
import { BaseSyntheticEvent, useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Reorder } from 'framer-motion';
import {
	getRandomInt,
	sortListByNamePTW,
	sortSymbol
} from '../lib/list_methods';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../lib/database.types';
import { loadingGlimmer } from '../components/LoadingGlimmer';
import { CircularProgress, Skeleton } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import { useLoading } from '../components/LoadingContext';
import CancelIcon from '@mui/icons-material/Cancel';

export default function PTW() {
	const rolledTitleRef = useRef('???');
	const rolledTitleElementRef = useRef<HTMLHeadingElement>(null);
	const onlineUsersRef = useRef<any>(null);
	const onlineUsersElementRef = useRef<HTMLSpanElement>(null);
	const latencyRef = useRef<HTMLSpanElement>(null);
	const addGachaRollRef = useRef<HTMLDivElement>(null);

	const [responseRolled, setResponseRolled] =
		useState<Database['public']['Tables']['PTW-Rolled']['Row'][]>();
	const [responseRolled1, setResponseRolled1] =
		useState<Database['public']['Tables']['PTW-Rolled']['Row'][]>();
	const [responseCasual, setResponseCasual] =
		useState<Database['public']['Tables']['PTW-Casual']['Row'][]>();
	const [responseNonCasual, setResponseNonCasual] =
		useState<Database['public']['Tables']['PTW-NonCasual']['Row'][]>();
	const [responseMovies, setResponseMovies] =
		useState<Database['public']['Tables']['PTW-Movies']['Row'][]>();
	const [sortMethod, setSortMethod] = useState<string>('');
	const [isEdited, setIsEdited] = useState<string>('');
	const [reordered, setReordered] = useState(false);
	const [isLoadingClient, setIsLoadingClient] = useState(true);
	const [isLoadingEditForm, setIsLoadingEditForm] = useState(false);
	const { setLoading } = useLoading();

	const setRolledTitle = (value: string) => {
		if (value == '???') {
			addGachaRollRef.current!.style.visibility = 'hidden';
		} else {
			addGachaRollRef.current!.style.visibility = 'visible';
		}
    rolledTitleElementRef.current!.innerHTML = value;
		rolledTitleRef.current = value;
  }

	const setOnlineUsers = (value: any) => {
		if (!value) return;
		const valueArr = Object.keys(value).map((key, index) => value[key])
    onlineUsersRef.current = value;
		onlineUsersElementRef.current!.innerHTML = `${valueArr.length} user(s) online`;
  }

	useEffect(() => {
		setOnlineUsers(onlineUsersRef.current)
		setRolledTitle(rolledTitleRef.current);
	})

	const setLatency = (value: number) => {
		latencyRef.current!.innerHTML = `Latency: ${value.toFixed(1)}ms`;
	}

	const supabase = createClient<Database>(
		'https://esjopxdrlewtpffznsxh.supabase.co',
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	);
	
	const channel = supabase.channel('room1')
	useEffect(() => {
		const getData = async () => {
			const dataRolled = await supabase
				.from('PTW-Rolled')
				.select()
				.order('id', { ascending: true });
			const dataCasual = await supabase
				.from('PTW-Casual')
				.select()
				.order('id', { ascending: true });
			const dataNonCasual = await supabase
				.from('PTW-NonCasual')
				.select()
				.order('id', { ascending: true });
			const dataMovies = await supabase
				.from('PTW-Movies')
				.select()
				.order('id', { ascending: true });

			setResponseRolled(dataRolled.data!);
			setResponseRolled1(dataRolled.data!);
			setResponseCasual(dataCasual.data!);
			setResponseNonCasual(dataNonCasual.data!);
			setResponseMovies(dataMovies.data!);
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

		document.addEventListener('click', (e: any) => {
			if (e.target?.tagName === 'INPUT') return;
			setIsEdited('');
		});
		window.addEventListener('focusout', () => {
			setIsEdited('');
		});
		window.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') setIsEdited('');
		});

		supabase
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
						.order('id', { ascending: true });

					switch (payload.table) {
						case 'PTW-Rolled':
							setResponseRolled(
								data as Database['public']['Tables']['PTW-Rolled']['Row'][]
							);
							setResponseRolled1(
								data as Database['public']['Tables']['PTW-Rolled']['Row'][]
							);
							setReordered(false);
							setSortMethod('');
							break;
						case 'PTW-Casual':
							setResponseCasual(data!);
							break;
						case 'PTW-NonCasual':
							setResponseNonCasual(data!);
							break;
						case 'PTW-Movies':
							setResponseMovies(data!);
							break;
					}
				}
			})
			.subscribe();

    channel
			.on('broadcast', { event: 'ROLL' }, (payload) => {
				setRolledTitle(payload.message)
				if (payload.isLoading) {
					setLoading(true);
				} else setLoading(false);
			})
			.subscribe();
			
		let pingInterval: ReturnType<typeof setInterval> | undefined;
		const latencyChannel = supabase
			.channel(`ping:${getRandomInt(1000000000)}`, {
				config: {
					broadcast: { ack: true },
				},	
			})
			.subscribe((status) => {
				if (status == 'SUBSCRIBED') {
					pingInterval = setInterval(async () => {
						const begin = performance.now();

						const response = await latencyChannel.send({
							type: 'broadcast',
							event: 'latency',
							payload: {},
						});

						if (response !== 'ok') {
							console.log('Ping error');
							setLatency(-1);
						} else {
							const end = performance.now();
							const newLatency = end - begin;
							setLatency(newLatency);
						}

					}, 5000)
				}
			})

		const onlineChannel = supabase.channel('online-users')
			.on('presence', { event: 'sync' }, () => {
				setOnlineUsers(onlineChannel.presenceState());
			})
			.subscribe(async (status) => {
				if (status === 'SUBSCRIBED') {
					const status = await onlineChannel.track({ online_at: new Date().toISOString() })
					console.log(status)
				}
			})

		return () => {
			supabase.removeAllChannels();
			clearInterval(refresh);
			clearInterval(pingInterval);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<Head>
				<title>Cytube Watchlist</title>
				<meta name="description" content="Plan to Watch" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="flex flex-col items-center justify-center gap-4 p-6">
				<div className="flex items-center justify-center gap-12">
					<div className="flex flex-col items-center">
						<h2 className="p-2 text-3xl">
							Plan to Watch (Rolled)
							{sortMethod ? (
								<span
									onClick={() => {
										setResponseRolled(responseRolled1);
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
							onClick={() => {
								sortListByNamePTW(
									'title',
									responseRolled,
									sortMethod,
									setSortMethod,
									setResponseRolled
								);
								setReordered(false);
							}}
							className="flex items-center justify-center h-10 w-[30rem] bg-sky-600 cursor-pointer border-white border-solid border-[1px]"
						>
							<span className="font-bold">Title</span>
						</div>
						{isLoadingClient ? (
							<div className="flex flex-col items-center justify-around h-[448px] w-[30.1rem] border-white border-solid border-[1px] border-t-0">
								{Array(8)
									.fill('')
									.map((item, index) => (
										<Skeleton
											key={index}
											sx={{ backgroundColor: 'grey.700' }}
											animation="wave"
											variant="rounded"
											width={460}
											height={40}
										/>
									))}
							</div>
						) : (
							<Reorder.Group
								values={responseRolled ?? []}
								dragConstraints={{ top: 500 }}
								draggable={sortMethod ? true : false}
								onReorder={(newOrder) => {
									setResponseRolled(newOrder);
									setReordered(true);
								}}
								className="w-[30rem] border-white border-solid border-[1px] border-t-0"
							>
								{responseRolled?.map((item, i) => {
									return (
										!isLoadingClient && (
											<Reorder.Item
												value={item}
												key={item.id}
												className="p-0 hover:bg-neutral-700"
											>
												<div
													style={sortMethod ? undefined : { cursor: 'move' }}
													onDoubleClick={() => {
														setIsEdited(`rolled_${item.title}_${item.id}`);
													}}
													className="p-2 text-center"
												>
													<span className="cursor-text">
														{isEdited == `rolled_${item.title}_${item.id}`
															? editForm('rolled_title', item.id, item.title!)
															: item.title}
													</span>
												</div>
											</Reorder.Item>
										)
									);
								})}
							</Reorder.Group>
						)}
						<div
							style={{
								visibility: !sortMethod && reordered ? 'visible' : 'hidden'
							}}
							className="flex flex-col items-center w-[30rem] px-2"
						>
							<span className="mt-2 text-red-500 text-center">
								⚠ Live updates will be paused while changes are being made to
								this table (Not really)
							</span>
							<div className="flex gap-2 my-2">
								<button
									className="input-submit p-2 rounded-md"
									onClick={() => {
										saveReorder();
										setReordered(false);
									}}
								>
									Save Changes
								</button>
								<button
									className="input-submit p-2 rounded-md"
									onClick={() => {
										setResponseRolled(responseRolled1);
										setReordered(false);
									}}
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
					<Gacha />
				</div>
				<div className="flex gap-4">
					<PTWTable
						response={responseCasual}
						tableName="Casual"
						tableId="casual"
					/>
					<PTWTable
						response={responseNonCasual}
						tableName="Non-Casual"
						tableId="noncasual"
					/>
					<PTWTable
						response={responseMovies}
						tableName="Movies"
						tableId="movies"
					/>
				</div>
				<LatencyBadge />
			</main>
		</>
	);

	function LatencyBadge() {
		function handleOpen(e: BaseSyntheticEvent) {
			const target = e.target as HTMLDivElement;
			if (target.style.width != '18rem') {
				target.style.width = '18rem';
			} else {
				target.style.width = '8.4rem'
			}
		}

		return (
			<div onClick={handleOpen} className='fixed bottom-6 left-6 flex items-center justify-between z-50 p-2 max-h-[2.5rem] w-[8.4rem] rounded-full bg-black border-pink-500 border-[1px] whitespace-nowrap overflow-hidden cursor-pointer ease-out transition-[width]'>
				<span ref={latencyRef} className='text-gray-300 mr-4 pointer-events-none'>Latency: -1.0ms</span>
				<span className='text-gray-300 mx-auto pointer-events-none'> · </span>
				<span ref={onlineUsersElementRef} className='text-gray-300 ml-4 pointer-events-none'></span>
			</div>
		)
	}

	function Gacha() {
		function handleSubmit(e: BaseSyntheticEvent) {
			e.preventDefault();
			if (!responseCasual || !responseNonCasual || !responseMovies) return;

			const target = e.target as any;
			const categoryCasual = target[0].checked;
			const movies = target[2].checked;
			let concatArr;
			if (movies) {
				concatArr = responseMovies?.concat(
					categoryCasual ? responseCasual : responseNonCasual
				);
			} else {
				concatArr = categoryCasual ? responseCasual : responseNonCasual;
			}

			if (supabase.getChannels()[0].state != 'joined') channel.subscribe() 
			if (categoryCasual) {
				const randomTitle = concatArr?.[getRandomInt(responseCasual.length)].title!;
				channel.send({
					type: 'broadcast',
					event: 'ROLL',
					message: randomTitle
				})
				setRolledTitle(randomTitle);
			} else {
				const randomTitle = concatArr?.[getRandomInt(responseNonCasual.length)].title!;
				channel.send({
					type: 'broadcast',
					event: 'ROLL',
					message: randomTitle
				})
				setRolledTitle(randomTitle);
			}
		}

		function handleCancel() {
			if (supabase.getChannels()[0].state != 'joined') channel.subscribe() 
			channel.send({
				type: 'broadcast',
				event: 'ROLL',
				message: '???'
			})
			setRolledTitle('???');
		}

		async function addGachaRoll() {
			const rolledTitle = rolledTitleElementRef.current?.innerText;
			if (
				!responseCasual ||
				!responseNonCasual ||
				!responseMovies ||
				!responseRolled ||
				rolledTitle == '???'
			)
				return;
			if (responseRolled.length >= 20) {
				alert('Unable to add roll to record, insufficient space.');
				return;
			}

			if (supabase.getChannels()[0].state != 'joined') channel.subscribe() 
			channel.send({
				type: 'broadcast',
				event: 'ROLL',
				message: rolledTitle,
				isLoading: true
			})
			setLoading(true);
			const isInMovies = responseMovies.find(
				(item) => item.title == rolledTitle
			);

			if (isInMovies) {
				//? If rolled title is a movie
				const changed = responseMovies
					.slice()
					.filter((item) => item.title != rolledTitle);

				const range = `L22:L${22 + responseMovies.length - 1}`;
				const updatePayload = changed.map((item) => item.title);
				updatePayload.push('');

				const addCell = `N${responseRolled.length + 2}:N${
					responseRolled.length + 2
				}`;
				try {
					await addRolledAPI(range, updatePayload, addCell);
					setLoading(false);
					if (supabase.getChannels()[0].state != 'joined') channel.subscribe() 
					channel.send({
						type: 'broadcast',
						event: 'ROLL',
						message: '???',
						isLoading: false
					})
					setRolledTitle('???');
					return;
				} catch (error) {
					if (supabase.getChannels()[0].state != 'joined') channel.subscribe() 
					channel.send({
						type: 'broadcast',
						event: 'ROLL',
						message: rolledTitle,
						isLoading: false
					})
					setLoading(false);
					alert(error);
					return;
				}
			}

			const isInCasual = responseMovies.find(
				(item) => item.title == rolledTitle
			);

			if (isInCasual) {
				//? If rolled title is in category casual
				const changed = responseCasual
					.slice()
					.filter((item) => item.title != rolledTitle);

				const range = `L2:L${responseCasual.length + 1}`;
				const updatePayload = changed.map((item) => item.title);
				updatePayload.push('');

				const addCell = `N${responseRolled.length + 2}:N${
					responseRolled.length + 2
				}`;
				try {
					await addRolledAPI(range, updatePayload, addCell);
					if (supabase.getChannels()[0].state != 'joined') channel.subscribe() 
					channel.send({
						type: 'broadcast',
						event: 'ROLL',
						message: '???',
						isLoading: false
					})
					setLoading(false);
					setRolledTitle('???')
					return;
				} catch (error) {
					if (supabase.getChannels()[0].state != 'joined') channel.subscribe() 
					channel.send({
						type: 'broadcast',
						event: 'ROLL',
						message: rolledTitle,
						isLoading: false
					})
					setLoading(false);
					alert(error);
					return;
				}
			} else {
				//? If rolled title is in category non-casual
				const changed = responseNonCasual
					.slice()
					.filter((item) => item.title != rolledTitle);

				const range = `M2:M${responseNonCasual.length + 1}`;
				const updatePayload = changed.map((item) => item.title);
				updatePayload.push('');

				const addCell = `N${responseRolled.length + 2}:N${
					responseRolled.length + 2
				}`;
				try {
					await addRolledAPI(range, updatePayload, addCell);
					if (supabase.getChannels()[0].state != 'joined') channel.subscribe() 
					channel.send({
						type: 'broadcast',
						event: 'ROLL',
						message: '???',
						isLoading: false
					})
					setLoading(false);
					setRolledTitle('???');
					return;
				} catch (error) {
					if (supabase.getChannels()[0].state != 'joined') channel.subscribe() 
					channel.send({
						type: 'broadcast',
						event: 'ROLL',
						message: rolledTitle,
						isLoading: false
					})
					setLoading(false);
					alert(error);
					return;
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
				});
			}
		}

		return (
			<div className="relative flex flex-col items-center justify-center gap-4 h-[30rem] w-[25rem] bg-slate-700 rounded-lg -translate-y-8">
				<h2 className="absolute top-5 p-2 text-3xl">Gacha</h2>
				<div className="absolute top-20 flex items-center justify-center h-52 max-h-52 w-80">
					<div className="max-h-full bg-slate-100 border-black border-solid border-[1px] overflow-auto">
						<h3 ref={rolledTitleElementRef} className="p-2 text-black text-2xl text-center">???</h3>
					</div>
				</div>
				<div ref={addGachaRollRef} className="absolute bottom-36">
					<button onClick={addGachaRoll} className=" px-2 p-1 input-submit">
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
							<input
								type="radio"
								name="table_to_roll"
								value="Casual"
								defaultChecked
							/>
							Casual
						</label>
						<label className="relative flex gap-1 items-center radio-container">
							<div className="custom-radio" />
							<input
								type="radio"
								name="table_to_roll"
								value="NonCasual"
							/>
							Non-Casual
						</label>
					</div>
					<div className="flex gap-1">
						<label className="relative flex gap-1 items-center checkbox-container">
							<div className="custom-checkbox" />
							<DoneIcon fontSize="inherit" className="absolute checkmark" />
							<input
								type="checkbox"
								value="IncludeMovies"
							/>
							Include movies?
						</label>
					</div>
					<input type="submit" value="Roll" className="input-submit px-2 p-1" />
				</form>
			</div>
		);
	}

	function PTWTable({
		response,
		tableName,
		tableId
	}: {
		response: Database['public']['Tables']['PTW-Casual']['Row'][] | undefined;
		tableName: string;
		tableId: 'casual' | 'noncasual' | 'movies';
	}) {
		return (
			<div className="flex flex-col items-center">
				<h2 className="p-2 text-3xl">{tableName}</h2>
				<table>
					<tbody>
						<tr>
							<th className="w-[30rem]">
								<span>Title</span>
							</th>
						</tr>
						{isLoadingClient
							? loadingGlimmer(1)
							: response?.map((item) => {
									return (
										<tr key={item.id}>
											<td
												onDoubleClick={() => {
													setIsEdited(`${tableId}_${item.title}_${item.id}`);
												}}
											>
												{isEdited == `${tableId}_${item.title}_${item.id}`
													? editForm(`${tableId}_title`, item.id, item.title!)
													: item.title}
											</td>
										</tr>
									);
							  })}
					</tbody>
				</table>
			</div>
		);
	}

	function editForm(
		field: 'rolled_title' | 'casual_title' | 'noncasual_title' | 'movies_title',
		id: number,
		ogvalue: string
	): React.ReactNode {
		let column: string;
		let row = (id + 2).toString();
		if (field == 'movies_title') row = (id + 22).toString();
		switch (field) {
			case 'rolled_title':
				column = 'N';
				break;
			case 'casual_title':
				column = 'L';
				break;
			case 'noncasual_title':
				column = 'M';
				break;
			case 'movies_title':
				column = 'L';
				break;
			default:
				alert('Error: missing field');
				return;
		}

		async function handleSubmit(event: BaseSyntheticEvent): Promise<void> {
			event.preventDefault();
			setIsLoadingEditForm(true);

			try {
				await axios.post('/api/update', {
					content: event.target[0].value,
					cell: column + row
				});

				switch (field) {
					case 'rolled_title':
						const changedRolled = responseRolled?.slice();
						if (!changedRolled) return;
						changedRolled.find((item) => item.id === id)!['title'] =
							event.target[0].value;
						setResponseRolled(changedRolled);
						setIsEdited('');
						setIsLoadingEditForm(false);
						break;
					case 'casual_title':
						const changedCasual = responseCasual?.slice();
						if (!changedCasual) return;
						changedCasual.find((item) => item.id === id)!['title'] =
							event.target[0].value;
						setResponseCasual(changedCasual);
						setIsEdited('');
						setIsLoadingEditForm(false);
						break;
					case 'noncasual_title':
						const changedNonCasual = responseNonCasual?.slice();
						if (!changedNonCasual) return;
						changedNonCasual.find((item) => item.id === id)!['title'] =
							event.target[0].value;
						setResponseNonCasual(changedNonCasual);
						setIsEdited('');
						setIsLoadingEditForm(false);
						break;
					case 'movies_title':
						const changedMovies = responseMovies?.slice();
						if (!changedMovies) return;
						changedMovies.find((item) => item.id === id)!['title'] =
							event.target[0].value;
						setResponseMovies(changedMovies);
						setIsEdited('');
						setIsLoadingEditForm(false);
						break;
				}
			} catch (error) {
				alert(error);
				return;
			}
		}

		return (
			<div className="flex items-center justify-center relative w-full">
				{isLoadingEditForm ? (
					<CircularProgress size={30} className="absolute" />
				) : null}
				<div
					style={{
						opacity: isLoadingEditForm ? 0.5 : 1,
						pointerEvents: isLoadingEditForm ? 'none' : 'unset'
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

	async function saveReorder() {
		let endRowIndex = responseRolled!.length + 1;
		try {
			await axios.post('/api/ptw/reorder', {
				content: responseRolled,
				cells: `N2:N${endRowIndex}`
			});

			setReordered(false);
		} catch (error) {
			alert(error);
			console.log(error);
			return;
		}
	}
}
