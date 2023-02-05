import { useEffect, useState, useContext, Dispatch, SetStateAction, createContext } from 'react'
import { createClient } from "@supabase/supabase-js"
import { Database } from "../lib/database.types"
import { GetServerSideProps, GetServerSidePropsContext } from 'next'

export interface PresenceState {
  [key: string]: Array<{
    online_at: string,
    presence_ref: string
  }>
}

interface PresenceType {
	onlineUsers: PresenceState | null
	setOnlineUsers: Dispatch<SetStateAction<PresenceState>>
}

export const presenceContext = createContext<PresenceType | null>(null)

export function Presence({ children }: React.PropsWithChildren) {
  const [onlineUsers, setOnlineUsers] = useState({})
  const value = { onlineUsers, setOnlineUsers }

  const supabase = createClient<Database>(
		'https://esjopxdrlewtpffznsxh.supabase.co',
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	)

  useEffect(() => {
    const onlineChannel = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        //! Send data to api or smth
        const value = onlineChannel.presenceState()
        setOnlineUsers(value)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const status = await onlineChannel.track({ online_at: new Date().toISOString() })
        }
      })
  }, [])
  
  return <presenceContext.Provider value={value}>{children}</presenceContext.Provider>
}

export function usePresence() {
	const context = useContext(presenceContext)
	if (!context) {
		throw new Error('usePresence must be used within Presence')
	}
	return context
}