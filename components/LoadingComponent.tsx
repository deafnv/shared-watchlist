import { CircularProgress } from '@mui/material';

export default function Loading() {
	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				height: '100dvh',
				width: '100dvw',
				background: 'black',
				opacity: 0.6,
				zIndex: 1000
			}}
			className="flex items-center justify-center"
		>
			<CircularProgress size={50} color="primary" />
		</div>
	);
}
