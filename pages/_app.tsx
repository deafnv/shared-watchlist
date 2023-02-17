import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import '../styles/nprogress.css'
import NProgress from 'nprogress'
import { useRouter } from 'next/router'
import { LoadingProvider } from '../components/LoadingContext'
import { Analytics } from '@vercel/analytics/react'
import { PresenceProvider } from '../components/PresenceProvider'
import HeadCommon from '../components/Head'

declare module '@mui/material/styles' {
	interface Theme {
		status: {
			danger: string
		}
	}
	// allow configuration using `createTheme`
	interface ThemeOptions {
		status?: {
			danger?: string
		}
	}
}

export default function App({ Component, pageProps }: AppProps) {
	const router = useRouter()
	NProgress.configure({
		showSpinner: false
	})

	useEffect(() => {
		const handleRouteStart = () => NProgress.start()
		const handleRouteDone = () => {
			(document.activeElement as HTMLElement).blur()
			NProgress.done()
		}

		router.events.on('routeChangeStart', handleRouteStart)
		router.events.on('routeChangeComplete', handleRouteDone)
		router.events.on('routeChangeError', handleRouteDone)
		
		document.addEventListener('keydown', (e) => {
			if (e.key == 'Enter') {
				(document.activeElement as HTMLElement)?.click()
			}
		})

		return () => {
			// Make sure to remove the event handler on unmount!
			router.events.off('routeChangeStart', handleRouteStart)
			router.events.off('routeChangeComplete', handleRouteDone)
			router.events.off('routeChangeError', handleRouteDone)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const env = process.env.NODE_ENV == 'production'

	return (
		<>
			<HeadCommon />
			<PresenceProvider>
				<LoadingProvider>
					<Navbar />
					<Component {...pageProps} />
				</LoadingProvider>
				{env && <Analytics />}
			</PresenceProvider>
		</>
	)
}
