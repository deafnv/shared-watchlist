import {
  BaseSyntheticEvent,
  useEffect,
  useState,
  useRef,
  Dispatch,
  SetStateAction,
  MutableRefObject,
  RefObject,
} from 'react'
import Head from 'next/head'
import axios from 'axios'
import { AnimatePresence, motion, Reorder } from 'framer-motion'
import isEqual from 'lodash/isEqual'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import { PTWCasual, PTWMovies, PTWNonCasual, PTWRolled } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import { AddRecordPos, PTWEdited, PTWTables } from '@/lib/types'
import { PTWRolledFields, sortListByTitlePTW, SortSymbol } from '@/lib/list_methods'
import { apiSocket, updaterSocket } from '@/lib/socket'
import { useLoading } from '@/components/LoadingContext'
import Gacha from '@/components/ptw/PTWGacha'
import PTWTable from '@/components/ptw/PTWTable'
import PTWRolledTableItem from '@/components/ptw/PTWRolledTableItem'

interface ContextMenuPos {
  top: number
  left: number
  currentItem: PTWRolled | null
}

export default function PTW() {
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const contextMenuButtonRef = useRef<any>([])
  const sortMethodRef = useRef<`${'asc' | 'desc'}_${PTWRolledFields}` | ''>('')
  const isEditedRef = useRef<`${PTWTables}_${string}_${number}` | ''>('')
  const reordered = useRef(false)
  const entryToDelete = useRef<any | null>(null)
  const setReordered = (value: boolean) => (reordered.current = value)

  const [responseRolled, setResponseRolled] = useState<PTWRolled[]>()
  const [responseRolled1, setResponseRolled1] = useState<PTWRolled[]>()
  const [responseCasual, setResponseCasual] = useState<PTWCasual[]>()
  const [responseNonCasual, setResponseNonCasual] = useState<PTWNonCasual[]>()
  const [responseMovies, setResponseMovies] = useState<PTWMovies[]>()
  const [isEdited, setIsEditedState] = useState<PTWEdited>('')
  const [isLoadingEditForm, setIsLoadingEditForm] = useState<string[]>([])
  const [confirmModal, setConfirmModal] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuPos>({
    top: 0,
    left: 0,
    currentItem: null,
  })
  const [isAdded, setIsAdded] = useState<AddRecordPos>({
    top: 0,
    left: 0,
    response: undefined,
    tableId: null,
  })
  const [rolledTitle, setRolledTitle] = useState('???')
  const [latency, setLatency] = useState(-1)
  const [onlineUsers, setOnlineUsersState] = useState(-1)

  const { setLoading } = useLoading()

  const setIsEdited = (value: PTWEdited) => {
    isEditedRef.current = value
    setIsEditedState(value)
  }

  const setConfirmModalDelEntry = () => {
    entryToDelete.current = contextMenu.currentItem
    setConfirmModal(true)
  }

  const setOnlineUsers = (value: any) => {
    if (!value) return
    const valueArr = Object.keys(value).map((key) => value[key])
    setOnlineUsersState(valueArr.length)
  }

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
    )

    const getRolled = () => {
      axios.get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/table/ptwrolled`).then(({ data }) => {
        setResponseRolled(data)
        setResponseRolled1(data)
      })
    }
    const getCasual = () =>
      axios
        .get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/table/ptwcasual`)
        .then(({ data }) => setResponseCasual(data))
    const getNonCasual = () =>
      axios
        .get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/table/ptwnoncasual`)
        .then(({ data }) => setResponseNonCasual(data))
    const getMovies = () =>
      axios
        .get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/table/ptwmovies`)
        .then(({ data }) => setResponseMovies(data))

    const initializePage = async () => {
      getRolled()
      getCasual()
      getNonCasual()
      getMovies()
      await axios
        .get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/refresh`)
        .catch((error) => console.error(error))
    }
    initializePage()

    const apiSocketRollHandler = (payload: any) => {
      setRolledTitle(payload.message)
      if (payload.isLoading) {
        setLoading(true)
      } else setLoading(false)
    }

    const initializeSocket = async () => {
      apiSocket.connect()
      apiSocket.on('connect', () => {
        console.log('connected')
      })

      apiSocket.on('roll', apiSocketRollHandler)

      updaterSocket.connect()
      updaterSocket.on('PTWRolled', () => {
        sortMethodRef.current = ''
        setReordered(false)
        getRolled()
      })
      updaterSocket.on('PTWCasual', () => {
        sortMethodRef.current = ''
        setReordered(false)
        getCasual()
      })
      updaterSocket.on('PTWNonCasual', () => {
        sortMethodRef.current = ''
        setReordered(false)
        getNonCasual()
      })
      updaterSocket.on('PTWMovies', () => {
        sortMethodRef.current = ''
        setReordered(false)
        getMovies()
      })
    }
    initializeSocket()

    const pingInterval = setInterval(() => {
      const start = Date.now()

      apiSocket.emit('ping', () => {
        const duration = Date.now() - start
        setLatency(duration)
      })
    }, 2500)

    const refresh = setInterval(
      () => axios.get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/refresh`),
      1700000
    )

    const onlineChannel = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        setOnlineUsers(onlineChannel.presenceState())
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const status = await onlineChannel.track({ online_at: new Date().toISOString() })
          console.log(status)
        }
      })

    const resetOnClickOut = (e: any) => {
      if (
        !contextMenuButtonRef.current.includes(e.target.parentNode) &&
        !contextMenuButtonRef.current.includes(e.target.parentNode?.parentNode) &&
        !contextMenuRef.current?.contains(e.target) &&
        contextMenuRef.current
      ) {
        setContextMenu({ top: 0, left: 0, currentItem: null })
      }
      if (
        e.target?.tagName !== 'INPUT' &&
        e.target?.tagName !== 'svg' &&
        e.target?.tagName !== 'path'
      ) {
        setIsAdded({ ...isAdded, tableId: null })
      }
    }

    const resetEditedOnFocusOut = () => {
      setIsEdited('')
    }

    const resetEditedOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsEdited('')
    }

    document.addEventListener('click', resetOnClickOut)
    window.addEventListener('focusout', resetEditedOnFocusOut)
    window.addEventListener('keydown', resetEditedOnEscape)

    return () => {
      apiSocket.off('roll', apiSocketRollHandler)
      apiSocket.disconnect()
      //TODO: remove updaterSocket handlers
      updaterSocket.disconnect()
      onlineChannel.unsubscribe()
      clearInterval(refresh)
      clearInterval(pingInterval)
      document.removeEventListener('click', resetOnClickOut)
      window.removeEventListener('focusout', resetEditedOnFocusOut)
      window.removeEventListener('keydown', resetEditedOnEscape)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  //* Submit handler for editing fields
  async function handleSubmit(
    id: number,
    field: `${PTWTables}_title`,
    ogvalue: string,
    event: BaseSyntheticEvent
  ): Promise<void> {
    event.preventDefault()
    let column: string
    let row = (id + 2).toString()

    if (field == 'movies_title') row = (id + 22).toString()
    switch (field) {
      case 'rolled_title':
        column = 'N'
        break
      case 'casual_title':
        column = 'L'
        break
      case 'noncasual_title':
        column = 'M'
        break
      case 'movies_title':
        column = 'L'
        break
      default:
        alert('Error: missing field')
        return
    }

    const currentlyProcessedEdit = isEditedRef.current

    if (ogvalue == event.target[0].value) {
      setIsEdited('')
      return
    }

    setIsLoadingEditForm(isLoadingEditForm.concat(`${field}_${id}`))

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/update`,
        {
          content: event.target[0].value,
          cell: column + row,
        },
        { withCredentials: true }
      )

      switch (field) {
        case 'rolled_title':
          changeResponse(responseRolled, setResponseRolled)
          break
        case 'casual_title':
          changeResponse(responseCasual, setResponseCasual)
          break
        case 'noncasual_title':
          changeResponse(responseNonCasual, setResponseNonCasual)
          break
        case 'movies_title':
          changeResponse(responseMovies, setResponseMovies)
          break
      }
    } catch (error) {
      alert(error)
      return
    }

    function changeResponse(
      response: Array<{ [key: string]: any }> | undefined,
      setResponse: Dispatch<SetStateAction<any>>
    ) {
      const changed = response?.slice()
      if (!changed) return
      changed.find((item) => item.id === id)!['title'] = event.target[0].value
      setResponse(changed)
      if (isEditedRef.current == currentlyProcessedEdit) setIsEdited('')
      setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${id}`))
    }
  }

  return (
    <>
      <Head>
        <title>Watchlist</title>
        <meta name='description' content='Plan to Watch' />
      </Head>

      <main className='flex flex-col items-center justify-center gap-4 mb-24 px-6 py-2'>
        <section className='flex flex-col lg:flex-row items-center justify-center w-full gap-12'>
          <div className='flex flex-col items-center min-h-[40rem] w-[30rem] lg:w-auto'>
            <header className='flex items-center mt-5'>
              <h2 className='p-2 text-2xl sm:text-3xl'>Plan to Watch (Rolled)</h2>
              <IconButton
                title='Add new entry'
                onClick={(e) => handleAddMenu(e, responseRolled, 'rolled', setIsAdded)}
                className='flex items-center justify-center h-7 w-7 cursor-pointer rounded-full sm:translate-y-[2px]'
              >
                <AddIcon />
              </IconButton>
              {sortMethodRef.current && (
                <IconButton
                  title='Reset sort'
                  onClick={() => {
                    sortMethodRef.current = ''
                    setResponseRolled(responseRolled1)
                  }}
                  className='flex items-center justify-center h-7 w-7 cursor-pointer rounded-full translate-y-[1px]'
                >
                  <RefreshIcon />
                </IconButton>
              )}
            </header>
            <div className='p-2 bg-neutral-700 rounded-md'>
              <div className='grid grid-cols-[4fr_1.1fr] min-w-0 w-[80dvw] lg:w-[40rem] border-b'>
                <span
                  onClick={() => {
                    sortListByTitlePTW(responseRolled, sortMethodRef, setResponseRolled)
                    setReordered(false)
                  }}
                  className='flex items-center justify-center p-2 pt-1 h-full text-center font-bold cursor-pointer'
                >
                  <span className='relative'>
                    Title
                    <SortSymbol type='title' sortMethodRef={sortMethodRef} />
                  </span>
                </span>
                <span className='flex items-center justify-center p-2 pt-1 h-full text-center font-bold'>
                  Status
                </span>
              </div>
              {!responseRolled ? (
                <div className='flex items-center justify-center h-[34rem]'>
                  <CircularProgress size={42} color='primary' />
                </div>
              ) : (
                <Reorder.Group
                  values={responseRolled ?? []}
                  draggable={sortMethodRef.current ? true : false}
                  onReorder={(newOrder) => {
                    setContextMenu({ top: 0, left: 0, currentItem: null })
                    setResponseRolled(newOrder)
                    setReordered(true)
                  }}
                  className='flex flex-col min-w-[80dvw] lg:min-w-full w-min'
                >
                  {responseRolled.map((item, index) => (
                    <PTWRolledTableItem
                      key={item.id}
                      item={item}
                      index={index}
                      isEditedRef={isEditedRef}
                      sortMethodRef={sortMethodRef}
                      contextMenuButtonRef={contextMenuButtonRef}
                      isEdited={isEdited}
                      setIsEdited={setIsEdited}
                      isLoadingEditForm={isLoadingEditForm}
                      setIsLoadingEditForm={setIsLoadingEditForm}
                      setContextMenu={setContextMenu}
                      responseRolled={responseRolled}
                      setResponseRolled={setResponseRolled}
                      handleSubmit={handleSubmit}
                    />
                  ))}
                </Reorder.Group>
              )}
            </div>
            <div
              style={{
                visibility:
                  !sortMethodRef.current &&
                  reordered.current &&
                  !isEqual(responseRolled, responseRolled1)
                    ? 'visible'
                    : 'hidden',
              }}
              className='flex flex-col items-center w-[30rem] px-2'
            >
              {/* <span className="mt-2 text-red-500 text-center">
								⚠ Live updates will be paused while changes are being made to this table (Not
								really)
							</span> */}
              <div className='flex gap-2 my-2'>
                <Button
                  onClick={() => saveReorder(responseRolled, setLoading, setReordered)}
                  variant='outlined'
                >
                  Save changes
                </Button>
                <Button
                  onClick={() => {
                    setResponseRolled(responseRolled1)
                    setReordered(false)
                  }}
                  color='error'
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
          <Gacha
            responseCasual={responseCasual}
            responseNonCasual={responseNonCasual}
            responseMovies={responseMovies}
            responseRolled={responseRolled}
            rolledTitle={rolledTitle}
            setRolledTitle={setRolledTitle}
          />
        </section>
        <section className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          <PTWTable
            isEdited={isEdited}
            setIsEdited={setIsEdited}
            isLoadingEditForm={isLoadingEditForm}
            entryToDelete={entryToDelete}
            setConfirmModal={setConfirmModal}
            response={responseCasual}
            tableName='Casual'
            tableId='casual'
            setIsAdded={setIsAdded}
            handleAddMenu={handleAddMenu}
            handleSubmit={handleSubmit}
          />
          <PTWTable
            isEdited={isEdited}
            setIsEdited={setIsEdited}
            isLoadingEditForm={isLoadingEditForm}
            entryToDelete={entryToDelete}
            setConfirmModal={setConfirmModal}
            response={responseNonCasual}
            tableName='Non-Casual'
            tableId='noncasual'
            setIsAdded={setIsAdded}
            handleAddMenu={handleAddMenu}
            handleSubmit={handleSubmit}
          />
          <PTWTable
            isEdited={isEdited}
            setIsEdited={setIsEdited}
            isLoadingEditForm={isLoadingEditForm}
            entryToDelete={entryToDelete}
            setConfirmModal={setConfirmModal}
            response={responseMovies}
            tableName='Movies'
            tableId='movies'
            setIsAdded={setIsAdded}
            handleAddMenu={handleAddMenu}
            handleSubmit={handleSubmit}
          />
        </section>
        <LatencyBadge latency={latency} onlineUsers={onlineUsers} />
        <ContextMenu
          contextMenuRef={contextMenuRef}
          contextMenu={contextMenu}
          responseRolled={responseRolled}
          setConfirmModalDelEntry={setConfirmModalDelEntry}
        />
        <AddRecordMenu isAdded={isAdded} setIsAdded={setIsAdded} />
        <ConfirmModal
          confirmModal={confirmModal}
          setConfirmModal={setConfirmModal}
          entryToDelete={entryToDelete}
          responseCasual={responseCasual}
          responseNonCasual={responseNonCasual}
          responseMovies={responseMovies}
          responseRolled={responseRolled}
        />
      </main>
    </>
  )
}

