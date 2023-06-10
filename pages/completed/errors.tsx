import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, Dispatch, SetStateAction } from 'react'
import axios from 'axios'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import { levenshtein } from '@/lib/list_methods'
import { useLoading } from '@/components/LoadingContext'
import EditDialog from '@/components/dialogs/EditDialog'
import prisma from '@/lib/prisma'

interface ErrorItem {
  id: number
  mal_id: number | null
  entryTitle: string | null
  retrievedTitle: string | null
  distance: number | undefined
}

export async function getStaticProps() {
  const completedWithDetails = await prisma.completed.findMany({
    where: {
      details: {
        isNot: null,
      },
    },
    include: {
      details: true,
    },
    orderBy: {
      id: 'asc',
    },
  })

  const errorTrackData = await prisma.completedErrors.findMany({
    where: {
      message: {
        in: ['IGNORE', 'CHANGED'],
      },
    },
  })
  const errorTrackIgnore = errorTrackData?.map((item) => item.title_id)

  const levenDistance = completedWithDetails
    .map((item) => {
      const distance = levenshtein(item.title!, item.details?.mal_title!)
      if (distance! > 5) {
        return {
          id: item.id,
          mal_id: item.details?.mal_id,
          entryTitle: item.title,
          retrievedTitle: item.details?.mal_title,
          distance: distance,
        }
      }
      return null
    })
    .filter((item) => item)
    .filter((item) => !errorTrackIgnore?.includes(item!.id))
    .sort((a, b) => b?.distance! - a?.distance!)

  return {
    props: {
      response: levenDistance,
    },
    revalidate: 360,
  }
}

export default function CompletedErrors({ response }: { response: ErrorItem[] }) {
  const [changed, setChanged] = useState<ErrorItem | null>(null)
  const [ignore, setIgnore] = useState<ErrorItem>()

  if (!response?.length) {
    return (
      <>
        <Head>
          <title>Watchlist</title>
          <meta name='description' content='Completed Errors' />
        </Head>

        <main className='flex flex-col items-center justify-center h-[100dvh] mb-24 px-1 md:px-0'>
          <h2 className='p-2 text-2xl sm:text-3xl'>No errors found</h2>
          {/* <span>Check console for details on omitted entries</span> */}
        </main>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Watchlist</title>
        <meta name='description' content='Completed Errors' />
      </Head>

      <main className='flex flex-col items-center justify-center mb-24 px-6 py-2'>
        <h2 className='p-2 text-2xl sm:text-3xl text-center'>Potential Errors in Completed</h2>
        <section className='p-2 bg-neutral-700 rounded-md'>
          <div className='grid grid-cols-[5fr_5fr_1fr_3fr] xl:grid-cols-[26rem_26rem_10rem_12rem] min-w-[95dvw] xl:min-w-0 sm:w-min border-b'>
            <span className='flex items-center justify-center p-2 pt-1 h-full text-xs md:text-base text-center font-bold'>
              Title
            </span>
            <span className='flex items-center justify-center p-2 pt-1 h-full text-xs md:text-base text-center font-bold'>
              Retrieved Title
            </span>
            <span className='flex items-center p-2 pt-1 h-full text-xs md:text-base text-center font-bold [writing-mode:vertical-lr] xl:[writing-mode:initial]'>
              Levenshtein Distance
            </span>
            <span className='flex items-center justify-center p-2 pt-1 h-full text-xs md:text-base text-center font-bold'>
              Options
            </span>
          </div>
          {response?.map((item) => {
            return (
              <div
                key={item.id}
                className='grid grid-cols-[5fr_5fr_1fr_3fr] xl:grid-cols-[26rem_26rem_10rem_12rem] text-sm md:text-base min-w-[95dvw] xl:min-w-0 sm:w-min group'
              >
                <Link
                  href={`/completed/anime/${item.id}`}
                  className='flex items-center justify-center sm:px-3 py-3 h-full text-xs md:text-base text-center text-pink-300 hover:underline group-hover:bg-zinc-800 rounded-s-md'
                >
                  {item.entryTitle}
                </Link>
                <a
                  href={`https://myanimelist.net/anime/${item.mal_id}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center justify-center sm:px-3 py-3 h-full text-xs md:text-base text-center text-blue-300 hover:underline group-hover:bg-zinc-800'
                >
                  {item.retrievedTitle}
                </a>
                <span className='flex items-center justify-center p-2 h-full text-xs md:text-base text-center group-hover:bg-zinc-800'>
                  {item.distance}
                </span>
                <span className='flex flex-col xl:flex-row items-center justify-center gap-2 p-1 xl:p-2 h-full text-xs xl:text-base text-center group-hover:bg-zinc-800 rounded-e-md'>
                  <Button onClick={() => setChanged(item)} variant='outlined' size='small'>
                    Change
                  </Button>
                  <Button onClick={() => setIgnore(item)} color='error' size='small'>
                    Ignore
                  </Button>
                </span>
              </div>
            )
          })}
        </section>
        <EditDialog
          editDialog={!!changed}
          setEditDialog={() => setChanged(null)}
          details={{ id: changed?.id ?? 0, title: changed?.entryTitle ?? '' }}
        />
        <ConfirmModal ignore={ignore} setIgnore={setIgnore} />
      </main>
    </>
  )
}

function ConfirmModal({
  ignore,
  setIgnore,
}: {
  ignore: ErrorItem | undefined
  setIgnore: Dispatch<SetStateAction<ErrorItem | undefined>>
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
          type: 'IGNORE_ERROR',
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
        <DialogTitle fontSize='large'>Confirm ignore error?</DialogTitle>
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
