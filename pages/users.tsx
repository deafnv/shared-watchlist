import Head from 'next/head'
import { useEffect, useState, useContext } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/database.types'
import { usePresence } from '../components/PresenceProvider'

export default function Users() {
	const supabase = createClient<Database>(
		'https://esjopxdrlewtpffznsxh.supabase.co',
		process.env.NEXT_PUBLIC_SUPABASE_API_KEY!
	)

	return (
		<>
			<Head>
				<title>Cytube Watchlist</title>
				<meta name="description" content="" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className="flex flex-col items-center justify-center gap-4 px-4 mb-24 h-[100dvh]">
        <UsersTable />
      </main>
    </>
  )
}

function UsersTable() {
  const { onlineUsers } = usePresence()
  useEffect(() => {
    console.log('rerendering')
  }, [onlineUsers])


  return (
    <table>
      <tbody>
        <tr>
          <th className='w-60'>Id</th>
          <th className='w-80'>Online at</th>
        </tr>
        {Object.keys(onlineUsers ?? {}).map((key) => {
          return onlineUsers?.[key].map((item, index) => (
            <tr key={index}>
              <td>
                {item.presence_ref}
              </td>
              <td>
                {new Date(item.online_at).toLocaleDateString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'longOffset', day: '2-digit', month: 'long' })}
              </td>
            </tr>
          ))
        })}
      </tbody>
    </table>
  )
}