//* Shows socket latency
function LatencyBadge({ latency, onlineUsers }: { latency: number; onlineUsers: number }) {
  const latencyBadgeRef = useRef<HTMLDivElement>(null)

  function handleOpen() {
    if (!latencyBadgeRef.current) return
    const child = latencyBadgeRef.current.children[1] as HTMLSpanElement
    if (latencyBadgeRef.current.style.width != '18rem') {
      latencyBadgeRef.current.style.width = '18rem'
      child.style.display = 'block'
    } else {
      latencyBadgeRef.current.style.width = '8.6rem'
      child.style.display = 'none'
    }
  }

  return (
    <div
      onClick={handleOpen}
      ref={latencyBadgeRef}
      style={{
        width: '18rem',
      }}
      className='fixed bottom-6 left-6 flex items-center justify-between z-50 p-2 max-h-[2.5rem] max-w-[60vw] rounded-full bg-black border-pink-500 border-[1px] whitespace-nowrap overflow-hidden cursor-pointer ease-out transition-[width]'
    >
      <span className='text-gray-300 p-1 pointer-events-none'>{`Latency: ${latency}ms`}</span>
      <span>
        <span className='text-gray-300 mx-auto pointer-events-none'> · </span>
        <span className='text-gray-300 ml-4 pointer-events-none'>
          {`${onlineUsers} user(s) online`}
        </span>
      </span>
    </div>
  )
}

