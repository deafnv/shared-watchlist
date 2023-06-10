import { BaseSyntheticEvent, Dispatch, SetStateAction } from 'react'
import axios from 'axios'
import Button from '@mui/material/Button'
import CancelIcon from '@mui/icons-material/Cancel'
import DoneIcon from '@mui/icons-material/Done'
import { PTWCasual, PTWMovies, PTWNonCasual, PTWRolled } from '@prisma/client'
import { getRandomInt } from '@/lib/list_methods'
import { apiSocket } from '@/lib/socket'
import { useLoading } from '@/components/LoadingContext'

//* Component to roll show watch order
export default function Gacha({
  responseCasual,
  responseNonCasual,
  responseMovies,
  responseRolled,
  rolledTitle,
  setRolledTitle,
}: {
  responseCasual: PTWCasual[] | undefined
  responseNonCasual: PTWNonCasual[] | undefined
  responseMovies: PTWMovies[] | undefined
  responseRolled: PTWRolled[] | undefined
  rolledTitle: string
  setRolledTitle: Dispatch<SetStateAction<string>>
}) {
  const { setLoading } = useLoading()

  function handleSubmit(e: BaseSyntheticEvent) {
    e.preventDefault()
    if (!responseCasual || !responseNonCasual || !responseMovies) return

    const target = e.target as any
    const categoryCasual = target[0].checked
    const movies = target[2].checked
    let concatArr
    if (movies) {
      concatArr = responseMovies?.concat(categoryCasual ? responseCasual : responseNonCasual)
    } else {
      concatArr = categoryCasual ? responseCasual : responseNonCasual
    }

    if (categoryCasual) {
      const randomTitle = concatArr?.[getRandomInt(responseCasual.length)].title!
      apiSocket.emit('roll', {
        message: randomTitle,
      })
      setRolledTitle(randomTitle)
    } else {
      const randomTitle = concatArr?.[getRandomInt(responseNonCasual.length)].title!
      apiSocket.emit('roll', {
        message: randomTitle,
      })
      setRolledTitle(randomTitle)
    }
  }

  function handleCancel() {
    apiSocket.emit('roll', {
      message: '???',
    })
    setRolledTitle('???')
  }

  async function addGachaRoll() {
    if (
      !responseCasual ||
      !responseNonCasual ||
      !responseMovies ||
      !responseRolled ||
      rolledTitle == '???'
    )
      return
    if (responseRolled.length >= 21) {
      alert('Unable to add roll to record, insufficient space.')
      return
    }

    apiSocket.emit('roll', {
      message: rolledTitle,
      isLoading: true,
    })
    setLoading(true)
    const isInMovies = responseMovies.find((item) => item.title.trim() == rolledTitle)

    if (isInMovies) {
      //? If rolled title is a movie
      const changed = responseMovies.slice().filter((item) => item.title.trim() != rolledTitle)

      const range = `L22:L${22 + responseMovies.length - 1}`
      const updatePayload = changed.map((item) => item.title)
      updatePayload.push('')

      const addCell = `N${responseRolled.length + 2}:N${responseRolled.length + 2}`
      try {
        await addRolledAPI(range, updatePayload, addCell)
        setLoading(false)
        apiSocket.emit('roll', {
          message: '???',
          isLoading: false,
        })
        setRolledTitle('???')
        return
      } catch (error) {
        apiSocket.emit('roll', {
          message: rolledTitle,
          isLoading: false,
        })
        setLoading(false)
        alert(error)
        return
      }
    }

    const isInCasual = responseCasual.find((item) => item.title.trim() == rolledTitle)

    if (isInCasual) {
      //? If rolled title is in category casual
      console.log('CASUAL')
      const changed = responseCasual.slice().filter((item) => item.title.trim() != rolledTitle)

      const range = `L2:L${responseCasual.length + 1}`
      const updatePayload = changed.map((item) => item.title)
      updatePayload.push('')

      const addCell = `N${responseRolled.length + 2}:N${responseRolled.length + 2}`
      try {
        await addRolledAPI(range, updatePayload, addCell)
        apiSocket.emit('roll', {
          message: '???',
          isLoading: false,
        })
        setLoading(false)
        setRolledTitle('???')
        return
      } catch (error) {
        apiSocket.emit('roll', {
          message: rolledTitle,
          isLoading: false,
        })
        setLoading(false)
        alert(error)
        return
      }
    }

    const isInNonCasual = responseNonCasual.find((item) => item.title.trim() == rolledTitle)

    if (isInNonCasual) {
      //? If rolled title is in category non-casual
      console.log('NONCASUAL')
      const changed = responseNonCasual.slice().filter((item) => item.title.trim() != rolledTitle)

      const range = `M2:M${responseNonCasual.length + 1}`
      const updatePayload = changed.map((item) => item.title)
      updatePayload.push('')

      const addCell = `N${responseRolled.length + 2}:N${responseRolled.length + 2}`
      try {
        await addRolledAPI(range, updatePayload, addCell)
        apiSocket.emit('roll', {
          message: '???',
          isLoading: false,
        })
        setLoading(false)
        setRolledTitle('???')
        return
      } catch (error) {
        apiSocket.emit('roll', {
          message: rolledTitle,
          isLoading: false,
        })
        setLoading(false)
        alert(error)
        return
      }
    }

    //? In case title is not found
    alert(
      'Error: Rolled title not found. Check entries to make sure they have no special characters.'
    )

    async function addRolledAPI(
      range: string,
      updatePayload: Array<string | null>,
      addCell: string
    ) {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/ptw/addrolled`,
        {
          deleteStep: {
            range: range,
            content: updatePayload,
          },
          addStep: {
            cell: addCell,
            content: rolledTitle,
          },
        },
        { withCredentials: true }
      )
    }
  }

  return (
    <div className='relative flex flex-col items-center justify-center gap-4 h-[30rem] w-[80dvw] md:w-[25rem] bg-primary-foreground rounded-lg -translate-y-8'>
      <h2 className='absolute top-5 p-2 text-2xl sm:text-3xl'>Gacha</h2>
      <div className='absolute top-20 flex items-center justify-center h-52 max-h-52 w-80'>
        <div className='max-h-full max-w-[90%] bg-white/95 border-black border-solid border overflow-auto'>
          <h3 className='p-2 text-black text-xl sm:text-2xl text-center'>{rolledTitle}</h3>
        </div>
      </div>
      <div className={`absolute bottom-36 ${rolledTitle == '???' ? 'invisible' : 'visible'}`}>
        <Button onClick={addGachaRoll} variant='outlined'>
          Add to List
        </Button>
        <CancelIcon
          onClick={handleCancel}
          className='absolute top-2 right-[-32px] cursor-pointer transition-colors duration-100 hover:text-red-500'
        />
      </div>
      <form onSubmit={handleSubmit} className='absolute flex flex-col items-center gap-2 bottom-6'>
        <div className='flex'>
          <label className='relative flex gap-1 items-center mr-3 radio-container'>
            <div className='custom-radio' />
            <input type='radio' name='table_to_roll' value='Casual' defaultChecked />
            Casual
          </label>
          <label className='relative flex gap-1 items-center radio-container'>
            <div className='custom-radio' />
            <input type='radio' name='table_to_roll' value='NonCasual' />
            Non-Casual
          </label>
        </div>
        <div className='flex gap-1'>
          <label className='relative flex gap-1 items-center checkbox-container'>
            <div className='custom-checkbox' />
            <DoneIcon fontSize='inherit' className='absolute checkmark' />
            <input type='checkbox' value='IncludeMovies' />
            Include movies?
          </label>
        </div>
        <Button type='submit' variant='outlined'>
          Roll
        </Button>
      </form>
    </div>
  )
}
