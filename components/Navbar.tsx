import axios from 'axios'
import throttle from 'lodash/throttle'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Loading from './LoadingComponent'
import { useLoading } from './LoadingContext'

export default function Navbar({ children }: React.PropsWithChildren) {
	const router = useRouter()
	const { loading } = useLoading()
	const [timer, setTimer] = useState<string>('1970-01-01T11:18:58.453Z')
	const [navbar, setNavbar] = useState(true)
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
				.get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/timer`)
				.then((response) => setTimer(response.data))
				.catch((error) => setTimer('Error'))
		}
		getTimer()

		const navbarAnimate = () => {
			if (window.scrollY == 0) {
				setNavbar(true)
			} else setNavbar(false)
		}

		window.addEventListener('scroll', throttle(navbarAnimate, 100))
	}, [])

	return (
		<>
			{loading && <Loading />}
			<nav
				className="sticky top-0 z-50 h-[60px] min-w-full flex items-center justify-center gap-[20%] bg-black bg-opacity-60 border-b-[1px] backdrop-blur-md backdrop-filter"
				style={{
					borderImage: 'linear-gradient(to right, rgb(218, 51, 190), rgb(191, 94, 255))',
					borderImageSlice: 1,
					background: navbar ? 'rgba(0, 0, 0, 1)' : 'rgba(0, 0, 0, 0.6)',
					transition: 'background-color 800ms'
				}}
			>
				<div className="flex items-center">
					<span className="absolute right-8 text-center 2xl:w-max xl:w-40 lg:w-40 lg:visible invisible">
						{timer == 'Error'
							? 'Error'
							: new Intl.DateTimeFormat('en-GB', {
									dateStyle: 'medium',
									timeStyle: 'long'
							  }).format(new Date(timer!))}
					</span>
					<ul className='flex items-center'>
						{navLinks.map((link, index) => {
							if (link.dropdown)
								return (
									<li
										key={index}
										tabIndex={0}
										className="relative inline px-2 sm:px-4 py-4 mx-0 sm:mx-2 max-h-[60px] text-[0.75rem] sm:text-base rounded-lg hover:bg-pink-400 focus:bg-pink-400 transition-colors duration-150 cursor-default group"
									>
										<div
											style={{ left: link.posLeft }}
											className="absolute top-[3.4rem] translate-x-2 sm:translate-x-0 z-50 h-max sm:w-36 bg-black border-pink-400 border-[1px] rounded-md hidden group-hover:block group-focus-within:block"
										>
											<ul className="py-1">
												{link.dropdown.map((item, index) => {
													return (
														<li key={index} className="flex py-0">
															<Link
																href={item.route}
																style={{
																	background: item.route == router.pathname ? 'rgb(244 114 182)' : '',
																	pointerEvents: item.route == router.pathname ? 'none' : 'auto'
																}}
																className="h-full w-full px-3 py-3 rounded-md text-center hover:bg-pink-400 focus:bg-pink-400 transition-colors duration-150"
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
												background: link.route == router.pathname ? 'rgb(244 114 182)' : '',
												pointerEvents: link.route == router.pathname ? 'none' : 'auto'
											}}
											className="px-2 sm:px-4 py-4 text-[0.75rem] sm:text-base rounded-lg hover:bg-pink-400 focus:bg-pink-400 transition-colors duration-150"
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
