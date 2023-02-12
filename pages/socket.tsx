import { useEffect, useState, BaseSyntheticEvent } from 'react'
import { io, Socket } from 'socket.io-client'

let socket: Socket

export default function SocketTest() {
  const [input, setInput] = useState('')

  useEffect(() => {
    socketInitializer()
  }, [])
  
  const socketInitializer = async () => {
    socket = io('https://api.ilovesabrina.org/')
    socket.on('connect', () => {
      console.log('connected')
    })

    socket.on('update-input', msg => {
      setInput(msg)
    })
  }

  const onChangeHandler = (e: BaseSyntheticEvent) => {
    setInput(e.target.value)
    socket.emit('input-change', e.target.value)
  }

  return (
    <input
      placeholder='Enter a message'
      value={input}
      onChange={onChangeHandler}
      className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 text-lg bg-black'
    />
  )
}