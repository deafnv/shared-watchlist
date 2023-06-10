import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  BaseSyntheticEvent,
  useEffect,
  useRef,
  useState,
  Dispatch,
  SetStateAction,
  RefObject,
} from 'react'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import RefreshIcon from '@mui/icons-material/Refresh'
import { UnwatchedSequels } from '@prisma/client'
import prisma from '@/lib/prisma'
import { useLoading } from '@/components/LoadingContext'
import { SortSymbol } from '@/lib/list_methods'

type UnwatchedSequel = UnwatchedSequels & {
  completed: {
    title: string
  }
}

interface SettingsMenuPos {
  top: number
  left: number
  display: boolean
}

export async function getServerSideProps() {
  const sequelsData = await prisma.unwatchedSequels.findMany({
    include: {
      completed: {
        select: { title: true },
      },
    },
    where: {
      message: {
        not: {
          equals: 'IGNORE',
        },
      },
    },
    orderBy: {
      title_id: 'asc',
    },
  })

  return {
    props: {
      res: sequelsData,
    },
  }
}

export default function CompleteSequels({ res }: { res: UnwatchedSequel[] }) {
  const loadSequelsMenuRef = useRef<HTMLMenuElement>(null)
  const loadSequelsMenuButtonRef = useRef<HTMLButtonElement>(null)
  const sortMethodRef = useRef<`${'asc' | 'desc'}_status` | ''>('')

  const [response, setResponse] = useState(res)
  const [ignore, setIgnore] = useState<UnwatchedSequel>()
  const [loadSequelsMenu, setLoadSequelsMenu] = useState<SettingsMenuPos>({
    top: 0,
    left: 0,
    display: false,
  })

  const { setLoading } = useLoading()

  const router = useRouter()

  useEffect(() => {
    const exitMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.parentNode !== loadSequelsMenuButtonRef.current &&
        target.parentNode?.parentNode !== loadSequelsMenuButtonRef.current &&
        !loadSequelsMenuButtonRef.current?.contains(target) &&
        loadSequelsMenuButtonRef.current
      ) {
        setLoadSequelsMenu({ ...loadSequelsMenu, display: false })
      }
    }

    document.addEventListener('click', exitMenu)

    return () => {
      document.removeEventListener('click', exitMenu)
    }
  }, [loadSequelsMenu])

  function sortListByStatusSequels() {
    if (sortMethodRef.current === `desc_status`) {
      sortMethodRef.current = 'asc_status'
      setResponse(res?.slice().sort((a, b) => b.sequel_status!.localeCompare(a.sequel_status!)))
    } else {
      sortMethodRef.current = 'desc_status'
      setResponse(res?.slice().sort((a, b) => a.sequel_status!.localeCompare(b.sequel_status!)))
    }
  }

  if (!response?.length) {
    return (
      <>
        <Head>
          <title>Watchlist</title>
          <meta name='description' content='Unwatched Sequels' />
        </Head>

        <main className='flex flex-col items-center justify-center gap-4 h-[100dvh] mb-24 px-1 md:px-0'>
          <h2 className='text-2xl sm:text-3xl'>No unwatched sequels found</h2>
          {/* <span>Check console for details on omitted entries</span> */}
          <Button onClick={handleLoadSequels} variant='outlined'>
            Reload sequels
          </Button>
        </main>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Watchlist</title>
        <meta name='description' content='Unwatched Sequels' />
      </Head>

      <main className='flex flex-col items-center justify-center mb-24 px-6 py-2'>
        <header className='flex items-center'>
          <h2 className='p-2 text-2xl sm:text-3xl text-center'>Unwatched Sequels</h2>
          <IconButton
            ref={loadSequelsMenuButtonRef}
            onClick={handleLoadSequelsMenu}
            className='flex items-center justify-center h-7 w-7 cursor-pointer rounded-full translate-y-0 sm:translate-y-[2px]'
          >
            <MoreVertIcon sx={{ fontSize: 28 }} />
          </IconButton>
          {sortMethodRef.current && (
            <IconButton
              title='Reset sort'
              onClick={() => {
                sortMethodRef.current = ''
                setResponse(res)
              }}
              className='flex items-center justify-center h-7 w-7 cursor-pointer rounded-full translate-y-[1px]'
            >
              <RefreshIcon sx={{ fontSize: 28 }} />
            </IconButton>
          )}
        </header>
        <section className='p-2 bg-primary-foreground rounded-md'>
          <div className='grid grid-cols-[0.6fr_4fr_4fr_2.4fr] xl:grid-cols-[4rem_30rem_30rem_10rem] min-w-[95dvw] xl:min-w-0 sm:w-min border-b'>
            <span className='flex items-center justify-center p-2 pt-1 h-full text-xs md:text-base text-center font-bold'>
              No.
            </span>
            <span className='flex items-center justify-center p-2 pt-1 h-full text-xs md:text-base text-center font-bold'>
              Title
            </span>
            <span className='flex items-center justify-center p-2 pt-1 h-full text-xs md:text-base text-center font-bold'>
              Sequel Title
            </span>
            <span
              onClick={sortListByStatusSequels}
              className='flex items-center justify-center p-2 pt-1 h-full text-xs md:text-base text-center font-bold cursor-pointer'
            >
              <span className='relative'>
                Status
                <SortSymbol type='status' sortMethodRef={sortMethodRef} />
              </span>
            </span>
          </div>
          {response?.map((item) => {
            return (
              <div
                key={item.title_id}
                className='grid grid-cols-[0.6fr_4fr_4fr_2.4fr] xl:grid-cols-[4rem_30rem_30rem_10rem] text-sm md:text-base min-w-[95dvw] xl:min-w-0 sm:w-min rounded-md hover:bg-primary-accent'
              >
                <span className='flex items-center justify-center p-2 h-full text-xs md:text-base text-center'>
                  {item.title_id}
                </span>
                <Link
                  href={`/completed/anime/${item.title_id}`}
                  className='flex items-center justify-center p-2 h-full text-xs md:text-base text-center link text-pink-300'
                >
                  {item.completed.title}
                </Link>
                <a
                  href={`https://myanimelist.net/anime/${item.sequel_mal_id}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center justify-center p-2 h-full text-xs md:text-base text-center link text-blue-300'
                >
                  {item.sequel_title}
                </a>
                <span
                  className={`flex flex-col xl:flex-row items-center justify-center gap-2 p-1 xl:p-2 h-full text-xs md:text-base text-center capitalize rounded-e-md ${determineStatus(
                    item.sequel_status
                  )}`}
                >
                  {item.sequel_status.split('_').join(' ')}
                </span>
                {/* <span className="flex flex-col xl:flex-row items-center justify-center gap-2 p-1 xl:p-2 h-full text-xs xl:text-base text-center group-hover:bg-primary-accent rounded-md">
									<Button
										onClick={() => setIgnore(item)}
										color='error'
										size='small'
									>
										Ignore
									</Button>
								</span> */}
              </div>
            )
          })}
        </section>
        <ConfirmModal ignore={ignore} setIgnore={setIgnore} />
        <LoadSequelsMenu
          loadSequelsMenu={loadSequelsMenu}
          loadSequelsMenuRef={loadSequelsMenuRef}
          handleLoadSequels={handleLoadSequels}
        />
      </main>
    </>
  )

  function handleLoadSequelsMenu(e: BaseSyntheticEvent) {
    const { top, left } = e.target.getBoundingClientRect()

    setLoadSequelsMenu({
      top: top + window.scrollY,
      left: left + window.scrollX - 240,
      display: true,
    })
  }

  async function handleLoadSequels() {
    setLoading(true)
    try {
      await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/completed/loadsequels`, {
        withCredentials: true,
      })
      router.reload()
    } catch (error) {
      setLoading(false)
      alert(error)
    }
  }
}

function determineStatus(status: string) {
  switch (status) {
    case 'not_yet_aired':
      return 'bg-red-600'
    case 'currently_airing':
      return 'bg-yellow-600'
    case 'finished_airing':
      return 'bg-green-600'
    default:
      return ''
  }
}

function LoadSequelsMenu({
  loadSequelsMenu,
  loadSequelsMenuRef,
  handleLoadSequels,
}: {
  loadSequelsMenu: SettingsMenuPos
  loadSequelsMenuRef: RefObject<HTMLMenuElement>
  handleLoadSequels: () => Promise<void>
}) {
  const { setLoading } = useLoading()

  const router = useRouter()

  async function handleLoadStatus() {
    setLoading(true)
    try {
      await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/completed/filtersequels`, {
        withCredentials: true,
      })
      router.reload()
    } catch (error) {
      setLoading(false)
      alert(error)
    }
  }

  return (
    <AnimatePresence>
      {loadSequelsMenu.display && (
        <motion.menu
          initial={{ maxHeight: 0, opacity: 0 }}
          animate={{ maxHeight: '7.4rem', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
          ref={loadSequelsMenuRef}
          style={{
            top: loadSequelsMenu.top,
            left: loadSequelsMenu.left,
          }}
          className='absolute z-20 p-2 h-auto w-[15rem] shadow-md shadow-black bg-black border-pink-400 border-[1px] rounded-md overflow-hidden'
        >
          <li className='flex justify-center h-fit rounded-md hover:bg-pink-400'>
            <button onClick={handleLoadSequels} className='py-2 w-full'>
              Load sequels
            </button>
          </li>
          <li className='flex justify-center h-fit rounded-md hover:bg-pink-400'>
            <button onClick={handleLoadStatus} className='py-2 w-full'>
              Load sequels status
            </button>
          </li>
        </motion.menu>
      )}
    </AnimatePresence>
  )
}

function ConfirmModal({
  ignore,
  setIgnore,
}: {
  ignore: UnwatchedSequel | undefined
  setIgnore: Dispatch<SetStateAction<UnwatchedSequel | undefined>>
}) {
  const router = useRouter()

  const { setLoading } = useLoading()

  async function handleIgnore() {
    if (!ignore) return
    setLoading(true)
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/changedetails`,
        {
          id: ignore.id,
          mal_id: 0,
          type: 'IGNORE_SEQUEL',
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
    <Dialog fullWidth maxWidth='xs' open={!!ignore} onClose={() => setIgnore(undefined)}>
      <div className='p-2'>
        <DialogTitle fontSize='large'>Confirm ignore sequel?</DialogTitle>
        <DialogActions>
          <Button onClick={handleIgnore} variant='outlined'>
            Yes
          </Button>
          <Button onClick={() => setIgnore(undefined)} color='error'>
            No
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  )
}
