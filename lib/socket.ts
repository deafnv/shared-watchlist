import { io } from 'socket.io-client'

export const apiSocket = io(process.env.NEXT_PUBLIC_API_URL!)
export const updaterSocket = io(process.env.NEXT_PUBLIC_UPDATE_URL!)