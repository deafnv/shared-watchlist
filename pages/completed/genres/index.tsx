import { createClient } from "@supabase/supabase-js";
import Head from "next/head";
import { BaseSyntheticEvent, useEffect, useState } from "react";
import { Database } from "../../../lib/database.types";
import Link from "next/link";
import DoneIcon from '@mui/icons-material/Done';
import isEqual from 'lodash/isEqual'

export default function CompletedDetails() {
  const [response, setResponse] = useState<Database['public']['Tables']['Genres']['Row'][]>();
  const [advancedSearch, setAdvancedSearch] = useState();

  const supabase = createClient<Database>('https://esjopxdrlewtpffznsxh.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_API_KEY!);
  
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

      <main className='flex flex-col items-center justify-center p-2'>
        <h2 className='text-3xl'>Genres</h2>
        <span className='mb-2 cursor-pointer link'>Advanced Search</span>
        <div className='grid grid-cols-3 gap-x-24 gap-y-3'>
          {response?.map((item, index) => {
            return <Link key={index} href={`${location.href}/${item.id}`} className='text-center text-white link'>
              {item.name}
            </Link>
          })}
        </div>
        {<AdvancedSearchModal />}
      </main>
    </>
  )

  function AdvancedSearchModal() {
    async function handleSubmit(e: BaseSyntheticEvent) {
      e.preventDefault();

      const target = e.target as any;
      const arr: {[k: string]: any} = Object.fromEntries(Object.entries(target).filter((item: any, index: number) => {
        return item[1].checked;
      }))
      const arrIncluded = Object.keys(arr).map((key) => parseInt(arr[key].value))
      
      const { data } = await supabase
        .from('Completed')
        .select(`
          id,
          title,
          Genres!inner (
            id
          )
        `)
        .in('Genres.id', arrIncluded) //TODO: Look into if it is possible to query by their relationship

      const matched = data?.filter((item) => {
        return (item.Genres as {id: number;}[]).length == arrIncluded.length;
      })
            
      console.log(matched)
    }

    return (
      <div style={{display: 'block'}} className='z-10'>
        <div className='fixed top-0 left-0 h-[100dvh] w-[100dvw] opacity-30 bg-black'></div>
        <div className='fixed flex flex-col items-center gap-4 h-[95dvh] w-[45rem] px-10 py-6 bg-gray-700 rounded-md shadow-md shadow-black drop-shadow-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
          <h3 className='font-semibold text-2xl'>Advanced Search</h3>
          <span>Includes: </span>
          <hr className='w-full border-white border-t-[1px]' />
          <form id='advanced-search' onSubmit={handleSubmit} className='grid grid-cols-3 gap-x-20 gap-y-3 overflow-auto'>
            {response?.map((item, index) => {
              return (
                <label className='relative flex gap-1 items-center checkbox-container'>
                  <div className='custom-checkbox' />
                  <DoneIcon fontSize='inherit' className='absolute checkmark' />
                  <input type='checkbox' value={item.id!} />
                  {item.name}
                </label>
              )
            })}
          </form>
          <input form='advanced-search' type='submit' value='Search' className='input-submit px-2 p-1' />
        </div>
      </div>
    )
  }
}