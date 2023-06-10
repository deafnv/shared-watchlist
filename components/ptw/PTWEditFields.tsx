import { BaseSyntheticEvent, Dispatch, MutableRefObject, SetStateAction } from 'react'
import axios from 'axios'
import { PTWRolled } from '@prisma/client'
import { PTWEdited, PTWTables } from '@/lib/types'

//* Dropdown select for changing status
export function EditStatus({
  id,
  ogvalue,
  isEditedRef,
  setIsEdited,
  isLoadingEditForm,
  setIsLoadingEditForm,
  responseRolled,
  setResponseRolled,
}: {
  id: number
  ogvalue: string
  isEditedRef: MutableRefObject<string>
  setIsEdited: (value: PTWEdited) => void
  isLoadingEditForm: string[]
  setIsLoadingEditForm: Dispatch<SetStateAction<string[]>>
  responseRolled: PTWRolled[] | undefined
  setResponseRolled: Dispatch<SetStateAction<PTWRolled[] | undefined>>
}) {
  async function handleSubmit(event: BaseSyntheticEvent) {
    event.preventDefault()
    const currentlyProcessedEdit = isEditedRef.current

    if (ogvalue == event.target[0].value) {
      setIsEdited('')
      return
    }

    setIsLoadingEditForm(isLoadingEditForm.concat(`rolled_status_${id}`))

    let row = id + 2
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/updatestatus`,
        {
          content: event.target.childNodes[0].value,
          cells: `N${row}:N${row}`,
        },
        { withCredentials: true }
      )

      const changed = responseRolled?.slice()
      if (!changed) return
      changed.find((item: any) => item.id === id)!['status'] = event.target.childNodes[0].value
      setResponseRolled(changed)
      if (isEditedRef.current == currentlyProcessedEdit) setIsEdited('')
      setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `rolled_status_${id}`))
    } catch (error) {
      setIsLoadingEditForm(isLoadingEditForm.filter((item) => item == `rolled_status_${id}`))
      alert(error)
      return
    }
  }

  return (
    <div
      style={{
        backgroundColor: isLoadingEditForm.includes(`rolled_status_${id}`) ? 'black' : 'unset',
      }}
      className='flex items-center justify-center relative w-full'
    >
      <div
        style={{
          opacity: isLoadingEditForm.includes(`rolled_status_${id}`) ? 0.5 : 1,
          pointerEvents: isLoadingEditForm.includes(`rolled_status_${id}`) ? 'none' : 'unset',
        }}
        className='w-full'
      >
        <form onSubmit={handleSubmit} className='text-gray-800'>
          <select
            onChange={(e) => (e.target.parentNode as HTMLFormElement)!.requestSubmit()}
            className='p-2 h-full w-full select-none text-white bg-[#2e2e2e] rounded-md'
          >
            <option>Select status</option>
            <option value='Watched'>Loaded</option>
            <option value='Loaded'>Loaded partially</option>
            <option>Not loaded</option>
            <option>Not downloaded</option>
          </select>
        </form>
      </div>
    </div>
  )
}

//* Input field for editing any table items
export function EditForm({
  field,
  id,
  ogvalue,
  isLoadingEditForm,
  handleSubmit,
}: {
  field: `${PTWTables}_title`
  id: number
  ogvalue: string
  isLoadingEditForm: string[]
  handleSubmit: (
    id: number,
    field: `${PTWTables}_title`,
    ogvalue: string,
    event: BaseSyntheticEvent
  ) => Promise<void>
}): React.ReactNode {
  return (
    <div className='flex items-center justify-center relative w-full'>
      <div
        style={{
          opacity: isLoadingEditForm.includes(`${field}_${id}`) ? 0.5 : 1,
          pointerEvents: isLoadingEditForm.includes(`${field}_${id}`) ? 'none' : 'unset',
        }}
        className={`w-full ${field == 'rolled_title' ? 'px-8' : 'pr-6'}`}
      >
        <form onSubmit={(e) => handleSubmit(id, field, ogvalue, e)}>
          <input
            autoFocus
            type='text'
            defaultValue={ogvalue}
            className={`input-text w-full ${
              field == 'rolled_title' ? 'text-center' : 'text-start'
            }`}
          />
        </form>
      </div>
    </div>
  )
}
