import { BaseSyntheticEvent, Dispatch, MutableRefObject, SetStateAction } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { PTWCasual } from '@prisma/client'
import { AddRecordPos, PTWEdited, PTWItem, PTWTables } from '@/lib/types'
import { EditForm } from '@/components/ptw/PTWEditFields'

export default function PTWTable({
  isEdited,
  setIsEdited,
  isLoadingEditForm,
  entryToDelete,
  setConfirmModal,
  response,
  tableName,
  tableId,
  setIsAdded,
  handleAddMenu,
  handleSubmit,
}: {
  isEdited: PTWEdited
  setIsEdited: (value: PTWEdited) => void
  isLoadingEditForm: string[]
  entryToDelete: MutableRefObject<any>
  setConfirmModal: Dispatch<SetStateAction<boolean>>
  response: PTWCasual[] | undefined
  tableName: string
  tableId: Exclude<PTWTables, 'rolled'>
  setIsAdded: Dispatch<SetStateAction<AddRecordPos>>
  handleAddMenu: (
    e: BaseSyntheticEvent,
    response: PTWCasual[] | undefined,
    tableId: PTWTables,
    setIsAdded: Dispatch<SetStateAction<AddRecordPos>>
  ) => void
  handleSubmit: (
    id: number,
    field: `${PTWTables}_title`,
    ogvalue: string,
    event: BaseSyntheticEvent
  ) => Promise<void>
}) {
  function handleDeleteUnrolled(tableId: Exclude<PTWTables, 'rolled'>, item: PTWItem) {
    entryToDelete.current = { tableId, item }
    setConfirmModal(true)
  }

  return (
    <section className='relative flex flex-col items-center'>
      <header className='flex items-center'>
        <h2 className='p-2 text-2xl sm:text-3xl'>{tableName}</h2>
        <IconButton
          title='Add new entry'
          onClick={(e) => handleAddMenu(e, response, tableId, setIsAdded)}
          className='flex items-center justify-center h-7 w-7 cursor-pointer rounded-full sm:translate-y-[2px]'
        >
          <AddIcon />
        </IconButton>
      </header>
      <div className='p-2 bg-primary-foreground rounded-md'>
        <table>
          <thead className='border-b'>
            <tr>
              <th className='p-2 pt-1 w-[100dvw] sm:w-[30rem]'>
                <span>Title</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {!response ? (
              <tr>
                <td className='py-48 text-center'>
                  <CircularProgress size={42} color='primary' />
                </td>
              </tr>
            ) : (
              response.map((item) => (
                <tr key={item.id}>
                  <td
                    style={{
                      opacity: isLoadingEditForm.includes(`${tableId}_title_${item.id}`) ? 0.5 : 1,
                    }}
                    onDoubleClick={() => setIsEdited(`${tableId}_${item.title}_${item.id}`)}
                    className='relative flex justify-center items-center p-2 hover:bg-primary-accent rounded-md group'
                  >
                    <span className='pr-4 w-full'>
                      {isEdited == `${tableId}_${item.title}_${item.id}` ? (
                        <EditForm
                          field={`${tableId}_title`}
                          id={item.id}
                          ogvalue={item.title!}
                          isLoadingEditForm={isLoadingEditForm}
                          handleSubmit={handleSubmit}
                        />
                      ) : (
                        item.title
                      )}
                    </span>
                    {isLoadingEditForm.includes(`${tableId}_title_${item.id}`) && (
                      <CircularProgress size={30} className='absolute top-[20%] left-[48%]' />
                    )}
                    <IconButton
                      onClick={() => handleDeleteUnrolled(tableId, item)}
                      className='!absolute flex items-center justify-center top-1/2 right-1 -translate-y-1/2 z-10 h-7 w-7 invisible group-hover:visible cursor-pointer rounded-full'
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
