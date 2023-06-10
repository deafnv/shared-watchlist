import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  BaseSyntheticEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
  Dispatch,
  SetStateAction,
  RefObject,
  Fragment,
  MutableRefObject,
} from 'react'
import debounce from 'lodash/debounce'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Completed, CompletedDetails, Genres } from '@prisma/client'
import { useLoading } from '@/components/LoadingContext'
import EditDialog from '@/components/dialogs/EditDialog'
import {
  sortListByDateCompleted,
  sortListByEpisodeCompleted,
  sortListByNameCompleted,
  sortListByRatingCompleted,
  sortListByTypeCompleted,
  SortSymbol,
} from '@/lib/list_methods'
import { CompletedFields } from '@/lib/types'
import { updaterSocket } from '@/lib/socket'

interface SettingsMenuPos {
  top: number
  left: number
  display: boolean
}

export default function CompletedPage() {
  const settingsMenuRef = useRef<HTMLDivElement>(null)
  const settingsMenuButtonRef = useRef<HTMLButtonElement>(null)
  const sortMethodRef = useRef<`${'asc' | 'desc'}_${CompletedFields}` | ''>('')
  const editInputRef = useRef('')

  const [response, setResponse] = useState<Completed[]>()
  const [response1, setResponse1] = useState<Completed[]>()
  const [isEdited, setIsEdited] = useState<`${CompletedFields}_${number}` | ''>('')
  const [isLoadingClient, setIsLoadingClient] = useState(true)
  const [isLoadingEditForm, setIsLoadingEditForm] = useState<`${CompletedFields}_${number}`[]>([])
  const [settingsMenu, setSettingsMenu] = useState<SettingsMenuPos>({
    top: 0,
    left: 0,
    display: false,
  })
  const [detailsOpen, setDetailsOpen] = useState<number[]>([])
  const [editDialog, setEditDialog] = useState<{ id: number; title: string }>()

  const { setLoading } = useLoading()

  useEffect(() => {
    const getData = async () => {
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/table/completed`)
      setResponse(data!)
      setResponse1(data!)
      setIsLoadingClient(false)

      await axios
        .get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/refresh`)
        .catch((error) => console.error(error))
    }
    getData()

    const initializeSocket = async () => {
      updaterSocket.connect()
      updaterSocket.on('Completed', () => {
        sortMethodRef.current = ''
        getData()
      })
    }
    initializeSocket()

    const refresh = setInterval(
      () => axios.get(`${process.env.NEXT_PUBLIC_UPDATE_URL}/refresh`),
      1700000
    )

    return () => {
      clearInterval(refresh)
      updaterSocket.off('Completed')
      updaterSocket.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const closeMenus = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.parentNode !== settingsMenuButtonRef.current &&
        target.parentNode?.parentNode !== settingsMenuButtonRef.current &&
        !settingsMenuRef.current?.contains(target) &&
        settingsMenuRef.current
      ) {
        setSettingsMenu({ top: 0, left: 0, display: false })
      }
    }

    const resetEditNoFocus = () => {
      if (!response) return
      const [field, id] = isEdited.split('_')
      const ogvalue = response.find((item) => item.id == parseInt(id))
      if (!ogvalue) return
      handleSubmit(parseInt(id), field as CompletedFields, ogvalue[field as CompletedFields])
    }

    const closeKeyboard = (e: KeyboardEvent) => {
      if (e.key == 'Escape') {
        if (editDialog) setEditDialog(undefined)
        if (isEdited) setIsEdited('')
      }

      if (e.key == 'Tab' && isEdited != '') {
        e.preventDefault()
        const fields: ['title', 'type', 'episode', 'rating1', 'rating2', 'start', 'end'] = [
          'title',
          'type',
          'episode',
          'rating1',
          'rating2',
          'start',
          'end',
        ]
        const split = isEdited.split('_') as [CompletedFields, string]
        const nextField = fields.findIndex((item) => item == split[0]) + 1
        const nextIsEdited: `${CompletedFields}_${number}` =
          nextField < fields.length
            ? `${fields[nextField]}_${parseInt(split[1])}`
            : `title_${parseInt(split[1]) - 1}`
        ;((e.target as HTMLElement).parentNode as HTMLFormElement).requestSubmit()
        setTimeout(() => setIsEdited(nextIsEdited), 100)
      }
    }

    window.addEventListener('focusout', resetEditNoFocus)
    document.addEventListener('click', closeMenus)
    document.addEventListener('keydown', closeKeyboard)

    return () => {
      window.removeEventListener('focusout', resetEditNoFocus)
      document.removeEventListener('click', closeMenus)
      document.removeEventListener('keydown', closeKeyboard)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdited])

  const debouncedSearch = debounce(async function (e: BaseSyntheticEvent) {
    console.log('Searching...')
    const Fuse = (await import('fuse.js')).default
    const fuse = new Fuse(response1 ?? [], {
      keys: ['title'],
      threshold: 0.35,
    })
    const results = fuse.search(e.target.value).map((item) => item.item)

    setResponse(results)
  }, 200)

  return (
    <>
      <Head>
        <title>Watchlist</title>
        <meta name='description' content='Completed' />
      </Head>

      <main className='flex flex-col items-center justify-center gap-2 mb-24 px-0 sm:px-6 py-2'>
        <header className='flex items-center'>
          <h2 className='p-2 text-2xl sm:text-3xl'>Completed</h2>
          {sortMethodRef.current && (
            <IconButton
              title='Reset sort'
              onClick={() => {
                sortMethodRef.current = ''
                setResponse(response1)
              }}
              className='flex items-center justify-center h-8 w-8 cursor-pointer rounded-full translate-y-[1px]'
            >
              <RefreshIcon sx={{ fontSize: 28 }} />
            </IconButton>
          )}
          <IconButton
            ref={settingsMenuButtonRef}
            onClick={handleSettingsMenu}
            className='flex items-center justify-center h-8 w-8 cursor-pointer rounded-full translate-y-[1px]'
          >
            <MoreVertIcon sx={{ fontSize: 28 }} />
          </IconButton>
        </header>
        <div className='flex items-center justify-center gap-2'>
          <div className='px-3 mb-1 bg-neutral-700 shadow-md shadow-black rounded-md'>
            <SearchIcon />
            <input
              onChange={searchTable}
              type='search'
              placeholder=' Search titles'
              className='input-text my-2 p-1 w-[60dvw] md:w-96 text-sm sm:text-lg'
            />
          </div>
          <IconButton onClick={addRecord} title='Add new record to table'>
            <AddIcon sx={{ fontSize: 24 }} />
          </IconButton>
        </div>
        {isLoadingClient ? (
          <div className='p-2 bg-primary-foreground rounded-md'>
            <table>
              <thead className='border-b'>
                <tr>
                  <th className='p-2 min-w-[1rem] sm:min-w-0 w-[42rem]'>
                    <span>Title</span>
                  </th>
                  <th className='p-2 w-32 hidden md:table-cell'>
                    <span>Type</span>
                  </th>
                  <th className='p-2 w-36 hidden md:table-cell'>
                    <span>Episode(s)</span>
                  </th>
                  <th className='p-2 w-32'>
                    <span>Rating 1</span>
                  </th>
                  <th className='p-2 w-32'>
                    <span>Rating 2</span>
                  </th>
                  <th className='p-2 w-40 hidden md:table-cell'>
                    <span>Start Date</span>
                  </th>
                  <th className='p-2 w-40 hidden md:table-cell'>
                    <span>End Date</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7} className='py-48 text-center'>
                    <CircularProgress size={50} color='primary' />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className='p-2 bg-primary-foreground rounded-md'>
            <table>
              <thead className='border-b'>
                <tr>
                  <th
                    tabIndex={0}
                    onClick={() => sortListByNameCompleted(response, sortMethodRef, setResponse)}
                    className='p-2 min-w-[1rem] sm:min-w-0 w-[42rem] cursor-pointer'
                  >
                    <span className='relative'>
                      Title
                      <SortSymbol type='title' sortMethodRef={sortMethodRef} />
                    </span>
                  </th>
                  <th
                    tabIndex={0}
                    onClick={() => sortListByTypeCompleted(response, sortMethodRef, setResponse)}
                    className='p-2 w-32 hidden md:table-cell cursor-pointer'
                  >
                    <span className='relative'>
                      Type
                      <SortSymbol type='type' sortMethodRef={sortMethodRef} />
                    </span>
                  </th>
                  <th
                    tabIndex={0}
                    onClick={() => sortListByEpisodeCompleted(response, sortMethodRef, setResponse)}
                    className='p-2 w-36 hidden md:table-cell cursor-pointer'
                  >
                    <span className='relative'>
                      Episode(s)
                      <SortSymbol type='episode' sortMethodRef={sortMethodRef} />
                    </span>
                  </th>
                  <th
                    tabIndex={0}
                    onClick={() =>
                      sortListByRatingCompleted('rating1', response, sortMethodRef, setResponse)
                    }
                    className='p-2 w-32 cursor-pointer'
                  >
                    <span className='relative'>
                      Rating 1
                      <SortSymbol type='rating1' sortMethodRef={sortMethodRef} />
                    </span>
                  </th>
                  <th
                    tabIndex={0}
                    onClick={() =>
                      sortListByRatingCompleted('rating2', response, sortMethodRef, setResponse)
                    }
                    className='p-2 w-32 cursor-pointer'
                  >
                    <span className='relative'>
                      Rating 2
                      <SortSymbol type='rating2' sortMethodRef={sortMethodRef} />
                    </span>
                  </th>
                  <th
                    tabIndex={0}
                    onClick={() =>
                      sortListByDateCompleted('startconv', response, sortMethodRef, setResponse)
                    }
                    className='p-2 w-40 cursor-pointer hidden md:table-cell'
                  >
                    <span className='relative'>
                      Start Date
                      <SortSymbol type='start' sortMethodRef={sortMethodRef} />
                    </span>
                  </th>
                  <th
                    tabIndex={0}
                    onClick={() =>
                      sortListByDateCompleted('endconv', response, sortMethodRef, setResponse)
                    }
                    className='p-2 w-40 cursor-pointer hidden md:table-cell'
                  >
                    <span className='relative'>
                      End Date
                      <SortSymbol type='end' sortMethodRef={sortMethodRef} />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {response?.map((item) => (
                  <Fragment key={item.id}>
                    <tr className='relative group'>
                      <td
                        style={{
                          opacity: isLoadingEditForm.includes(`title_${item.id}`) ? 0.5 : 1,
                        }}
                        className='relative flex items-center py-2 min-w-[1rem] group-hover:bg-primary-accent rounded-s-md'
                      >
                        <div
                          onClick={(e) => {
                            if (detailsOpen.includes(item.id))
                              setDetailsOpen((vals) => vals.filter((val) => val != item.id))
                            else setDetailsOpen((val) => [...val, item.id])
                          }}
                          className='flex items-center justify-center h-7 w-7 cursor-pointer rounded-full transition-colors duration-150'
                        >
                          <ExpandMoreIcon
                            className={`fill-gray-500 group-hover:fill-white ${
                              detailsOpen.includes(item.id) ? '' : '-rotate-90'
                            } transition-transform`}
                          />
                        </div>
                        <span
                          onDoubleClick={() => setIsEdited(`title_${item.id}`)}
                          className={`w-full ${item.title ? '' : 'italic text-gray-400'}`}
                        >
                          {isEdited == `title_${item.id}` ? (
                            <EditForm
                              editInputRef={editInputRef}
                              id={item.id}
                              field='title'
                              ogvalue={item.title}
                              isLoadingEditForm={isLoadingEditForm}
                              handleSubmit={handleSubmit}
                            />
                          ) : item.title ? (
                            item.title
                          ) : (
                            'Untitled'
                          )}
                        </span>
                        {isLoadingEditForm.includes(`title_${item.id}`) && (
                          <CircularProgress size={30} className='absolute top-[20%] left-[48%]' />
                        )}
                      </td>
                      <td
                        style={{
                          opacity: isLoadingEditForm.includes(`type_${item.id}`) ? 0.5 : 1,
                        }}
                        onDoubleClick={() => setIsEdited(`type_${item.id}`)}
                        className='relative hidden md:table-cell text-center group-hover:bg-primary-accent'
                      >
                        {isEdited == `type_${item.id}` ? (
                          <EditForm
                            editInputRef={editInputRef}
                            id={item.id}
                            field='type'
                            ogvalue={item.type}
                            isLoadingEditForm={isLoadingEditForm}
                            handleSubmit={handleSubmit}
                          />
                        ) : (
                          item.type
                        )}
                        {isLoadingEditForm.includes(`type_${item.id}`) && (
                          <CircularProgress size={30} className='absolute top-[20%] left-[40%]' />
                        )}
                      </td>
                      <td
                        style={{
                          opacity: isLoadingEditForm.includes(`episode_${item.id}`) ? 0.5 : 1,
                        }}
                        onDoubleClick={() => setIsEdited(`episode_${item.id}`)}
                        className='relative hidden md:table-cell text-center group-hover:bg-primary-accent'
                      >
                        {isEdited == `episode_${item.id}` ? (
                          <EditForm
                            editInputRef={editInputRef}
                            id={item.id}
                            field='episode'
                            ogvalue={item.episode}
                            isLoadingEditForm={isLoadingEditForm}
                            handleSubmit={handleSubmit}
                          />
                        ) : (
                          item.episode
                        )}
                        {isLoadingEditForm.includes(`episode_${item.id}`) && (
                          <CircularProgress size={30} className='absolute top-[20%] left-[40%]' />
                        )}
                      </td>
                      <td
                        style={{
                          opacity: isLoadingEditForm.includes(`rating1_${item.id}`) ? 0.5 : 1,
                        }}
                        onDoubleClick={() => setIsEdited(`rating1_${item.id}`)}
                        className='relative group-hover:bg-primary-accent text-center'
                      >
                        {isEdited == `rating1_${item.id}` ? (
                          <EditForm
                            editInputRef={editInputRef}
                            id={item.id}
                            field='rating1'
                            ogvalue={item.rating1}
                            isLoadingEditForm={isLoadingEditForm}
                            handleSubmit={handleSubmit}
                          />
                        ) : (
                          item.rating1
                        )}
                        {isLoadingEditForm.includes(`rating1_${item.id}`) && (
                          <CircularProgress size={30} className='absolute top-[20%] left-[40%]' />
                        )}
                      </td>
                      <td
                        style={{
                          opacity: isLoadingEditForm.includes(`rating2_${item.id}`) ? 0.5 : 1,
                        }}
                        onDoubleClick={() => setIsEdited(`rating2_${item.id}`)}
                        className='relative text-center group-hover:bg-primary-accent rounded-e-md md:rounded-none'
                      >
                        {isEdited == `rating2_${item.id}` ? (
                          <EditForm
                            editInputRef={editInputRef}
                            id={item.id}
                            field='rating2'
                            ogvalue={item.rating2}
                            isLoadingEditForm={isLoadingEditForm}
                            handleSubmit={handleSubmit}
                          />
                        ) : (
                          item.rating2
                        )}
                        {isLoadingEditForm.includes(`rating2_${item.id}`) && (
                          <CircularProgress size={30} className='absolute top-[20%] left-[40%]' />
                        )}
                      </td>
                      <td
                        style={{
                          opacity: isLoadingEditForm.includes(`start_${item.id}`) ? 0.5 : 1,
                        }}
                        onDoubleClick={() => setIsEdited(`start_${item.id}`)}
                        className='relative hidden md:table-cell text-center group-hover:bg-primary-accent'
                      >
                        {isEdited == `start_${item.id}` ? (
                          <EditForm
                            editInputRef={editInputRef}
                            id={item.id}
                            field='start'
                            ogvalue={item.start}
                            isLoadingEditForm={isLoadingEditForm}
                            handleSubmit={handleSubmit}
                          />
                        ) : (
                          item.start
                        )}
                        {isLoadingEditForm.includes(`start_${item.id}`) && (
                          <CircularProgress size={30} className='absolute top-[20%] left-[40%]' />
                        )}
                      </td>
                      <td
                        style={{
                          opacity: isLoadingEditForm.includes(`end_${item.id}`) ? 0.5 : 1,
                        }}
                        onDoubleClick={() => setIsEdited(`end_${item.id}`)}
                        className='relative hidden md:table-cell text-center group-hover:bg-primary-accent rounded-e-md'
                      >
                        {isEdited == `end_${item.id}` ? (
                          <EditForm
                            editInputRef={editInputRef}
                            id={item.id}
                            field='end'
                            ogvalue={item.end}
                            isLoadingEditForm={isLoadingEditForm}
                            handleSubmit={handleSubmit}
                          />
                        ) : (
                          item.end
                        )}
                        {isLoadingEditForm.includes(`end_${item.id}`) && (
                          <CircularProgress size={30} className='absolute top-[20%] left-[40%]' />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={7} className='table-cell bg-black rounded-md p-0'>
                        <AnimatePresence>
                          {detailsOpen.includes(item.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: '18rem', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                              className='relative flex p-5 h-72 sm:h-80 overflow-hidden'
                            >
                              <CompletedItemDetails item={item} setEditDialog={setEditDialog} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <SettingsMenu settingsMenuRef={settingsMenuRef} settingsMenu={settingsMenu} />
        <EditDialog
          editDialog={!!editDialog}
          setEditDialog={() => setEditDialog(undefined)}
          details={editDialog ?? { id: -1, title: '' }}
        />
      </main>
    </>
  )

  //* Submit handler for editing fields
  async function handleSubmit(
    id: number,
    field: CompletedFields,
    ogvalue: string,
    event?: FormEvent
  ) {
    const isDate = field == 'start' || field == 'end'
    let column: string
    let row = (id + 1).toString()
    const dateEntered = new Date(editInputRef.current)
    const currentlyProcessedEdit = isEdited
    if (event) event.preventDefault()

    switch (field) {
      case 'title':
        column = 'B'
        break
      case 'type':
        column = 'C'
        break
      case 'episode':
        column = 'D'
        break
      case 'rating1':
        column = 'E'
        break
      case 'rating2':
        column = 'F'
        break
      case 'start':
        column = 'H'
        break
      case 'end':
        column = 'I'
        break
    }

    if (
      ogvalue == editInputRef.current ||
      ogvalue ==
        dateEntered.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
    ) {
      setIsEdited('')
      return
    }

    setIsLoadingEditForm(isLoadingEditForm.concat(`${field}_${id}`))
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/update`,
        {
          content: isDate
            ? dateEntered.toString() == 'Invalid Date'
              ? 'Unknown'
              : dateEntered.toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
            : editInputRef.current,
          cell: column + row,
        },
        { withCredentials: true }
      )

      const changed = response?.slice()
      if (!changed) return
      changed.find((item) => item.id === id)![field] = isDate
        ? dateEntered.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : editInputRef.current
      setResponse(changed)
      setResponse1(changed)
      if (isEdited == currentlyProcessedEdit) setIsEdited('')
      setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${id}`))
    } catch (error) {
      setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `${field}_${id}`))
      alert(error)
      return
    }
  }

  function handleSettingsMenu(e: BaseSyntheticEvent) {
    const { top, left } = e.target.getBoundingClientRect()

    setSettingsMenu({
      top: top + window.scrollY,
      left: left + window.scrollX - 160,
      display: true,
    })
  }

  async function searchTable(e: BaseSyntheticEvent) {
    if (e.target.value == '') {
      //TODO: Resetting state is super laggy, could fix by changing display property instead of adding/removing from the DOM
      sortMethodRef.current = ''
      setResponse(response1)
      return
    }
    if (!response || !response1) return
    debouncedSearch(e)
  }

  async function addRecord() {
    if (!response?.[0].title) {
      alert('Insert title for latest row before adding a new one')
      return
    }

    setLoading(true)
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/update`,
        {
          content: (response.length + 1).toString(),
          cell: 'A' + (response.length + 2).toString(),
        },
        { withCredentials: true }
      )

      setIsEdited(`title_${response.length + 1}`)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      alert(error)
      return
    }
  }
}

function EditForm({
  editInputRef,
  id,
  field,
  ogvalue,
  isLoadingEditForm,
  handleSubmit,
}: {
  editInputRef: MutableRefObject<string>
  field: CompletedFields
  id: number
  ogvalue: string
  isLoadingEditForm: `${CompletedFields}_${number}`[]
  handleSubmit: (
    id: number,
    field: CompletedFields,
    ogvalue: string,
    event?: FormEvent
  ) => Promise<void>
}) {
  const isDate = field == 'start' || field == 'end'
  editInputRef.current = isDate ? new Date(ogvalue).toLocaleDateString('en-CA') : ogvalue

  if (isDate) {
    return (
      <div className='flex items-center justify-center relative w-full'>
        <div
          style={{
            opacity: isLoadingEditForm.includes(`${field}_${id}`) ? 0.5 : 1,
            pointerEvents: isLoadingEditForm.includes(`${field}_${id}`) ? 'none' : 'unset',
          }}
          className='w-[90%]'
        >
          <form onSubmit={(e) => handleSubmit(id, field, ogvalue, e)}>
            <input
              autoFocus
              type='date'
              defaultValue={new Date(ogvalue).toLocaleDateString('en-CA')}
              onChange={(e) => {
                if (e.target.valueAsDate) editInputRef.current = e.target.valueAsDate.toISOString()
              }}
              className='input-text text-center w-full'
            />
            <input type='submit' className='hidden' />
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className='flex items-center justify-center relative w-full'>
      <div
        style={{
          opacity: isLoadingEditForm.includes(`${field}_${id}`) ? 0.5 : 1,
          pointerEvents: isLoadingEditForm.includes(`${field}_${id}`) ? 'none' : 'unset',
        }}
        className='w-full'
      >
        <form onSubmit={(e) => handleSubmit(id, field, ogvalue, e)}>
          <input
            autoFocus
            type='text'
            defaultValue={ogvalue}
            onChange={(e) => (editInputRef.current = e.target.value)}
            className={`input-text w-full ${field == 'title' ? 'text-left' : 'text-center'}`}
          />
        </form>
      </div>
    </div>
  )
}

function SettingsMenu({
  settingsMenuRef,
  settingsMenu,
}: {
  settingsMenuRef: RefObject<HTMLDivElement>
  settingsMenu: SettingsMenuPos
}) {
  const { setLoading } = useLoading()

  async function handleLoadDetails() {
    setLoading(true)
    try {
      await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/completed/loadcompleteddetails`, {
        withCredentials: true,
      })
      await axios.post('/api/revalidate', {
        route: '/completed/statistics',
      })
      setLoading(false)
    } catch (error) {
      setLoading(false)
      alert(error)
    }
  }

  return (
    <AnimatePresence>
      {settingsMenu.display && (
        <motion.menu
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: '7.6rem', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
          ref={settingsMenuRef}
          style={{
            top: settingsMenu.top,
            left: settingsMenu.left,
          }}
          className='absolute z-20 p-2 w-[10rem] shadow-md shadow-black bg-black border-pink-400 border-[1px] rounded-md overflow-hidden'
        >
          <li className='flex justify-center h-fit rounded-md hover:bg-pink-400'>
            <button tabIndex={0} onClick={handleLoadDetails} className='py-2 w-full'>
              Load details
            </button>
          </li>
          <li className='flex justify-center h-fit rounded-md hover:bg-pink-400'>
            <Link href={'/completed/errors'} className='px-1 py-2 w-full text-center'>
              See Potential Errors
            </Link>
          </li>
        </motion.menu>
      )}
    </AnimatePresence>
  )
}

