import { useRouter } from 'next/router'
import { Dispatch, FormEvent, SetStateAction, useRef } from 'react'
import axios from 'axios'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { useLoading } from '@/components/LoadingContext'

export default function EditDialog({
  editDialog,
  setEditDialog,
	details
}: {
  editDialog: boolean;
  setEditDialog: Dispatch<SetStateAction<boolean>>;
	details: { id: number; title: string; };
}) {
  const textValue = useRef('')

  const router = useRouter()

  const { setLoading } = useLoading()

  async function handleChange(e: FormEvent) {
		e.preventDefault()
		setLoading(true)

		if (
			!textValue.current.match(
				/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi
			)
		) {
			setLoading(false)
			return alert('Enter a valid link')
		}

		const url = new URL(textValue.current)
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
				id: details.id,
				mal_id: idInput
			}, { withCredentials: true })
			router.reload()
		} catch (error) {
			setLoading(false)
			alert(error)
		}
	}
  
  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={editDialog}
      onClose={() => setEditDialog(false)}
    >
      <form onSubmit={handleChange} className='flex flex-col'>
        <DialogTitle>
          Enter MyAnimeList link
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            type="url"
            fullWidth
            variant="outlined"
            className='w-96'
            onChange={(e) => textValue.current = e.target.value}
          />
        </DialogContent>
        <a
          href={`https://myanimelist.net/anime.php?q=${details.title?.substring(0, 64)}`}
          target="_blank"
          rel='noopener noreferrer'
          className="self-center link"
        >
          Search for anime title
        </a>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>
            Cancel
          </Button>
          <Button type='submit'>
            Change
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}