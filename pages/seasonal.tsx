import { createClient } from '@supabase/supabase-js';
import { Database } from '../lib/database.types';
import { BaseSyntheticEvent, useEffect, useState } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { loadingGlimmer } from '../components/LoadingGlimmer';
import { CircularProgress } from '@mui/material';

export default function Seasonal({
	res
}: {
	res: Database['public']['Tables']['PTW-CurrentSeason']['Row'][];
}) {
	const [response, setResponse] =
		useState<Database['public']['Tables']['PTW-CurrentSeason']['Row'][]>();
	const [isEdited, setIsEdited] = useState<string>('');
	const [isLoadingClient, setIsLoadingClient] = useState(true);
	const [isLoadingEditForm, setIsLoadingEditForm] = useState(false);

	useEffect(() => {
		const supabase = createClient<Database>(
			'https://esjopxdrlewtpffznsxh.supabase.co',
			process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
		);
		const getData = async () => {
			const { data } = await supabase
				.from('PTW-CurrentSeason')
				.select()
				.order('id', { ascending: true });

			setResponse(data!);
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
			if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'SELECT')
				return;
			setIsEdited('');
		});
		window.addEventListener('focusout', () => {
			setIsEdited('');
		});
		window.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') setIsEdited('');
		});

		supabase
			.channel('public:PTW-CurrentSeason')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'PTW-CurrentSeason' },
				async (payload) => {
					const { data } = await supabase
						.from('PTW-CurrentSeason')
						.select()
						.order('id', { ascending: true });
					setResponse(data!);
				}
			)
			.subscribe();

		return () => {
			supabase.removeAllChannels();
			clearInterval(refresh);
		};
	}, []);

	return (
		<>
			<Head>
				<title>Cytube Watchlist</title>
				<meta name="description" content="Current Season" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="flex flex-col items-center justify-center">
				<h2 className="p-2 text-3xl">Current Season</h2>
				<table>
					<tbody>
						<tr>
							<th className="w-[30rem]">Title</th>
							<th className="w-[10rem]">Status</th>
						</tr>
						{isLoadingClient
							? loadingGlimmer(2)
							: response?.map((item) => {
									let status;
									switch (item.status) {
										case 'Not loaded':
											status = 'crimson';
											break;
										case 'Loaded':
											status = 'orange';
											break;
										case 'Watched':
											status = 'green';
											break;
										case 'Not aired':
											status = 'black';
											break;
										default:
											status = '';
									}
									return (
										<tr key={item.id}>
											<td
												onDoubleClick={() => {
													setIsEdited(
														`seasonal_title_${item.title}_${item.id}`
													);
												}}
											>
												{isEdited == `seasonal_title_${item.title}_${item.id}`
													? editForm(`seasonal_title`, item.id, item.title!)
													: item.title}
											</td>
											<td
												onDoubleClick={() => {
													setIsEdited(
														`seasonal_status_${item.title}_${item.id}`
													);
												}}
												style={{
													backgroundColor: status
												}}
											>
												{isEdited == `seasonal_status_${item.title}_${item.id}`
													? editStatus(item.id)
													: ''}
											</td>
										</tr>
									);
							  })}
					</tbody>
				</table>
			</main>
		</>
	);

	function editForm(
		field: 'seasonal_title',
		id: number,
		ogvalue: string
	): React.ReactNode {
		let column: string;
		let row = (id + 2).toString();
		switch (field) {
			case 'seasonal_title':
				column = 'O';
				break;
		}

		async function handleSubmit(event: BaseSyntheticEvent): Promise<void> {
			event.preventDefault();
			setIsLoadingEditForm(true);

			try {
				await axios.post('/api/update', {
					content: event.target[0].value,
					cell: column + row
				});

				const changed = response?.slice();
				if (!changed) return;
				changed.find((item) => item.id === id)!['title'] =
					event.target[0].value;
				setResponse(changed);
				setIsEdited('');
				setIsLoadingEditForm(false);
			} catch (error) {
				setIsLoadingEditForm(false);
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

	function editStatus(id: number) {
		async function handleSubmit(event: BaseSyntheticEvent) {
			event.preventDefault();
			setIsLoadingEditForm(true);

			let row = id + 2;
			try {
				await axios.post('/api/seasonal/updatestatus', {
					content: event.target.childNodes[0].value,
					cells: `P${row}:P${row}`
				});

				const changed = response?.slice();
				if (!changed) return;
				changed.find((item) => item.id === id)!['status'] =
					event.target.childNodes[0].value;
				setResponse(changed);
				setIsEdited('');
				setIsLoadingEditForm(false);
			} catch (error) {
				setIsLoadingEditForm(false);
				alert(error);
				return;
			}
		}

		return (
			<div
				style={{ backgroundColor: isLoadingEditForm ? 'black' : 'unset' }}
				className="flex items-center justify-center relative w-full"
			>
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
					<form onSubmit={handleSubmit} className="text-gray-800">
						<select
							onChange={(e) => {
								(e.target.parentNode as HTMLFormElement)!.requestSubmit();
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
		);
	}
}
