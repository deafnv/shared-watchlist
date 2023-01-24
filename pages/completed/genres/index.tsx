import { createClient } from "@supabase/supabase-js";
import Head from "next/head";
import { useEffect, useState } from "react";
import { Database } from "../../../lib/database.types";
import Link from "next/link";

export default function CompletedDetails() {
  const [response, setResponse] = useState<Database['public']['Tables']['Genres']['Row'][]>();

  useEffect(() => {
    const supabase = createClient<Database>('https://esjopxdrlewtpffznsxh.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_API_KEY!);
    const getData = async () => {
      const { data } = await supabase
        .from('Genres')
        .select()
        .order('name')

      setResponse(data!);
    }
    getData();
  },[])

  return (
    <>
      <Head>
        <title>Cytube Watchlist</title>
        <meta name="description" content="Completed Details" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className='flex flex-col items-center justify-center gap-3'>
        <h2 className='p-2 text-3xl'>Genres</h2>
        <div className='grid grid-cols-3 gap-x-24 gap-y-3'>
          {response?.map((item, index) => {
            return <Link key={index} href={`${location.href}/${item.id}`} className='text-center text-white link'>
              {item.name}
            </Link>
          })}
        </div>
      </main>
    </>
  )
}