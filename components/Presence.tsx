import { useEffect, useState, useContext, Dispatch, SetStateAction, createContext } from 'react'
import { createClient } from "@supabase/supabase-js"
import { Database } from "../lib/database.types"

interface PresenceType {
	onlineUser: number
	setOnlineUsers: Dispatch<SetStateAction<number>>
}

const presenceContext = createContext<PresenceType | null>(null)

export function Presence({ children }: React.PropsWithChildren) {
  const [onlineUser, setOnlineUsers] = useState(0)
  const value = { onlineUser, setOnlineUsers }

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
        const valueArr = Object.keys(value).map((key, index) => value[key])
        console.log(value)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const status = await onlineChannel.track({ online_at: new Date().toISOString() })
          console.log(status)
        }
      })
  }, [])
  
  return <presenceContext.Provider value={value}>{children}</presenceContext.Provider>
}

export function GetPresence() {
	const context = useContext(presenceContext)
	if (!context) {
		throw new Error('getPresence must be used within Presence')
	}
	return context
}