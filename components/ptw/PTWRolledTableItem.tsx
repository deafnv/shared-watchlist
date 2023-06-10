import { BaseSyntheticEvent } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { PTWRolled } from '@prisma/client'
import { determineStatus } from '@/lib/list_methods'
import { PTWRolledTableItemProps } from '@/lib/types'
import { EditForm, EditStatus } from '@/components/ptw/PTWEditFields'

export default function PTWRolledTableItem({
  item,
  index,
  isEditedRef,
  sortMethodRef,
  contextMenuButtonRef,
  isEdited,
  setIsEdited,
  isLoadingEditForm,
  setIsLoadingEditForm,
  setContextMenu,
  responseRolled,
  setResponseRolled,
  handleSubmit,
}: PTWRolledTableItemProps) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ top: -25, bottom: 25 }}
      dragElastic={0.15}
      className='grid grid-cols-[4fr_1.1fr] p-0 bg-primary-foreground hover:bg-primary-accent rounded-md'
    >
      <div
        style={{
          opacity: isLoadingEditForm.includes(`rolled_title_${item.id}`) ? 0.5 : 1,
        }}
        onDoubleClick={() => setIsEdited(`rolled_${item.title}_${item.id}`)}
        className='relative flex justify-center p-2 text-center group'
      >
        <span className='w-full cursor-text'>
          {isEdited == `rolled_${item.title}_${item.id}` ? (
            <EditForm
              field='rolled_title'
              id={item.id}
              ogvalue={item.title!}
              isLoadingEditForm={isLoadingEditForm}
              handleSubmit={handleSubmit}
            />
          ) : (
            item.title
          )}
        </span>
        {isLoadingEditForm.includes(`rolled_title_${item.id}`) && (
          <CircularProgress size={30} className='absolute top-[20%] left-[48%]' />
        )}
        <IconButton
          ref={(element) => (contextMenuButtonRef.current[index] = element)}
          onClick={(e) => {
            handleMenuClick(e, item)
          }}
          className='!absolute flex items-center justify-center top-1/2 left-2 -translate-y-1/2 z-10 h-7 w-7 invisible group-hover:visible cursor-pointer rounded-full'
        >
          <MoreVertIcon />
        </IconButton>
        <div
          onPointerDown={(e) => controls.start(e)}
          style={{ visibility: sortMethodRef.current ? 'hidden' : 'visible' }}
          className='absolute top-1/2 right-0 flex items-center justify-center h-7 w-7 cursor-grab rounded-full transition-colors duration-150 -translate-y-1/2'
        >
          <DragIndicatorIcon sx={{ color: 'silver' }} />
        </div>
      </div>
      <div
        style={{
          opacity: isLoadingEditForm.includes(`status_${item.id}`) ? 0.5 : 1,
        }}
        onDoubleClick={() => {
          setIsEdited(`rolled_status_${item.id}`)
        }}
        className={`relative flex items-center justify-center rounded-e-md ${determineStatus(
          item.status
        )}`}
      >
        <span className='flex items-center justify-center'>
          {isEdited == `rolled_status_${item.id}` && (
            <EditStatus
              id={item.id}
              ogvalue={item.status!}
              isEditedRef={isEditedRef}
              setIsEdited={setIsEdited}
              isLoadingEditForm={isLoadingEditForm}
              setIsLoadingEditForm={setIsLoadingEditForm}
              responseRolled={responseRolled}
              setResponseRolled={setResponseRolled}
            />
          )}
        </span>
        {isLoadingEditForm.includes(`rolled_status_${item.id}`) && (
          <CircularProgress size={30} className='absolute top-[16%] left-[35%]' />
        )}
      </div>
    </Reorder.Item>
  )

  function handleMenuClick(e: BaseSyntheticEvent, item: PTWRolled) {
    const { top, left } = e.target.getBoundingClientRect()

    setContextMenu({
      top: top + window.scrollY,
      left: left + window.scrollX + 25,
      currentItem: item,
    })
  }
}
