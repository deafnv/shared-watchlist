import Head from 'next/head'
import { GetServerSidePropsContext } from 'next';
import { BaseSyntheticEvent, useEffect, useState } from 'react'
import axios from 'axios'
import { Reorder } from 'framer-motion';
import { sortListByNamePTW, sortSymbol } from '../lib/list_methods';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../lib/database.types';

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const supabase = createClient<Database>('https://esjopxdrlewtpffznsxh.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_API_KEY!);
  const dataRolled = await supabase 
    .from('PTW-Rolled')
    .select()
    .order('id', { ascending: true });
  const dataCasual = await supabase 
    .from('PTW-Casual')
    .select()
    .order('id', { ascending: true });
  const dataNonCasual = await supabase 
    .from('PTW-NonCasual')
    .select()
    .order('id', { ascending: true });

  return {
    props: {
      resRolled: dataRolled.data,
      resCasual: dataCasual.data,
      resNonCasual: dataNonCasual.data
    }
  }
}

export default function PTW({ resRolled, resCasual, resNonCasual }: { resRolled: Database['public']['Tables']['PTW-Rolled']['Row'][], resCasual: Database['public']['Tables']['PTW-Casual']['Row'][], resNonCasual: Database['public']['Tables']['PTW-NonCasual']['Row'][] }) {
  const [responseRolled, setResponseRolled] = useState<Database['public']['Tables']['PTW-Rolled']['Row'][]>(resRolled);
  const [responseRolled1, setResponseRolled1] = useState<Database['public']['Tables']['PTW-Rolled']['Row'][]>(resRolled);
  const [responseCasual, setResponseCasual] = useState<Database['public']['Tables']['PTW-Casual']['Row'][]>(resCasual);
  const [responseNonCasual, setResponseNonCasual] = useState<Database['public']['Tables']['PTW-NonCasual']['Row'][]>(resNonCasual);
  const [sortMethod, setSortMethod] = useState<string>('');
  const [isEdited, setIsEdited] = useState<string>('');
  const [reordered, setReordered] = useState(false);
  const [delayed, setDelayed] = useState(false);

  const supabase = createClient<Database>('https://esjopxdrlewtpffznsxh.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_API_KEY!);

  useEffect(() => {
    document.addEventListener('click', (e: any) => {
      if (e.target?.tagName === 'INPUT') return;
      setIsEdited('');
    })
    window.addEventListener('focusout', (e: any) => {
      setIsEdited('');
    })

    return () => {supabase.removeAllChannels()}
  },[])

  //! Alternative could be more efficient: listen to all database changes, and update if the change is related to these three tables
  supabase
    .channel('public:PTW-Rolled')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'PTW-Rolled' }, async payload => {
      console.log('Change received: ', payload)
      const { data } = await supabase 
        .from('PTW-Rolled')
        .select()
        .order('id', { ascending: true });

      setResponseRolled(data!);
      setResponseRolled1(data!);
      setReordered(false);
      setSortMethod('');
    })
    .subscribe()

  supabase
    .channel('public:PTW-Casual')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'PTW-Casual' }, async payload => {
      console.log('Change received: ', payload)
      const { data } = await supabase 
        .from('PTW-Casual')
        .select()
        .order('id', { ascending: true });

      setResponseCasual(data!);
    })
    .subscribe()

  supabase
    .channel('public:PTW-NonCasual')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'PTW-NonCasual' }, async payload => {
      console.log('Change received: ', payload)
      const { data } = await supabase 
        .from('PTW-NonCasual')
        .select()
        .order('id', { ascending: true });

      setResponseNonCasual(data!);
    })
    .subscribe()

  function editForm(field: 'rolled_title' | 'casual_title' | 'noncasual_title', id: number, ogvalue: string): React.ReactNode {
    let column: string;
    let row = (id + 1).toString();
    switch (field) {
      case 'rolled_title':
        column = 'N';
        break;
      case 'casual_title':
        column = 'L';
        break;
      case 'noncasual_title':
        column = 'M';
        break;
      default:
        alert('Error: missing field');
        return;
    }

    async function handleSubmit(event: BaseSyntheticEvent): Promise<void> {
      event.preventDefault();
      
      try {
        await axios.post('/api/update', {
          content: event.target[0].value,
          cell: column + row
        })

        const changed = responseRolled.slice();
        (changed.find(item => item.id === id) as any)[field] = event.target[0].value;
        setResponseRolled(changed);
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
        <meta name="description" content="Plan to Watch" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className='flex flex-col items-center justify-center'>
        <div className='flex flex-col items-center'>
          <h2 className='p-2 text-3xl'>Plan to Watch (Rolled){sortMethod ? <span onClick={() => {setResponseRolled(responseRolled1); setSortMethod('')}} className='cursor-pointer'> ↻</span> : null}</h2>
          <table>
            <tbody>
              <tr>
                <th onClick={() => {sortListByNamePTW('title', responseRolled, sortMethod, setSortMethod, setResponseRolled); setReordered(false)}} className='w-[30rem] cursor-pointer'><span>Title</span><span className='absolute'>{sortSymbol('title', sortMethod)}</span></th>
              </tr> 
            </tbody>
          </table>
          <Reorder.Group values={responseRolled} dragConstraints={{top: 500}} draggable={sortMethod ? true : false} onReorder={(newOrder) => {setResponseRolled(newOrder); setReordered(true)}} className='w-[30.1rem] border-white border-solid border-[1px] border-t-0'>
            {responseRolled?.map((item, i) => {
              return ( 
                <Reorder.Item
                  value={item}
                  key={item.id}
                  className='p-0 hover:bg-neutral-700'
                >
                  <div 
                    style={sortMethod ? undefined : {cursor: 'move'}} 
                    onDoubleClick={() => {setIsEdited(`rolled_${item.title}_${item.id}`)}} 
                    className='p-2 text-center'
                  >
                    <span className='cursor-text'>
                      {isEdited == `rolled_${item.title}_${item.id}` ? editForm('rolled_title', item.id, item.title!) : item.title}
                    </span>
                  </div>
                </Reorder.Item>
              )
            })}
          </Reorder.Group>
          {!sortMethod && reordered ? 
            <div className='flex flex-col items-center'>
              <span className='mt-2 text-red-500'>⚠ Live updates will be paused while changes are being made to this table</span>
              <div className='flex gap-2 my-2'>
                <button className='input-submit p-2 rounded-md' onClick={() => {console.log(responseRolled) /* TODO: PUt the reordered false here */}}>Save Changes</button>
                <button className='input-submit p-2 rounded-md' onClick={() => {setResponseRolled(responseRolled1); setReordered(false)}}>Cancel</button>
              </div>
            </div>
          : null}
        </div>
        <div className='flex gap-4'>
          <div className='flex flex-col items-center'>
            <h2 className='p-2 text-3xl'>Casual</h2>
            <table>
              <tbody>
                <tr>
                  <th className='w-[30rem]'><span>Title</span></th>
                </tr> 
                {responseCasual?.map((item, i) => {
                  return (
                    <tr key={item.id}>
                      <td onDoubleClick={() => {setIsEdited(`casual_${item.title}_${item.id}`)}}>
                        {isEdited == `casual_${item.title}_${item.id}` ? editForm('casual_title', item.id, item.title!) : item.title}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className='flex flex-col items-center'>
            <h2 className='p-2 text-3xl'>Non-Casual</h2>
            <table>
              <tbody>
                <tr>
                  <th className='w-[30rem]'><span>Title</span></th>
                </tr> 
                {responseNonCasual?.map((item, i) => {
                  return (
                    <tr key={item.id}>
                      <td onDoubleClick={() => {setIsEdited(`noncasual_${item.title}_${item.id}`)}}>
                        {isEdited == `noncasual_${item.title}_${item.id}` ? editForm('noncasual_title', item.id, item.title!) : item.title}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  )
}
