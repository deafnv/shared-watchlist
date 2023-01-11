import Head from 'next/head'
import { BaseSyntheticEvent, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { TitleItem, initialTitleItem, initialTitleItemSupabase, sortListByDate, sortListByDateSupabase, sortListByName, sortListByNameSupabase, sortListByRating, sortListByRatingSupabase, sortSymbol } from '../lib/list_methods';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../lib/database.types';

//! Non-null assertion for the response state variable here will throw some errors if it does end up being null, fix maybe.
//! ISSUES:
//!   - Sorting date X
//!   - Reset sort X

export default function Home() {
  const [response, setResponse] = useState<Database['public']['Tables']['Completed']['Row'][]>();
  const [sortMethod, setSortMethod] = useState<string>('');
  const [isEdited, setIsEdited] = useState<string>('');
  const searchRef = useRef<HTMLInputElement>(null);

  const supabase = createClient<Database>('https://esjopxdrlewtpffznsxh.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_API_KEY!);

  const getInitialCompleted =async () => {
    const data = await supabase 
      .from('Completed')
      .select().order('id', { ascending: true });

      setResponse(data.data!);
  }

  useEffect(() => {
    getInitialCompleted();

    const subscribe = supabase
      .channel('public:Completed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Completed' }, payload => {
        console.log('Change received!', payload)
      })
      .subscribe()

    const subscriptions = supabase.getChannels();
    console.log(subscriptions)
    
    document.addEventListener('click', (e: any) => {
      if (e.target?.tagName === 'INPUT') return;
      setIsEdited('');
    })
    window.addEventListener("keydown",function (e) {
      if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) { 
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsEdited('');
      }
    })
  },[])

  function editForm(field: string, id: number, ogvalue: string): React.ReactNode {
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

        const changed = response!.slice();
        if (field.match('rating')) {
          (changed.find(item => item.id === id) as any)[field].actual = event.target[0].value;
        } else if (field.match('start') || field.match('end')) {
          (changed.find(item => item.id === id) as any)[field].original = event.target[0].value;
        } else {
          (changed.find(item => item.id === id) as any)[field] = event.target[0].value;
        }
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
    if (!response![response!.length - 1].title) {
      alert('Insert title for latest row before adding a new one');
      return;
    }
    try {
      await axios.post('/api/update', {
        content: (response!.length + 1).toString(),
        cell: 'A' + (response!.length + 2).toString()
      })

      const changed = response!.slice();
      changed.push({...initialTitleItemSupabase, id: (response!.length + 1)});
      setResponse(changed);
      setIsEdited(`title${response!.length + 1}`);
    } 
    catch (error) {
      alert(error);
      return;
    }
  }

  return (
    <>
      <Head>
        <title>Cytube Watchlist</title>
        <meta name="description" content="Completed" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className='flex flex-col items-center justify-center'>
        <h2 className='p-2 text-3xl'>Completed{sortMethod ? <span onClick={() => {setResponse(response); setSortMethod('')}} className='cursor-pointer'> ↻</span> : null}</h2>
        <div className='flex items-center gap-2'>
          <form>
            <input ref={searchRef} type='search' placeholder='🔍︎ Search (non-functional)' className='input-text my-2 p-1 w-96 text-lg'></input>
          </form>
          <button onClick={addRecord} className='input-submit h-3/5 p-1 px-2 text-lg rounded-md'>➕ Add New</button>
        </div>
        <table>
          <tbody>
            <tr>
              <th onClick={() => sortListByNameSupabase('title', response!, sortMethod, setSortMethod, setResponse)} className='cursor-pointer'><span>Title</span><span className='absolute'>{sortSymbol('title', sortMethod)}</span></th>
              <th className='w-32'>Type</th>
              <th className='w-36'>Episode(s)</th>
              <th onClick={() => sortListByRatingSupabase('rating1', response!, sortMethod, setSortMethod, setResponse)} className='w-32 cursor-pointer'><span>GoodTaste</span><span className='absolute'>{sortSymbol('rating1', sortMethod)}</span></th>
              <th onClick={() => sortListByRatingSupabase('rating2', response!, sortMethod, setSortMethod, setResponse)} className='w-32 cursor-pointer'><span>TomoLover</span><span className='absolute'>{sortSymbol('rating2', sortMethod)}</span></th>
              <th onClick={() => sortListByDateSupabase('start' , response!, sortMethod, setSortMethod, setResponse)} className='w-40 cursor-pointer'><span>Start Date</span><span className='absolute'>{sortSymbol('start', sortMethod)}</span></th>
              <th onClick={() => sortListByDateSupabase('end' , response!, sortMethod, setSortMethod, setResponse)} className='w-40  cursor-pointer'><span>End Date</span><span className='absolute'>{sortSymbol('end', sortMethod)}</span></th>
            </tr>
            {response?.slice().reverse().map(item => {
              return <tr key={item.title}>
                <td onDoubleClick={() => {setIsEdited(`title${item.id}`)}}>
                  {
                    isEdited == `title${item.id}` 
                    ? editForm('title', item.id, item.title!) : 
                    item.title ? item.title : <span className='italic text-gray-400'>Untitled</span>
                  }
                </td>
                <td onDoubleClick={() => {setIsEdited(`type${item.id}`)}}>{isEdited == `type${item.id}` ? editForm('type', item.id, item.type!) : item.type}</td>
                <td onDoubleClick={() => {setIsEdited(`episode${item.id}`)}}>{isEdited == `episode${item.id}` ? editForm('episode', item.id, item.episode!) : item.episode}</td>
                <td onDoubleClick={() => {setIsEdited(`rating1${item.id}`)}}>{isEdited == `rating1${item.id}` ? editForm('rating1', item.id, item.rating1!) : item.rating1}</td>
                <td onDoubleClick={() => {setIsEdited(`rating2${item.id}`)}}>{isEdited == `rating2${item.id}` ? editForm('rating2', item.id, item.rating2!) : item.rating2}</td>
                <td onDoubleClick={() => {setIsEdited(`start${item.id}`)}}>{isEdited == `start${item.id}` ? editForm('start', item.id, item.start!) : item.start}</td>
                <td onDoubleClick={() => {setIsEdited(`end${item.id}`)}}>{isEdited == `end${item.id}` ? editForm('end', item.id, item.end!) : item.end}</td>
              </tr>
            })}
          </tbody>
        </table>
      </main>
    </>
  )
}
