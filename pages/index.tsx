import Head from 'next/head'
import { GetServerSidePropsContext } from 'next';
import { BaseSyntheticEvent, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { google } from 'googleapis'
import { TitleItem, initialTitleItem, sortListByDate, sortListByName, sortListByRating, sortSymbol } from '../lib/list_methods';

export const getStaticProps = async (context: GetServerSidePropsContext) => {
  const auth = await google.auth.getClient({ credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!), scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth });
  
  const resDataFilter = await sheets.spreadsheets.values.batchGetByDataFilter({
    spreadsheetId: process.env.SHEET_ID,
    requestBody: {
      dataFilters: [{
        a1Range: 'A1:A999'
      }],
    }
  });

  const lenOfAvailableTitles = resDataFilter.data.valueRanges?.[0].valueRange?.values?.length;
  const range = `Sheet1!A2:J${lenOfAvailableTitles}`;
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range
  });

  const objectifiedRes = res.data.values?.map(item => {
    let fixed = new Array(9);
    fixed.fill(null);
    Object.seal(fixed);
    let [title, type, episode, rating1, rating2, rating3, start, end, notes] = item;
    fixed = [title, type, episode, rating1, rating2, rating3, start, end, notes];
    return {
      id: fixed[0] ? parseInt(fixed[0]) : -1,
      title: fixed[1] ? fixed[1] : '',
      type: fixed[2] ? fixed[2] : '',
      episode: fixed[3] ? fixed[3] : '',
      rating1: {
        actual: fixed[4] ? fixed[4] : '',
        average: fixed[4] ? getAverage(fixed[4]) : ''
      },
      rating2: {
        actual: fixed[5] ? fixed[5] : '',
        average: fixed[5] ? getAverage(fixed[5]) : ''
      },
      rating3: {
        actual: fixed[6] ? fixed[6] : '',
        average: fixed[6] ? getAverage(fixed[6]) : ''
      },
      start: {
        original: fixed[7] ? fixed[7] : '',
        converted: fixed[7] ? new Date(fixed[7]).getTime() : 0
      },
      end: {
        original: fixed[8] ? fixed[8] : '',
        converted: fixed[8] ? new Date(fixed[8]).getTime() : 0
      },
      notes: fixed[9] ? fixed[9] : ''
    }
  });

  //! This will give errors for ratings with more than 2 number probably.
  function getAverage(param: string) {
    const arr = param.match(/(\d\.\d)|(\d+)/g);
    if (arr?.length! > 1) {
      return ((parseFloat(arr![0]) + parseFloat(arr![1])) / 2);
    } else {
      return parseFloat(param);
    }
  }

  return {
    props: {
      res: objectifiedRes,
    },
    revalidate: 10,
  };
}

export default function Home({ res }: {res: Array<TitleItem>}) {
  const [response, setResponse] = useState<Array<TitleItem>>(res);
  const [sortMethod, setSortMethod] = useState<string>('');
  const [isEdited, setIsEdited] = useState<string>('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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

        const changed = response.slice();
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
    if (!response[response.length - 1].title) {
      alert('Insert title for latest row before adding a new one');
      return;
    }
    try {
      await axios.post('/api/update', {
        content: (response.length + 1).toString(),
        cell: 'A' + (response.length + 2).toString()
      })

      const changed = response.slice();
      changed.push({...initialTitleItem, id: (response.length + 1)});
      setResponse(changed);
      setIsEdited(`title${response.length + 1}`);
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
        <h2 className='p-2 text-3xl'>Completed{sortMethod ? <span onClick={() => {setResponse(res); setSortMethod('')}} className='cursor-pointer'> ↻</span> : null}</h2>
        <div className='flex items-center gap-2'>
          <form>
            <input ref={searchRef} type='search' placeholder='🔍︎ Search (non-functional)' className='input-text my-2 p-1 w-96 text-lg'></input>
          </form>
          <button onClick={addRecord} className='input-submit h-3/5 p-1 px-2 text-lg rounded-md'>➕ Add New</button>
        </div>
        <table>
          <tbody>
            <tr>
              <th onClick={() => sortListByName('title', res, sortMethod, setSortMethod, setResponse)} className='cursor-pointer'><span>Title</span><span className='absolute'>{sortSymbol('title', sortMethod)}</span></th>
              <th className='w-32'>Type</th>
              <th className='w-36'>Episode(s)</th>
              <th onClick={() => sortListByRating('rating1', res, sortMethod, setSortMethod, setResponse)} className='w-32 cursor-pointer'><span>GoodTaste</span><span className='absolute'>{sortSymbol('rating1', sortMethod)}</span></th>
              <th onClick={() => sortListByRating('rating2', res, sortMethod, setSortMethod, setResponse)} className='w-32 cursor-pointer'><span>TomoLover</span><span className='absolute'>{sortSymbol('rating2', sortMethod)}</span></th>
              <th onClick={() => sortListByDate('start' , res, sortMethod, setSortMethod, setResponse)} className='w-40 cursor-pointer'><span>Start Date</span><span className='absolute'>{sortSymbol('start', sortMethod)}</span></th>
              <th onClick={() => sortListByDate('end' , res, sortMethod, setSortMethod, setResponse)} className='w-40  cursor-pointer'><span>End Date</span><span className='absolute'>{sortSymbol('end', sortMethod)}</span></th>
            </tr>
            {response.slice().reverse().map(item => {
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
                <td onDoubleClick={() => {setIsEdited(`rating1${item.id}`)}}>{isEdited == `rating1${item.id}` ? editForm('rating1', item.id, item.rating1.actual!) : item.rating1.actual}</td>
                <td onDoubleClick={() => {setIsEdited(`rating2${item.id}`)}}>{isEdited == `rating2${item.id}` ? editForm('rating2', item.id, item.rating2.actual!) : item.rating2.actual}</td>
                <td onDoubleClick={() => {setIsEdited(`start${item.id}`)}}>{isEdited == `start${item.id}` ? editForm('start', item.id, item.start.original!) : item.start.original}</td>
                <td onDoubleClick={() => {setIsEdited(`end${item.id}`)}}>{isEdited == `end${item.id}` ? editForm('end', item.id, item.end.original!) : item.end.original}</td>
              </tr>
            })}
          </tbody>
        </table>
      </main>
    </>
  )
}
