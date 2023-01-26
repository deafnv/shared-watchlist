import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Home() {
	const router = useRouter();

	useEffect(() => {
		router.replace('/completed');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
}
