import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import '../styles/nprogress.css';
import NProgress from 'nprogress';
import { useRouter } from 'next/router';
import { LoadingProvider } from '../components/LoadingContext';
import { ThemeProvider, createTheme } from '@mui/material';
import { orange } from '@mui/material/colors';
import Loading from '../components/LoadingComponent';

declare module '@mui/material/styles' {
	interface Theme {
		status: {
			danger: string;
		};
	}
	// allow configuration using `createTheme`
	interface ThemeOptions {
		status?: {
			danger?: string;
		};
	}
}

export default function App({ Component, pageProps }: AppProps) {
	const router = useRouter();
	NProgress.configure({
		showSpinner: false
	});

	const theme = createTheme({
		status: {
			danger: orange[500]
		},
		palette: {
			primary: {
				main: '#14a1ff'
			}
		}
	});

	useEffect(() => {
		const handleRouteStart = () => NProgress.start();
		const handleRouteDone = () => NProgress.done();

		router.events.on('routeChangeStart', handleRouteStart);
		router.events.on('routeChangeComplete', handleRouteDone);
		router.events.on('routeChangeError', handleRouteDone);

		return () => {
			// Make sure to remove the event handler on unmount!
			router.events.off('routeChangeStart', handleRouteStart);
			router.events.off('routeChangeComplete', handleRouteDone);
			router.events.off('routeChangeError', handleRouteDone);
		};
	}, []);

	return (
		<ThemeProvider theme={theme}>
			<LoadingProvider>
				<Navbar>
					<Component {...pageProps} />
				</Navbar>
			</LoadingProvider>
		</ThemeProvider>
	);
}