function CompletedItemDetails({
  item,
  setEditDialog,
}: {
  item: Completed
  setEditDialog: Dispatch<
    SetStateAction<
      | {
          id: number
          title: string
        }
      | undefined
    >
  >
}) {
  const [details, setDetails] = useState<CompletedDetails>()
  const [genres, setGenres] = useState<Genres[]>()
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()

  const { setLoading } = useLoading()

  useEffect(() => {
    const getDetails = async () => {
      const { data: completedDetails } = await axios.get(
        `${process.env.NEXT_PUBLIC_UPDATE_URL}/table/completeddetails`,
        {
          params: {
            id: item.id,
          },
        }
      )
      const { data: completedGenres } = await axios.get(
        `${process.env.NEXT_PUBLIC_UPDATE_URL}/table/genresofid`,
        {
          params: {
            id: item.id,
          },
        }
      )

      setGenres(completedGenres)
      setDetails(completedDetails)
      setIsLoading(false)
    }
    getDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleReload() {
    try {
      setLoading(true)
      await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/completed/loadcompleteddetails`, {
        withCredentials: true,
      })
      await axios.post('/api/revalidate', {
        route: '/completed/statistics',
      })
      router.reload()
    } catch (error) {
      console.error(error)
      alert(error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center self-center mx-auto p-5 h-72 sm:h-80'>
        <CircularProgress color='primary' />
      </div>
    )
  }
  if (!details || !genres) {
    return (
      <div className='flex flex-col items-center justify-center self-center mx-auto p-5 h-72 sm:h-80'>
        <h3 className='mb-6 font-bold text-center text-xl sm:text-2xl'>
          Details for this title have not been loaded yet
        </h3>
        <span onClick={handleReload} className='cursor-pointer link'>
          Click here to reload database and view details
        </span>
      </div>
    )
  } else {
    return (
      <>
        <div className='relative w-32 sm:w-60 mr-4 sm:mr-0 overflow-hidden'>
          <Image
            src={details?.image_url!}
            alt={`${item.title} Art`}
            fill
            sizes='30vw'
            className='object-contain'
            draggable={false}
          />
        </div>
        <div className='flex flex-col items-start justify-center gap-4 w-3/5'>
          <Link
            href={`/completed/anime/${details?.title_id}`}
            title={details?.mal_title ?? ''}
            className='font-bold text-lg sm:text-xl md:text-2xl line-clamp-2 link'
          >
            {details?.mal_title}
          </Link>
          <p className='text-sm line-clamp-4'>{details?.mal_synopsis}</p>
          <div>
            <h5 className='font-semibold text-lg'>Genres</h5>
            <span className='mb-2 text-center'>
              {!genres || (!genres.length && '–')}
              {genres?.map((item, index) => {
                return (
                  <Link href={`/completed/genres/${item.id}`} key={index} className='link'>
                    {item.name}
                    <span className='text-white'>{index < genres.length - 1 ? ', ' : null}</span>
                  </Link>
                )
              })}
            </span>
          </div>
        </div>
        <div className='hidden grow md:flex flex-col justify-center gap-3'>
          <h4 className='font-semibold text-center text-lg'>Airing Dates</h4>
          <div className='flex justify-center gap-4'>
            <div className='flex flex-col'>
              <h5 className='mb-2 font-semibold text-center text-lg'>Start</h5>
              <span className='text-center'>{details?.start_date ? details.start_date : '–'}</span>
            </div>
            <div className='flex flex-col items-center justify-center'>
              <h5 className='mb-2 font-semibold text-center text-lg'>End</h5>
              <span className='text-center'>{details?.end_date ? details.end_date : '–'}</span>
            </div>
          </div>
          <a
            href={`https://myanimelist.net/anime/${details?.mal_id}`}
            target='_blank'
            rel='noopener noreferrer'
            className='mt-6 text-center link'
          >
            MyAnimeList
          </a>
        </div>
        <IconButton
          onClick={() => setEditDialog({ id: item.id, title: item.title ?? '' })}
          className='!hidden md:!inline-flex !absolute top-3 right-4'
        >
          <EditIcon />
        </IconButton>
      </>
    )
  }
}
