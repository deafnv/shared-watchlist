import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  BaseSyntheticEvent,
  useEffect,
  useState,
  useRef,
  Dispatch,
  SetStateAction,
  RefObject,
} from 'react'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { SeasonalDetails } from '@prisma/client'
import prisma from '@/lib/prisma'
import { useLoading } from '@/components/LoadingContext'

interface ContextMenuPos {
  top: number
  left: number
  currentItem: SeasonalDetails | null
}

interface SettingsMenuPos {
  top: number
  left: number
  display: boolean
}

export const getServerSideProps = async () => {
  const seasonalDetails = await prisma.seasonalDetails.findMany({
    orderBy: {
      start_date: 'asc',
    },
  })

  return {
    props: {
      res: seasonalDetails,
    },
  }
}

export default function SeasonalDetailsPage({ res }: { res: SeasonalDetails[] }) {
  const contextMenuRef = useRef<HTMLMenuElement>(null)
  const contextMenuButtonRef = useRef<any>([])
  const refreshReloadMenuRef = useRef<HTMLDivElement>(null)
  const refreshReloadMenuButtonRef = useRef<HTMLButtonElement>(null)

  const [response, setResponse] = useState(res)
  const [lastUpdatedDates, setLastUpdatedDates] = useState<{ [key: number]: string }>()
  const [editEpisodesCurrent, setEditEpisodesCurrent] = useState<SeasonalDetails | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuPos>({
    top: 0,
    left: 0,
    currentItem: null,
  })
  const [refreshReloadMenu, setRefreshReloadMenu] = useState<SettingsMenuPos>({
    top: 0,
    left: 0,
    display: false,
  })

  useEffect(() => {
    let obj: { [key: number]: string } = {}
    response.forEach((item) => {
      obj[item.mal_id] = new Date(item.last_updated ?? '').toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'numeric',
        year: '2-digit',
      })
    })
    setLastUpdatedDates(obj)

    const closeEditModal = (e: KeyboardEvent) => {
      if (e.key == 'Escape' && editEpisodesCurrent) setEditEpisodesCurrent(null)
    }

    const closeMenus = (e: any) => {
      if (
        !contextMenuButtonRef.current.includes(e.target.parentNode) &&
        !contextMenuButtonRef.current.includes(e.target.parentNode?.parentNode) &&
        !contextMenuRef.current?.contains(e.target) &&
        contextMenuRef.current
      ) {
        setContextMenu({ ...contextMenu, currentItem: null })
      }
      if (
        e.target.parentNode !== refreshReloadMenuButtonRef.current &&
        e.target.parentNode?.parentNode !== refreshReloadMenuButtonRef.current &&
        !refreshReloadMenuRef.current?.contains(e.target) &&
        refreshReloadMenuRef.current
      ) {
        setRefreshReloadMenu({ ...refreshReloadMenu, display: false })
      }
    }

    document.addEventListener('keydown', closeEditModal)
    document.addEventListener('click', closeMenus)

    return () => {
      document.removeEventListener('keydown', closeEditModal)
      document.removeEventListener('click', closeMenus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (response.length == 0) {
    return (
      <>
        <Head>
          <title>Watchlist</title>
          <meta name='description' content='Seasonal Details' />
        </Head>

        <main className='flex flex-col items-center justify-center p-6'>
          <div className='relative'>
            <h2 className='mb-6 text-3xl'>Episode Tracker</h2>
            <IconButton
              ref={refreshReloadMenuButtonRef}
              onClick={handleRefreshReloadMenu}
              className='!absolute top-[0.3rem] -right-10 z-10 flex items-center justify-center h-7 w-7 cursor-pointer rounded-full'
            >
              <MoreVertIcon sx={{ fontSize: 28 }} />
            </IconButton>
          </div>
          <span className='absolute font-semibold text-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
            No details loaded
          </span>
          <RefreshReloadMenu
            refreshReloadMenu={refreshReloadMenu}
            refreshReloadMenuRef={refreshReloadMenuRef}
            response={response}
          />
        </main>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Watchlist</title>
        <meta name='description' content='Seasonal Details' />
      </Head>

      <main className='flex flex-col items-center justify-center mb-24 px-6 py-2'>
        <header className='flex items-center mb-2'>
          <h2 className='p-2 text-2xl sm:text-3xl'>Episode Tracker</h2>
          <IconButton
            ref={refreshReloadMenuButtonRef}
            onClick={handleRefreshReloadMenu}
            className='flex items-center justify-center h-7 w-7 cursor-pointer rounded-full translate-y-0 sm:translate-y-[2px]'
          >
            <MoreVertIcon sx={{ fontSize: 28 }} />
          </IconButton>
        </header>

        <div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
          {response.map((item, index) => (
            <article
              key={item.mal_id}
              className='relative flex flex-col gap-2 p-3 bg-primary-foreground shadow-md shadow-black rounded-md group'
            >
              <span
                onClick={showTitle}
                className='px-7 font-bold self-center text-sm sm:text-base text-center line-clamp-2'
              >
                {item.mal_title}
              </span>
              <IconButton
                ref={(element) => (contextMenuButtonRef.current[index] = element)}
                onClick={(e) => {
                  handleMenuClick(e, item)
                }}
                className='!absolute top-3 right-4 z-10 flex items-center justify-center h-6 w-6 opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity duration-75'
              >
                <MoreVertIcon />
              </IconButton>
              <div className='flex'>
                <div className='relative h-[10rem] sm:h-[13rem] w-[12rem] sm:w-[15rem] overflow-hidden'>
                  <Image
                    src={item.image_url ?? 'https://via.placeholder.com/400x566'}
                    alt='Art'
                    fill
                    priority
                    sizes='(max-width: 768px) 20vw,
											10vw'
                    className='object-contain'
                  />
                </div>
                <div className='flex flex-col items-center gap-1 justify-center w-full'>
                  <span className='text-center'>
                    <span className='font-semibold'>Episodes: </span>
                    {item.num_episode ? item.num_episode : 'Unknown'}
                  </span>
                  <span style={{ textTransform: 'capitalize' }} className='text-center'>
                    <span className='font-semibold'>Status: </span>
                    {item.status?.split('_').join(' ')}
                  </span>
                  <span className='text-center'>
                    <span className='font-semibold'>Start Date: </span>
                    {item.start_date ? item.start_date : 'Unknown'}
                  </span>
                  <span style={{ textTransform: 'capitalize' }} className='text-center'>
                    <span className='font-semibold'>Broadcast: </span>
                    {item.broadcast ?? 'Unknown'}
                  </span>
                  <Link
                    href={`https://myanimelist.net/anime/${item.mal_id}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='link'
                  >
                    MyAnimeList
                  </Link>
                  <span title='Last time episode tracker updated/edited' className='text-center'>
                    <span className='font-semibold'>Last updated: </span>
                    {item.last_updated && lastUpdatedDates
                      ? lastUpdatedDates[item.mal_id]
                      : 'Unknown'}
                  </span>
                </div>
              </div>
              <div>
                <div className='relative w-full m-2 flex items-center justify-center'>
                  <span className='text-lg font-semibold'>
                    Aired Episodes {`(${item.latest_episode ?? '-'}/${item.num_episode ?? '-'})`}
                  </span>
                  {item.message?.includes('Exempt') && (
                    <span className='ml-2 text-lg font-semibold'>(Edited)</span>
                  )}
                  <IconButton
                    title='Edit episode count'
                    onClick={() => setEditEpisodesCurrent(item)}
                    className='!absolute right-4 flex items-center justify-center h-6 w-6 rounded-full cursor-pointer transition-colors invisible group-hover:visible group/icon'
                  >
                    <EditIcon
                      fontSize='small'
                      className='text-white/50 group-hover/icon:text-white transition-colors'
                    />
                  </IconButton>
                </div>
                <EpisodeTable item={item} response={response} setResponse={setResponse} />
              </div>
            </article>
          ))}
        </div>
        <EpisodeCountEditor
          editEpisodesCurrent={editEpisodesCurrent}
          setEditEpisodesCurrent={setEditEpisodesCurrent}
        />
        <ContextMenu contextMenu={contextMenu} contextMenuRef={contextMenuRef} />
        <RefreshReloadMenu
          refreshReloadMenu={refreshReloadMenu}
          refreshReloadMenuRef={refreshReloadMenuRef}
          response={response}
        />
      </main>
    </>
  )

  function handleRefreshReloadMenu(e: BaseSyntheticEvent) {
    const { top, left } = e.target.getBoundingClientRect()

    setRefreshReloadMenu({
      top: top + window.scrollY,
      left: left + window.scrollX - 240,
      display: true,
    })
  }

  function handleMenuClick(e: BaseSyntheticEvent, item: SeasonalDetails) {
    const { top, left } = e.target.getBoundingClientRect()

    setContextMenu({
      top: top + window.scrollY,
      left: left + window.scrollX - 240,
      currentItem: item,
    })
  }

  //* Show truncated long titles on click
  function showTitle(e: BaseSyntheticEvent) {
    const target = e.target as HTMLSpanElement
    target.style.webkitLineClamp = '100'
    target.style.overflow = 'auto'
  }
}

//* Options menu at header
function RefreshReloadMenu({
  refreshReloadMenu,
  refreshReloadMenuRef,
  response,
}: {
  refreshReloadMenu: SettingsMenuPos
  refreshReloadMenuRef: RefObject<HTMLDivElement>
  response: SeasonalDetails[]
}) {
  const { setLoading } = useLoading()

  const router = useRouter()

  async function refresh() {
    try {
      setLoading(true)
      await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/seasonal/batchtrack`, {
        withCredentials: true,
      })
      router.reload()
    } catch (error) {
      setLoading(false)
      alert(error)
    }
  }

  async function reload() {
    try {
      setLoading(true)
      await axios.get('/api/seasonaldetails/refreshseasonal')
      router.reload()
    } catch (error) {
      setLoading(false)
      alert(error)
    }
  }

  return (
    <AnimatePresence>
      {refreshReloadMenu.display && (
        <motion.menu
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: '7.6rem', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
          ref={refreshReloadMenuRef}
          style={{
            top: refreshReloadMenu.top,
            left: refreshReloadMenu.left,
          }}
          className='absolute z-20 p-2 h-[7.6rem] w-[15rem] shadow-md shadow-black bg-black border-pink-400 border-[1px] rounded-md overflow-hidden'
        >
          {response.length ? (
            <li className='flex justify-center h-fit rounded-md hover:bg-pink-400'>
              <button onClick={refresh} className='py-2 w-full'>
                Refresh episode tracking
              </button>
            </li>
          ) : null}
          <li className='flex justify-center h-fit rounded-md hover:bg-pink-400'>
            <button onClick={reload} className='py-2 w-full'>
              Reload current season data from sheet
            </button>
          </li>
        </motion.menu>
      )}
    </AnimatePresence>
  )
}

//* Dialog to manually edit aired episode count
function EpisodeCountEditor({
  editEpisodesCurrent,
  setEditEpisodesCurrent,
}: {
  editEpisodesCurrent: SeasonalDetails | null
  setEditEpisodesCurrent: Dispatch<SetStateAction<SeasonalDetails | null>>
}) {
  const router = useRouter()

  const { setLoading } = useLoading()

  async function handleEditSubmit(e: BaseSyntheticEvent) {
    e.preventDefault()
    setLoading(true)
    const editLatestEpisode = parseInt(e.target[0].value)
    try {
      await axios.post('/api/seasonaldetails/changeerror', {
        content: {
          latest_episode: editLatestEpisode,
          message: 'Exempt:Manual Edit',
          last_updated: new Date().toISOString(),
        },
        id: editEpisodesCurrent?.mal_id,
        compare: 'mal_id',
      })
      router.reload()
    } catch (error) {
      setLoading(false)
      alert(error)
    }
  }

  return (
    <Dialog
      fullWidth
      maxWidth='md'
      open={!!editEpisodesCurrent}
      onClose={() => setEditEpisodesCurrent(null)}
    >
      <div className='flex flex-col items-center gap-4 p-6 py-10'>
        <h3 className='font-bold text-2xl'>Manual Edit Episodes</h3>
        <IconButton
          size='small'
          onClick={() => setEditEpisodesCurrent(null)}
          className='!absolute top-6 right-6 cursor-pointer'
        >
          <CloseIcon fontSize='large' />
        </IconButton>
        <span>{editEpisodesCurrent?.mal_title}</span>
        <form onSubmit={handleEditSubmit}>
          <label className='flex flex-col items-center gap-2'>
            Enter latest episode:
            <input
              autoFocus
              type='number'
              min={-1}
              max={9999}
              defaultValue={editEpisodesCurrent?.latest_episode ?? 0}
              className='text-center input-text'
            />
          </label>
        </form>
        <EpisodeTable item={editEpisodesCurrent} />
      </div>
    </Dialog>
  )
}

function ContextMenu({
  contextMenu,
  contextMenuRef,
}: {
  contextMenu: ContextMenuPos
  contextMenuRef: RefObject<HTMLMenuElement>
}) {
  const router = useRouter()

  const { setLoading } = useLoading()

  async function handleReloadTrack() {
    try {
      setLoading(true)
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/seasonal/trackitem`,
        {
          id: contextMenu.currentItem?.mal_id,
        },
        { withCredentials: true }
      )

      router.reload()
    } catch (error) {
      setLoading(false)
      alert(error)
    }
  }

  return (
    <AnimatePresence>
      {contextMenu.currentItem && (
        <motion.menu
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: '5.6rem', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
          ref={contextMenuRef}
          style={{
            top: contextMenu.top,
            left: contextMenu.left,
          }}
          className='absolute z-20 p-2 h-[9.5rem] w-[15rem] shadow-md shadow-gray-600 bg-black border border-pink-400 rounded-md overflow-hidden'
        >
          <li className='flex justify-center'>
            <span className='text-center font-semibold line-clamp-1'>
              {contextMenu.currentItem?.mal_title}
            </span>
          </li>
          <hr className='my-2 border-t' />
          <li className='flex justify-center h-8 rounded-sm hover:bg-pink-400'>
            <button onClick={handleReloadTrack} className='w-full'>
              Reload Episode Tracking
            </button>
          </li>
        </motion.menu>
      )}
    </AnimatePresence>
  )
}

//* Construct table component showing episodes in threes
function EpisodeTable({
  item,
  response,
  setResponse,
}: {
  item: SeasonalDetails | null
  response?: SeasonalDetails[]
  setResponse?: Dispatch<SetStateAction<SeasonalDetails[]>>
}) {
  let counter = 1
  const isTwoCour = (item?.latest_episode ?? 0) > 12

  return (
    <div className='relative grid grid-cols-1 min-[390px]:grid-cols-2 gap-2'>
      {Array(4)
        .fill('')
        .map((_, index) => (
          <div key={index} className='p-2 bg-secondary-foreground rounded-md'>
            <table className='w-full'>
              <thead>
                <tr>
                  <th className='w-11'>{isTwoCour ? counter++ + 12 : counter++}</th>
                  <th className='w-11'>{isTwoCour ? counter++ + 12 : counter++}</th>
                  <th className='w-11'>{isTwoCour ? counter++ + 12 : counter++}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    className={`p-6 rounded-s-md ${determineEpisode(
                      item?.latest_episode ?? 0,
                      counter - 3
                    )}`}
                  />
                  <td
                    className={`p-6 ${determineEpisode(item?.latest_episode ?? 0, counter - 2)}`}
                  />
                  <td
                    className={`p-6 rounded-e-md ${determineEpisode(
                      item?.latest_episode ?? 0,
                      counter - 1
                    )}`}
                  />
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      {response && setResponse && item && (
        <ValidateErrorDialog item1={item} response={response} setResponse={setResponse} />
      )}
    </div>
  )
}

//* Dialog for user to validate any errors (ignore, or fix error)
function ValidateErrorDialog({
  item1,
  response,
  setResponse,
}: {
  item1: SeasonalDetails
  response: SeasonalDetails[]
  setResponse: Dispatch<SetStateAction<SeasonalDetails[]>>
}) {
  const [validateArea, setValidateArea] = useState('')

  const router = useRouter()

  const { setLoading } = useLoading()

  async function handleChange(e: BaseSyntheticEvent) {
    e.preventDefault()
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
      await axios.post('/api/seasonaldetails/fixerror', {
        title: item1.title,
        mal_id: idInput,
      })
      router.reload()
    } catch (error) {
      setLoading(false)
      alert(error)
    }
  }

  async function handleIgnore() {
    try {
      setLoading(true)
      await axios.post('/api/seasonaldetails/changeerror', {
        content: { message: '' },
        id: item1.mal_id,
        compare: 'mal_id',
      })

      const changed = response.slice()
      changed.find((item) => item.title === item1.title)!['message'] = ''
      setResponse(changed)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      alert(error)
    }
  }

  function validateForm() {
    switch (validateArea) {
      case `${item1.mal_id}_change`:
        return (
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] h-[125%] w-[105%] flex flex-col justify-center items-center gap-2 glass'>
            <span className='text-center text-lg'>Enter correct link: </span>
            <Link
              href={item1.message?.split('Validate:')[1] ?? ''}
              target='_blank'
              rel='noopener noreferrer'
              className='link mb-4 col-span-2 text-center'
            >
              Search on MAL
            </Link>
            <form onSubmit={handleChange} className='col-span-2 grid grid-cols-2 gap-2'>
              <input autoFocus type='text' className='col-span-2 input-text text-center'></input>
              <Button
                type='submit'
                variant='outlined'
                className='font-bold border-2 hover:border-2'
              >
                Update
              </Button>
              <Button
                onClick={() => setValidateArea('')}
                type='reset'
                color='error'
                className='font-bold'
              >
                Cancel
              </Button>
            </form>
          </div>
        )
      case `${item1.mal_id}_ignore`:
        return (
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] h-[125%] w-[105%] flex flex-col justify-center items-center gap-2 glass'>
            <span className='text-red-500 text-lg'>⚠ Are you sure?</span>
            <div className='flex gap-4'>
              <Button
                onClick={handleIgnore}
                variant='outlined'
                size='large'
                className='font-bold border-2 hover:border-2'
              >
                Yes
              </Button>
              <Button
                onClick={() => setValidateArea('')}
                color='error'
                size='large'
                className='font-bold'
              >
                No
              </Button>
            </div>
          </div>
        )
      default:
        return (
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] h-[125%] w-[105%] flex flex-col justify-center items-center gap-2 glass'>
            <span className='text-red-500 text-lg'>⚠ This entry appears to be wrong</span>
            <div className='flex gap-4'>
              <Button
                onClick={() => setValidateArea(`${item1.mal_id}_change`)}
                variant='outlined'
                size='large'
                className='font-bold border-2 hover:border-2'
              >
                Change
              </Button>
              <Button
                onClick={() => setValidateArea(`${item1.mal_id}_ignore`)}
                color='error'
                size='large'
                className='font-bold'
              >
                Ignore
              </Button>
            </div>
          </div>
        )
    }
  }

  return item1.message?.includes('Validate:') ? validateForm() : null
}

//* Utility function to determine if episode has been watched (red -> true)
function determineEpisode(latestEpisode: number, index: number) {
  const accountFor2Cour = latestEpisode > 12 ? latestEpisode - 12 : latestEpisode
  if (accountFor2Cour >= index) {
    return 'bg-red-600'
  } else return 'bg-black'
}
