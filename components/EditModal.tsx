import Link from 'next/link'
import { useRouter } from 'next/router'
import { Dispatch, SetStateAction, BaseSyntheticEvent, RefObject } from 'react'
import axios from 'axios'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import { Database } from '@/lib/database.types'

export default function EditModal({
	editModalRef,
	detailsModal,
	setLoading,
	isInMainPage
}: {
	editModalRef: RefObject<HTMLDivElement>
	detailsModal: Database['public']['Tables']['Completed']['Row'] | null
	setLoading: Dispatch<SetStateAction<boolean>>
	isInMainPage?: boolean
}) {
	const router = useRouter()

	async function handleChange(e: BaseSyntheticEvent) {
		e.preventDefault()
		if (!detailsModal) return
		setLoading(true)

		const linkInput = e.target[0].value
		if (
			!linkInput.match(
				/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi
			)
		) {
			setLoading(false)
			return alert('Enter a valid link')
		}

		const url = new URL(linkInput)
		if (url.hostname != 'myanimelist.net') {
			setLoading(false)
			return alert('Enter a link from myanimelist.net')
		}

		const idInput = parseInt(url.pathname.split('/')[2])
		if (!idInput) {
			setLoading(false)
			return alert('ID not found. Enter a valid link')
		}

		try {
			await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/changedetails`, {
				id: detailsModal.id,
				mal_id: idInput
			})
			router.reload()
		} catch (error) {
			setLoading(false)
			alert(error)
		}
	}

	return (
		<div ref={editModalRef} className="hidden">
			<div
				style={{
					opacity: isInMainPage ? 0.3 : 'initial',
					backgroundColor: isInMainPage ? 'black' : 'initial'
				}}
				onClick={() => (editModalRef.current!.style.display = 'none')}
				className="fixed top-0 left-0 h-[100dvh] w-[100dvw]"
			/>
			<div className="fixed flex flex-col items-center h-[30rem] w-[50rem] px-10 py-6 bg-gray-700 rounded-md shadow-md shadow-black drop-shadow-md border-4 border-black top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 modal">
				{isInMainPage ? (
					<div
						tabIndex={0}
						onClick={() => (editModalRef.current!.style.display = 'none')}
						className="absolute right-6 flex items-center justify-center h-11 w-11 rounded-full cursor-pointer transition-colors duration-150 hover:bg-slate-500"
					>
						<CloseIcon fontSize="large" />
					</div>
				) : (
					<div
						onClick={() => (editModalRef.current!.style.display = 'none')}
						className="absolute left-6 flex items-center justify-center h-11 w-11 rounded-full cursor-pointer transition-colors duration-150 hover:bg-slate-500"
					>
						<ArrowBackIcon fontSize="large" />
					</div>
				)}
				<h3 className="font-bold text-2xl">Edit Details</h3>
				<form
					onSubmit={handleChange}
					className="flex flex-col items-center absolute top-[40%] w-3/5"
				>
					<label className="flex flex-col gap-4 items-center mb-6 w-4/5 text-lg">
						Enter MyAnimeList link:
						<input type="text" className="text-base input-text" />
					</label>
					<Link
						href={`https://myanimelist.net/anime.php?q=${detailsModal?.title?.substring(0, 64)}`}
						target="_blank"
						rel='noopener noreferrer'
						className="text-lg link"
					>
						Search for anime title
					</Link>
				</form>
			</div>
		</div>
	)
}
