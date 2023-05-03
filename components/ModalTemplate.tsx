import { MouseEventHandler, RefObject } from "react"

const ModalTemplate = (
  { extraClassname, exitFunction, menuRef, children }: 
  React.PropsWithChildren<{ 
    extraClassname?: string,
    exitFunction?: MouseEventHandler<HTMLDivElement>,
    menuRef?: RefObject<HTMLMenuElement>
  }>
  ) => {
  return (
    <menu ref={menuRef}>
      <div
        onClick={exitFunction}
        className="fixed top-0 left-0 h-[100dvh] w-[100dvw] glass-modal" 
      />
      <div className={`fixed flex flex-col items-center gap-2 px-4 sm:px-10 py-6 bg-gray-700 rounded-md shadow-md shadow-black drop-shadow-md border-4 border-black top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 modal ${extraClassname}`}>
        { children }
      </div>
    </menu>
  )
}

export default ModalTemplate