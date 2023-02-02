import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Loading from './LoadingComponent'
import { useLoading } from './LoadingContext'

export default function Navbar({ children }: React.PropsWithChildren) {
	const router = useRouter()
	const { loading } = useLoading()
	const [timer, setTimer] = useState<string>('1970-01-01T11:18:58.453Z')
	const navLinks = [
		{
			name: 'Completed',
			posLeft: '-1rem',
			dropdown: [
				{
					name: 'List',
					route: '/completed'
				},
				{
					name: 'Genres',
					route: '/completed/genres'
				},
				{
					name: 'Statistics',
					route: '/completed/statistics'
				}
			]
		},
		{
			name: 'PTW',
			route: '/ptw'
		},
		{
			name: 'Current Season',
			posLeft: '-0.1rem',
			dropdown: [
				{
					name: 'List',
					route: '/seasonal'
				},
				{
					name: 'Details',
					route: '/seasonal/track'
				}
			]
		}
	]

	useEffect(() => {
		async function getTimer() {
			axios
				.get('https://update.ilovesabrina.org:3005/timer')
				.then((response) => setTimer(response.data))
				.catch((error) => setTimer('Error'))
		}
		getTimer()
	}, [])

	return (
		<>
			{loading && <Loading />}
			<nav
				className="h-[60px] flex items-center justify-center gap-[20%] bg-black border-b-[1px]"
				style={{
					borderImage: 'linear-gradient(to right, rgb(218, 51, 190), rgb(191, 94, 255))',
					borderImageSlice: 1
				}}
			>
				<div className="flex items-center">
					<span className="absolute left-8 text-center 2xl:w-max xl:w-40 lg:w-40 lg:visible invisible">
						{timer == 'Error'
							? 'Error'
							: new Intl.DateTimeFormat('en-GB', {
									dateStyle: 'medium',
									timeStyle: 'long'
							  }).format(new Date(timer!))}
					</span>
					<ul>
						{navLinks.map((link, index) => {
							if (link.dropdown)
								return (
									<li
										key={index}
										className="relative inline px-4 py-4 mx-2 rounded-lg hover:bg-pink-400 transition-colors duration-150 cursor-default group"
									>
										<div
											style={{ left: link.posLeft }}
											className="absolute top-[3.4rem] z-50 h-max w-36 bg-black border-pink-400 border-[1px] rounded-md hidden group-hover:block"
										>
											<ul className="py-1">
												{link.dropdown.map((item, index) => {
													return (
														<li key={index} className="flex py-0">
															<Link
																href={item.route}
																className="h-full w-full px-3 py-3 rounded-md text-center hover:bg-pink-400 transition-colors duration-150"
															>
																{item.name}
															</Link>
														</li>
													)
												})}
											</ul>
										</div>
										{link.name}
									</li>
								)
							else
								return (
									<li key={index} className="inline mx-2">
										<Link
											href={link.route}
											style={{
												background: link.route == router.pathname ? 'rgb(244 114 182)' : ''
											}}
											className="p-4 rounded-lg hover:bg-pink-400 focus:bg-pink-400 transition-colors duration-150"
										>
											{link.name}
										</Link>
									</li>
								)
						})}
					</ul>
				</div>
			</nav>

			{children}
		</>
	)
}

{
	/* <li className="inline mx-2" key={index}>
			<Link
				href={link.route}
				style={{
					background:
						link.route == router.pathname ? 'rgb(244 114 182)' : ''
				}}
				className="p-4 rounded-lg hover:bg-pink-400 focus:bg-pink-400 transition-colors duration-150"
			>
				{link.name}
			</Link>
		</li> */
}