function ContextMenu({
  contextMenuRef,
  contextMenu,
  responseRolled,
  setConfirmModalDelEntry,
}: {
  contextMenuRef: RefObject<HTMLDivElement>
  contextMenu: ContextMenuPos
  responseRolled: PTWRolled[] | undefined
  setConfirmModalDelEntry: () => void
}) {
  const { setLoading } = useLoading()

  async function handleAddToCompleted() {
    setLoading(true)
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/addtocompleted`,
        {
          content: responseRolled,
          id: contextMenu.currentItem?.id,
          type: 'PTW',
        },
        { withCredentials: true }
      )
      setLoading(false)
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
          animate={{ height: '7.6rem', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
          ref={contextMenuRef}
          style={{
            top: contextMenu.top,
            left: contextMenu.left,
          }}
          className='absolute z-10 p-2 w-[15rem] shadow-md shadow-gray-600 bg-black border border-pink-400 rounded-md'
        >
          <li className='flex justify-center'>
            <span className='text-center font-semibold line-clamp-1'>
              {contextMenu.currentItem?.title}
            </span>
          </li>
          <hr className='my-2 border-t' />
          <li className='flex justify-center h-8 rounded-sm hover:bg-pink-400'>
            <button onClick={handleAddToCompleted} className='w-full'>
              Add to Completed
            </button>
          </li>
          <li className='flex justify-center h-8 rounded-sm hover:bg-pink-400'>
            <button onClick={() => setConfirmModalDelEntry()} className='w-full'>
              Delete entry
            </button>
          </li>
        </motion.menu>
      )}
    </AnimatePresence>
  )
}

function AddRecordMenu({
  isAdded,
  setIsAdded,
}: {
  isAdded: AddRecordPos | null
  setIsAdded: Dispatch<SetStateAction<AddRecordPos>>
}) {
  const { setLoading } = useLoading()

  async function handleAddRecord(e: BaseSyntheticEvent) {
    e.preventDefault()
    const enteredTitle = e.target[0].value
    if (!enteredTitle || !isAdded?.response) return

    let cell = 'L'
    switch (isAdded.tableId) {
      case 'rolled':
        cell = 'N'
        break
      case 'movies':
        cell = 'L'
      case 'casual':
        cell = 'L'
        break
      case 'noncasual':
        cell = 'M'
        break
    }

    setLoading(true)

    try {
      if (isAdded.tableId == 'movies') {
        if (isAdded.response.length >= 5) {
          setLoading(false)
          alert('No space left')
          return
        }
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/update`,
          {
            content: enteredTitle,
            cell: cell + (isAdded.response.length + 22).toString(),
          },
          { withCredentials: true }
        )
      } else if (isAdded.tableId == 'rolled') {
        if (isAdded.response.length >= 21) {
          setLoading(false)
          alert('No space left')
          return
        }
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/update`,
          {
            content: enteredTitle,
            cell: cell + (isAdded.response.length + 2).toString(),
          },
          { withCredentials: true }
        )
      } else {
        if (isAdded.response.length >= 15) {
          setLoading(false)
          alert('No space left')
          return
        }
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/update`,
          {
            content: enteredTitle,
            cell: cell + (isAdded.response.length + 2).toString(),
          },
          { withCredentials: true }
        )
      }
      setIsAdded({ ...isAdded, tableId: null })
      setLoading(false)
    } catch (error) {
      setLoading(false)
      alert(error)
      return
    }
  }

  if (!isAdded) return null
  return (
    <AnimatePresence>
      {isAdded.tableId && (
        <motion.menu
          initial={{ y: -5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -5, opacity: 0 }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
          style={{
            top: isAdded.top + 38,
            left: isAdded.left - (isAdded.tableId == 'rolled' ? 280 : 190),
          }}
          className='absolute top-14 z-10 p-1 rounded-md bg-black border border-pink-400'
        >
          <form onSubmit={handleAddRecord}>
            <input
              placeholder='Add title'
              className='w-60 text-lg rounded-sm bg-black focus:outline-none'
            />
          </form>
        </motion.menu>
      )}
    </AnimatePresence>
  )
}

