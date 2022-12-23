import Head from 'next/head'
import axios from 'axios'
import { google } from 'googleapis'
import { BaseSyntheticEvent, useEffect, useState } from 'react'
import { GetServerSidePropsContext } from 'next';

export const getStaticProps = async (context: GetServerSidePropsContext) => {
  const auth = await google.auth.getClient({ credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!), scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth });
  
  const resDataFilter = await sheets.spreadsheets.values.batchGetByDataFilter({
    spreadsheetId: process.env.SHEET_ID,
    requestBody: {
      dataFilters: [{
        a1Range: 'N1:N22'
      }],
    }
  });

  const lenOfAvailableTitles = resDataFilter.data.valueRanges?.[0].valueRange?.values?.length;
  const range = `Sheet1!N2:N${lenOfAvailableTitles}`;
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range
  });

  let idCounter = 0;
  const objectifiedRes = res.data.values?.map(item => {
    idCounter++;
    return {
      id: idCounter,
      title: item[0]
    }
  });

  return {
    props: {
      res: objectifiedRes,
    },
    revalidate: 10,
  };
}

export default function Home({ res }: {res: {id: number, title: string}[]}) {
  const [response, setResponse] = useState<{id: number, title: string}[]>(res);
  const [sortMethod, setSortMethod] = useState<string>('');
  const [isEdited, setIsEdited] = useState<any>(null);

  useEffect(() => {
    document.addEventListener('click', (e: any) => {
      if (e.target?.tagName === 'INPUT') return;
      setIsEdited(null);
    })

    const retrieveUpdates = setInterval(async () => {
      const updateResponse = await axios.get('/api/getupdates/ptw');
      setResponse(updateResponse.data);
    }, 3000);
    
    return () => {
      clearInterval(retrieveUpdates);
    };
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
        column = 'N';
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
        <h2 className='p-2 text-3xl'>Plan to Watch{sortMethod ? <span onClick={() => {setResponse(res); setSortMethod('')}} className='cursor-pointer'> ↻</span> : null}</h2>
        <table>
          <tbody>
            <tr>
              <th onClick={() => sortListByName('title')} className='w-[30rem] cursor-pointer'><span>Title</span><span className='absolute'>{sortSymbol('title')}</span></th>
            </tr> 
            {response.map(item => {
              return <tr key={item.id}>
                <td onDoubleClick={() => {setIsEdited(`title${item.id}`)}}>{isEdited == `title${item.id}` ? editForm('title', item.id, item.title) : item.title}</td>
              </tr>
            })}
          </tbody>
        </table>
      </main>
    </>
  )
}
