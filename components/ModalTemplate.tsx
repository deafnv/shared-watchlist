const ModalTemplate = ({ children }: React.PropsWithChildren) => {
  return (
    <menu>
      <div className="fixed top-0 left-0 h-[100dvh] w-[100dvw] bg-black opacity-30" />
      <div className="fixed flex flex-col items-center justify-center gap-4 h-[15rem] w-[30rem] px-10 py-6 bg-gray-700 rounded-md shadow-md shadow-black drop-shadow-md border-4 border-black top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 modal">
        { children }
      </div>
    </menu>
  )
}

export default ModalTemplate