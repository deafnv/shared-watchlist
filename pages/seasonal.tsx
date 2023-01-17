import { GetServerSidePropsContext } from "next";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../lib/database.types";
import { BaseSyntheticEvent, useEffect, useState } from "react";
import Head from "next/head";
import axios from "axios";


export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const supabase = createClient<Database>('https://esjopxdrlewtpffznsxh.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_API_KEY!);
  const { data } = await supabase 
    .from('PTW-CurrentSeason')
    .select()
    .order('id', { ascending: true });

  return {
    props: {
      res: data
    }
  }
}

export default function Seasonal({ res }: {res: Database['public']['Tables']['PTW-CurrentSeason']['Row'][]}) {
  const [response, setResponse] = useState<Database['public']['Tables']['PTW-CurrentSeason']['Row'][]>(res);
  const [isEdited, setIsEdited] = useState<string>('');

  useEffect(() => {
    document.addEventListener('click', (e: any) => {
      if (e.target?.tagName === 'INPUT') return;
      setIsEdited('');
    })
    window.addEventListener('focusout', () => {
      setIsEdited('');
    })
    window.addEventListener("keydown",(e) => {
      if (e.key === 'Escape') setIsEdited('');
    })
    
    const supabase = createClient<Database>('https://esjopxdrlewtpffznsxh.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_API_KEY!);

    supabase
      .channel('public:PTW-CurrentSeason')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'PTW-CurrentSeason' }, async payload => {
        const { data } = await supabase 
          .from('PTW-CurrentSeason')
          .select()
          .order('id', { ascending: true });
        setResponse(data!);
      })
      .subscribe()

    return () => {supabase.removeAllChannels()}
  },[])

  function editForm(field: 'seasonal_title', id: number, ogvalue: string): React.ReactNode {
    let column: string;
    let row = (id + 2).toString();
    switch (field) {
      case 'seasonal_title':
        column = 'O';
        break;
    }

    async function handleSubmit(event: BaseSyntheticEvent): Promise<void> {
      event.preventDefault();
      
      try {
        await axios.post('/api/update', {
          content: event.target[0].value,
          cell: column + row
        })

        const changed = response.slice();
        changed.find(item => item.id === id)!['title'] = event.target[0].value;
        setResponse(changed);
        setIsEdited('');
      } 
      catch (error) {
        alert(error);
        return;
      }
    }

    return <form onSubmit={handleSubmit}><input autoFocus type='text' defaultValue={ogvalue} className='input-text text-center w-4/5'></input></form>
  }

  return (
    <>
      <Head>
        <title>Cytube Watchlist</title>
        <meta name="description" content="Current Season" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className='flex flex-col items-center justify-center'>
        <h2 className='p-2 text-3xl'>Current Season</h2>
        <table>
          <tbody>
            <tr>
              <th className='w-[30rem]'><span>Title</span></th>
            </tr> 
            {response?.map((item) => {
              return (
                <tr key={item.id}>
                  <td onDoubleClick={() => { setIsEdited(`seasonal_${item.title}_${item.id}`); } }>
                    {isEdited == `seasonal_${item.title}_${item.id}` ? editForm(`seasonal_title`, item.id, item.title!) : item.title}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </main>
    </>
  )
}