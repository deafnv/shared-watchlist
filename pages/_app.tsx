import Head from 'next/head'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { Quicksand } from 'next/font/google'
import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import NProgress from 'nprogress'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { LoadingProvider } from '@/components/LoadingContext'
import Navbar from '@/components/Navbar'
import '@/styles/globals.css'
import '@/styles/nprogress.css'

const quicksand = Quicksand({ subsets: ['latin'] })

declare module '@mui/material/styles' {
	interface Theme {
		status: {
			danger: string
		}
	}
	interface ThemeOptions {
		status?: {
			danger?: string
		}
	}
}

const theme = createTheme({
  palette: {
    primary: {
      light: '#e3f2fd',
      main: '#40a9ff',
      dark: '#42a5f5',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ff7961',
      main: '#60a5fa',
      dark: '#90c1fc',
      contrastText: '#000',
    },
    mode: 'dark'
  },
  typography: {
    fontFamily: `-apple-system, BlinkMacSystemFont, ${quicksand.style.fontFamily}, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif`
  }
});

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
			router.events.off('routeChangeStart', handleRouteStart)
			router.events.off('routeChangeComplete', handleRouteDone)
			router.events.off('routeChangeError', handleRouteDone)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const env = process.env.NODE_ENV == 'production'

	return (
		<>
			<LoadingProvider>
				<ThemeProvider theme={theme}>
					<Head>
						<meta name="viewport" content="width=device-width, initial-scale=1" />
					</Head>
					<style jsx global>{`
						html {
							font-family: ${quicksand.style.fontFamily};
						}
					`}</style>
					<Navbar />
					<Component {...pageProps} />
				</ThemeProvider>
			</LoadingProvider>
			{env && <Analytics />}
		</>
	)
}
