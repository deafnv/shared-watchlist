import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Loading from './LoadingComponent';
import { useLoading } from './LoadingContext';

export default function Navbar({ children }: React.PropsWithChildren) {
	const router = useRouter();
	const { loading } = useLoading();
	const [timer, setTimer] = useState<string>('1970-01-01T11:18:58.453Z');
	const navLinks = [
		{
			name: 'Completed',
			route: '/completed'
		},
		{
			name: 'Genres',
			route: '/completed/genres'
		},
		{
			name: 'PTW',
			route: '/ptw'
		},
		{
			name: 'Current Season',
			route: '/seasonal'
		},
		{
			name: 'Seasonal Details',
			route: '/seasonal/track'
		}
	];

	useEffect(() => {
		async function getTimer() {
			axios
				.get('https://update.ilovesabrina.org:3005/timer')
				.then((response) => setTimer(response.data))
				.catch((error) => setTimer('Error'));
		}
		getTimer();
	}, []);

	return (
		<>
			{loading && <Loading />}
			<nav
				className="h-[60px] flex items-center justify-center gap-[20%] bg-black border-b-[1px]"
				style={{
					borderImage:
						'linear-gradient(to right, rgb(218, 51, 190), rgb(191, 94, 255))',
					borderImageSlice: 1
				}}
			>
				<div className="flex items-center">
					<span className="absolute left-8">
						{timer == 'Error'
							? 'Error'
							: new Intl.DateTimeFormat('en-GB', {
									dateStyle: 'medium',
									timeStyle: 'long'
							  }).format(new Date(timer!))}
					</span>
					<ul>
						{navLinks.map((link, index) => {
							return (
								<li className="inline mx-2" key={index}>
									<Link
										href={link.route}
										style={{
											background:
												link.route == router.pathname ? 'rgb(244 114 182)' : ''
										}}
										className="p-4 rounded-lg hover:bg-pink-400 focus:bg-pink-400 transition-colors duration-200"
									>
										{link.name}
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
			</nav>

			{children}
		</>
	);
}