//* Confirm deletes
function ConfirmModal({
  confirmModal,
  setConfirmModal,
  entryToDelete,
  responseCasual,
  responseNonCasual,
  responseMovies,
  responseRolled,
}: {
  confirmModal: boolean
  setConfirmModal: Dispatch<SetStateAction<boolean>>
  entryToDelete: MutableRefObject<any>
  responseCasual: PTWCasual[] | undefined
  responseNonCasual: PTWNonCasual[] | undefined
  responseMovies: PTWMovies[] | undefined
  responseRolled: PTWRolled[] | undefined
}) {
  const { setLoading } = useLoading()

  async function handleDelete() {
    if (entryToDelete.current.tableId) {
      let responseTable
      switch (entryToDelete.current.tableId) {
        case 'casual':
          responseTable = responseCasual
          break
        case 'noncasual':
          responseTable = responseNonCasual
          break
        case 'movies':
          responseTable = responseMovies
          break
        default:
          break
      }
      setLoading(true)
      try {
        await axios.delete('/api/deleteentry', {
          data: {
            content: responseTable,
            id: entryToDelete.current.item.id,
            tableId: entryToDelete.current.tableId,
            type: 'PTW_UNROLLED',
          },
        })
        setConfirmModal(false)
        setLoading(false)
      } catch (error) {
        setLoading(false)
        console.error(error)
        alert(error)
      }
    } else {
      setLoading(true)
      try {
        await axios.delete('/api/deleteentry', {
          data: {
            content: responseRolled,
            id: entryToDelete.current.id,
            type: 'PTW',
          },
        })
        setConfirmModal(false)
        setLoading(false)
      } catch (error) {
        setLoading(false)
        alert(error)
      }
    }
  }

  return (
    <Dialog fullWidth maxWidth='xs' open={confirmModal} onClose={() => setConfirmModal(false)}>
      <div className='p-2'>
        <DialogTitle fontSize='large'>Confirm delete entry?</DialogTitle>
        <DialogActions>
          <Button onClick={handleDelete} variant='outlined'>
            Yes
          </Button>
          <Button onClick={() => setConfirmModal(false)} color='error'>
            No
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  )
}

async function saveReorder(
  responseRolled: PTWRolled[] | undefined,
  setLoading: Dispatch<SetStateAction<boolean>>,
  setReordered: (value: boolean) => boolean
) {
  setLoading(true)
  let endRowIndex = responseRolled!.length + 1
  try {
    await axios.post('/api/ptw/reorder', {
      content: responseRolled,
      cells: `N2:N${endRowIndex}`,
      type: 'PTW',
    })

    setReordered(false)
    setLoading(false)
  } catch (error) {
    setLoading(false)
    alert(error)
    console.error(error)
    return
  }
}

//* Utility function to add new records
function handleAddMenu(
  e: BaseSyntheticEvent,
  response: PTWCasual[] | undefined,
  tableId: PTWTables,
  setIsAdded: Dispatch<SetStateAction<AddRecordPos>>
) {
  const { top, left } = e.target.getBoundingClientRect()

  setIsAdded({
    top: top + window.scrollY,
    left: left + window.scrollX,
    response,
    tableId,
  })
}
