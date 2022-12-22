import Head from 'next/head'
import axios from 'axios'
import { google } from 'googleapis'
import { BaseSyntheticEvent, useEffect, useState } from 'react'
import { GetServerSidePropsContext } from 'next';

interface Rating {
  actual: string | undefined,
  average: number | undefined
}

interface WatchDates {
  original: string | undefined,
  converted: number | undefined
}

interface TitleItem {
  id: number,
  title: string | undefined,
  type: string | undefined,
  episode: string | undefined,
  rating1: Rating,
  rating2: Rating,
  rating3: Rating,
  start: WatchDates,
  end: WatchDates
}

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
      resBatch: resDataFilter.data.valueRanges?.[0].valueRange?.values
    },
    revalidate: 10,
  };
}

export default function Home({ res, resBatch }: {res: Array<TitleItem>, resBatch: string[]}) {
  const [response, setResponse] = useState<Array<TitleItem>>(res);
  const [sortMethod, setSortMethod] = useState<string>('');
  const [isEdited, setIsEdited] = useState<any>(null);

  useEffect(() => {
    document.addEventListener('click', (e: any) => {
      if (e.target?.tagName === 'INPUT') return;
      setIsEdited(null);
    })
  },[])

  const sortListByName = (name: string) => {
    if (sortMethod === `titleasc_${name}`) {
      setSortMethod(`titledesc_${name}`)
      setResponse(res.slice().sort((a, b) => b.title!.localeCompare(a.title!)));
    } else {
      setSortMethod(`titleasc_${name}`);
      setResponse(res.slice().sort((a, b) => a.title!.localeCompare(b.title!)));
    }
  }

  const sortListByRating = (rating: string) => {
    if (sortMethod === `ratingasc_${rating}`) {
      setSortMethod(`ratingdesc_${rating}`)
      setResponse(res.slice().sort((a, b) => {
        if ((b as any)[rating].average! == null) {
          return -1;
        }
        return (b as any)[rating].average! - (a as any)[rating].average!;
      }));
    } else {
      setSortMethod(`ratingasc_${rating}`);
      setResponse(res.slice().sort((a, b) => {
        if ((a as any)[rating].average! == null) {
          return -1;
        }
        return (a as any)[rating].average! - (b as any)[rating].average!;
      }));
    }
  }

  const sortListByDate = (date: string) => {
    if (sortMethod === `dateasc_${date}`) {
      setSortMethod(`datedesc_${date}`)
      setResponse(res.slice().sort((a, b) => {
        return (b as any)[date].converted! - (a as any)[date].converted!;
      }));
    } else {
      setSortMethod(`dateasc_${date}`);
      setResponse(res.slice().sort((a, b) => {
        return (a as any)[date].converted! - (b as any)[date].converted!;
      }));
    }
  }

  const sortSymbol = (type: string) => {
    if(sortMethod.includes(type)) {
      return sortMethod.includes(`desc_${type}`) ? '▼' : '▲';
    } else {
      return '';
    }
  }
  
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
        (changed.find(item => item.id === id) as any)[field] = event.target[0].value;
        setResponse(changed);
        setIsEdited(null);
      } 
      catch (error) {
        alert(error);
        return;
      }
    }

    return <form onSubmit={handleSubmit}><input autoFocus type='text' value={ogvalue} className='input-text text-center w-4/5'></input></form>
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
        <h2 className='p-2 text-3xl'>Completed</h2>
        <table>
          <tbody>
            <tr>
              <th onClick={() => sortListByName('title')} className='cursor-pointer'><span>Title</span><span className='absolute'>{sortSymbol('title')}</span></th>
              <th className='w-32'>Type</th>
              <th className='w-36'>Episode(s)</th>
              <th onClick={() => sortListByRating('rating1')} className='w-32 cursor-pointer'><span>GoodTaste</span><span className='absolute'>{sortSymbol('rating1')}</span></th>
              <th onClick={() => sortListByRating('rating2')} className='w-32 cursor-pointer'><span>TomoLover</span><span className='absolute'>{sortSymbol('rating2')}</span></th>
              <th onClick={() => sortListByDate('start')} className='w-40 cursor-pointer'><span>Start Date</span><span className='absolute'>{sortSymbol('start')}</span></th>
              <th onClick={() => sortListByDate('end')} className='w-40  cursor-pointer'><span>End Date</span><span className='absolute'>{sortSymbol('end')}</span></th>
            </tr> 
            {response.map(item => {
              return <tr key={item.title}>
                <td onDoubleClick={() => {setIsEdited(`title${item.id}`)}}>{isEdited == `title${item.id}` ? editForm('title', item.id, item.title!) : item.title}</td>
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
