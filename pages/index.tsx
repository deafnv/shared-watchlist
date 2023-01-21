import { BaseSyntheticEvent, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js';
import { Database } from '../lib/database.types';
import { initialTitleItemSupabase, sortListByDateSupabase, sortListByNameSupabase, sortListByRatingSupabase, sortSymbol } from '../lib/list_methods';
import { loadingGlimmer } from '../components/LoadingGlimmer';

//! Non-null assertion for the response state variable here will throw some errors if it does end up being null, fix maybe.
//! ISSUES:
//!   - Fix sort symbol

export default function Home() {
  const [response, setResponse] = useState<Database['public']['Tables']['Completed']['Row'][]>();
  const [response1, setResponse1] = useState<Database['public']['Tables']['Completed']['Row'][]>();
  const [sortMethod, setSortMethod] = useState<string>('');
  const [isEdited, setIsEdited] = useState<string>('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(true);

  useEffect(() => {
    //FIXME: Don't expose API key to client side
    const supabase = createClient<Database>('https://esjopxdrlewtpffznsxh.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_API_KEY!);
    const getData = async () => {
      const { data } = await supabase 
        .from('Completed')
        .select()
        .order('id', { ascending: true });
      setResponse(data!);
      setResponse1(data!);
      setIsLoadingClient(false);

      await axios.get('https://update.ilovesabrina.org:3005/refresh').catch(error => console.log(error));
    }
    getData();

    const refresh = setInterval(() => axios.get('https://update.ilovesabrina.org:3005/refresh'), 3500000);

    document.addEventListener('click', (e: any) => {
      if (e.target?.tagName === 'INPUT') return;
      setIsEdited('');
    })
    window.addEventListener('focusout', () => {
      setIsEdited('');
    })
    window.addEventListener("keydown", (e) => {
      if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) { 
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') setIsEdited('');
    })

    supabase
      .channel('public:Completed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Completed' }, async payload => {
        //FIXME: Create timeout here so it doesn't query DB every change if change occurs too frequently
        const { data } = await supabase 
          .from('Completed')
          .select()
          .order('id', { ascending: true });
  
        //? Meant to provide updates when user is in sort mode, currently non-functional, repeats the sorting 4 to 21 times.
        /* if (sortMethod) {
          if (sortMethod.includes('title')) {
            console.log('title sorted')
            sortListByNameSupabase('title', data!, sortMethod, setSortMethod, setResponse);
          } else if (sortMethod.includes('rating')) {

          } else if (sortMethod.includes('date')) {

          }
        } else setResponse(data!); */
        setResponse(data!);
        setResponse1(data!);
        setSortMethod('');
      })
      .subscribe()

    return () => {
      supabase.removeAllChannels();
      clearInterval(refresh);
    }
  },[])

  return (
    <>
      <Head>
        <title>Cytube Watchlist</title>
        <meta name="description" content="Completed" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className='flex flex-col items-center justify-center'>
        <h2 className='p-2 text-3xl'>Completed{sortMethod ? <span onClick={() => {setResponse(response1); setSortMethod('')}} className='cursor-pointer'> ↻</span> : null}</h2>
        <div className='flex items-center gap-2'>
          <form>
            <input ref={searchRef} type='search' placeholder='🔍︎ Search (non-functional)' className='input-text my-2 p-1 w-96 text-lg'></input>
          </form>
          <button onClick={addRecord} className='input-submit h-3/5 p-1 px-2 text-lg rounded-md'>➕ Add New</button>
        </div>
        <table>
          <tbody>
            <tr>
              <th onClick={() => sortListByNameSupabase(response, sortMethod, setSortMethod, setResponse)} className='w-[48rem] cursor-pointer'><span>Title</span><span className='absolute'>{sortSymbol('title', sortMethod)}</span></th>
              <th className='w-32'>Type</th>
              <th className='w-36'>Episode(s)</th>
              <th onClick={() => sortListByRatingSupabase('rating1', response, sortMethod, setSortMethod, setResponse)} className='w-32 cursor-pointer'><span>GoodTaste</span><span className='absolute'>{sortSymbol('rating1', sortMethod)}</span></th>
              <th onClick={() => sortListByRatingSupabase('rating2', response, sortMethod, setSortMethod, setResponse)} className='w-32 cursor-pointer'><span>TomoLover</span><span className='absolute'>{sortSymbol('rating2', sortMethod)}</span></th>
              <th onClick={() => sortListByDateSupabase('startconv' , response, sortMethod, setSortMethod, setResponse)} className='w-40 cursor-pointer'><span>Start Date</span><span className='absolute'>{sortSymbol('start', sortMethod)}</span></th>
              <th onClick={() => sortListByDateSupabase('endconv' , response, sortMethod, setSortMethod, setResponse)} className='w-40  cursor-pointer'><span>End Date</span><span className='absolute'>{sortSymbol('end', sortMethod)}</span></th>
            </tr>
            {isLoadingClient ? loadingGlimmer(7) :
            response?.slice().reverse().map(item => {
              return <tr key={item.id}>
                <td onDoubleClick={() => {setIsEdited(`title${item.id}`)}}>
                  {
                    isEdited == `title${item.id}` 
                    ? editForm('title', item.id, item.title!) : 
                    item.title ? item.title : <span className='italic text-gray-400'>Untitled</span>
                  }
                </td>
                <td onDoubleClick={() => {setIsEdited(`type${item.id}`)}}>{isEdited == `type${item.id}` ? editForm('type', item.id, item.type ?? '') : item.type}</td>
                <td onDoubleClick={() => {setIsEdited(`episode${item.id}`)}}>{isEdited == `episode${item.id}` ? editForm('episode', item.id, item.episode ?? '') : item.episode}</td>
                <td onDoubleClick={() => {setIsEdited(`rating1${item.id}`)}}>{isEdited == `rating1${item.id}` ? editForm('rating1', item.id, item.rating1 ?? '') : item.rating1}</td>
                <td onDoubleClick={() => {setIsEdited(`rating2${item.id}`)}}>{isEdited == `rating2${item.id}` ? editForm('rating2', item.id, item.rating2 ?? '') : item.rating2}</td>
                <td onDoubleClick={() => {setIsEdited(`start${item.id}`)}}>{isEdited == `start${item.id}` ? editForm('start', item.id, item.start ?? '') : item.start}</td>
                <td onDoubleClick={() => {setIsEdited(`end${item.id}`)}}>{isEdited == `end${item.id}` ? editForm('end', item.id, item.end ?? '') : item.end}</td>
              </tr>
            })}
          </tbody>
        </table>
      </main>
    </>
  )

  //TODO: Detect pressing tab so it jumps to the next field to be edited 
  function editForm(field: 'title' | 'type' | 'episode' | 'rating1' | 'rating2' | 'start' | 'end', id: number, ogvalue: string): React.ReactNode {
    let column: string;
    let row = (id + 1).toString();
    switch (field) {
      case 'title':
        column = 'B';
        break;
      case 'type':
        column = 'C';
        break;
      case 'episode':
        column = 'D';
        break;
      case 'rating1':
        column = 'E';
        break;
      case 'rating2':
        column = 'F';
        break;
      case 'start':
        column = 'H';
        break;
      case 'end':
        column = 'I';
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

        const changed = response?.slice();
        if (!changed) return;
        changed.find(item => item.id === id)![field] = event.target[0].value;
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

  // TODO: add loading here to prevent spamming add record
  async function addRecord(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> {
    if (!response?.[response.length - 1].title) {
      alert('Insert title for latest row before adding a new one');
      return;
    }
    try {
      await axios.post('/api/update', {
        content: (response.length + 1).toString(),
        cell: 'A' + (response.length + 2).toString()
      })

      const changed = response.slice();
      changed.push({...initialTitleItemSupabase, id: (response.length + 1)});
      setResponse(changed);
      setIsEdited(`title${response.length + 1}`);
    } 
    catch (error) {
      alert(error);
      return;
    }
  }
}
