import { useEffect, BaseSyntheticEvent, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

let socket: Socket

export default function SocketTest() {
  const input = useRef<HTMLInputElement>(null)
  const setInput = (value: string) => input.current!.value = value

  useEffect(() => {
    const socketInitializer = async () => {
      socket = io(process.env.NEXT_PUBLIC_API_URL!)
      socket.on('connect', () => {
        console.log('connected')
      })

      socket.on('input-change', msg => {
        setInput(msg)
      })
    }
    socketInitializer()
  }, [])

  const handleChange = (e: BaseSyntheticEvent) => {
    socket.emit('input-change', e.target.value)
  }

  return (
    <input
      ref={input}
      placeholder='Enter a message'
      onChange={handleChange}
      className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 text-lg bg-black'
    />
  )
}