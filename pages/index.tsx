import { BaseSyntheticEvent, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js';
import { Database } from '../lib/database.types';
import { initialTitleItemSupabase, sortListByDateSupabase, sortListByNameSupabase, sortListByRatingSupabase, sortSymbol } from '../lib/list_methods';
import { loadingGlimmer } from '../components/LoadingGlimmer';
import { CircularProgress } from '@mui/material';
import { useLoading } from '../components/LoadingContext';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';

//! Non-null assertion for the response state variable here will throw some errors if it does end up being null, fix maybe.
//! ISSUES:
//!   - Fix sort symbol

export default function Home() {
  const [response, setResponse] = useState<Database['public']['Tables']['Completed']['Row'][]>();
  const [response1, setResponse1] = useState<Database['public']['Tables']['Completed']['Row'][]>();
  const [sortMethod, setSortMethod] = useState<string>('');
  const [isEdited, setIsEdited] = useState<string>('');
  const [isLoadingClient, setIsLoadingClient] = useState(true);
  const [isLoadingEditForm, setIsLoadingEditForm] = useState(false);
  const { setLoading } = useLoading();
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{top: any, left: any, display: any, currentItem: Database['public']['Tables']['Completed']['Row'] | null}>({top: 0, left: 0, display: 'none', currentItem: null})

  const supabase = createClient<Database>('https://esjopxdrlewtpffznsxh.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_API_KEY!);

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
      if (e.target?.tagName !== 'INPUT') setIsEdited('');
      if (e.target.tagName !== 'MENU' && e.target.tagName !== 'svg' && !contextMenuRef.current?.contains(e.target)) {
        setPosition({...position, display: 'none'});
      }
    })
    window.addEventListener('focusout', () => {
      setIsEdited('');
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

      <main className='flex flex-col items-center justify-center mb-24'>
        <h2 className='p-2 text-3xl'>Completed{sortMethod ? <span onClick={() => {setResponse(response1); setSortMethod('')}} className='cursor-pointer'> ↻</span> : null}</h2>
        <div className='flex items-center gap-2'>
          <form>
            <input onChange={searchTable} type='search' placeholder='🔍︎ Search Titles' className='input-text my-2 p-1 w-96 text-lg'></input>
          </form>
          <button onClick={addRecord} title='Add new record to table' className='input-submit h-3/5 p-1 px-2 text-lg rounded-md'><AddIcon className='-translate-y-[2px]' /> Add New</button>
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
              return <tr key={item.id} className='relative group'>
                <td onDoubleClick={() => {setIsEdited(`title${item.id}`)}}>
                  {
                    isEdited == `title${item.id}` 
                    ? editForm('title', item.id, item.title!) : 
                    item.title ? item.title : <span className='italic text-gray-400'>Untitled</span>
                  }
                  <div onClick={(e) => {handleMenuClick(e, item)}} className='absolute top-2 z-10 h-7 w-7 invisible group-hover:visible cursor-pointer rounded-full hover:bg-gray-500'>
                    <MoreVertIcon/>
                  </div>
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
        <ContextMenu />
      </main>
    </>
  )

  function ContextMenu() {
    return (
      <menu 
        ref={contextMenuRef} 
        style={{
          top: position.top,
          left: position.left,
          display: position.display
        }}
        className='absolute z-20 p-2 shadow-md shadow-gray-600 bg-slate-200 text-black rounded-sm border-black border-solid border-2 context-menu'
      >
        <li className='flex justify-center'><span className='text-center font-semibold line-clamp-2'>{position.currentItem?.title}</span></li>
        <hr className='my-2 border-gray-500 border-t-[1px]' />
        <li className='flex justify-center h-8 rounded-sm hover:bg-slate-500'><button className='w-full'>Edit</button></li>
        <li className='flex justify-center h-8 rounded-sm hover:bg-slate-500'><button onClick={handleVisit} className='w-full'>Visit on MAL</button></li>
      </menu>
    )

    async function handleVisit() {
      const malURL = await supabase.from('CompletedDetails').select('mal_id').eq('id', position.currentItem?.id);
      window.open(`https://myanimelist.net/anime/${malURL.data?.[0].mal_id}`, '_blank',)
    }
  }

  function handleMenuClick(e: BaseSyntheticEvent, item: Database['public']['Tables']['Completed']['Row']) {
    const { top, left } = e.target.getBoundingClientRect();
    
    setPosition({
      top: top + window.scrollY,
      left: left + window.scrollX + 25,
      display: 'block',
      currentItem: item
    })
  }

  function searchTable(e: BaseSyntheticEvent) {
    if (e.target.value == '') {
      setResponse(response1);
      setSortMethod('');
    } 
    if (!response || !response1) return;

    setResponse(response1.slice().filter(item => item.title?.toLowerCase().includes(e.target.value.toLowerCase())));
  }

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
      setIsLoadingEditForm(true);
      
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
        setIsLoadingEditForm(false);
      } 
      catch (error) {
        setIsLoadingEditForm(false);
        alert(error);
        return;
      }
    }

    return (
      <div className='flex items-center justify-center relative w-full'>
        {isLoadingEditForm ? <CircularProgress size={30} className='absolute' /> : null}
        <div style={{opacity: isLoadingEditForm ? 0.5 : 1, pointerEvents: isLoadingEditForm ? 'none' : 'unset'}} className='w-full'>
          <form onSubmit={handleSubmit}>
            <input autoFocus type='text' defaultValue={ogvalue} className='input-text text-center w-full' />
          </form>
        </div>
      </div>
    )
  }

  // TODO: add loading here to prevent spamming add record
  async function addRecord(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> {
    if (!response?.[response.length - 1].title) {
      alert('Insert title for latest row before adding a new one');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/update', {
        content: (response.length + 1).toString(),
        cell: 'A' + (response.length + 2).toString()
      })

      const changed = response.slice();
      changed.push({...initialTitleItemSupabase, id: (response.length + 1)});
      setResponse(changed);
      setIsEdited(`title${response.length + 1}`);
      setLoading(false);
    } 
    catch (error) {
      setLoading(false);
      alert(error);
      return;
    }
  }
}
