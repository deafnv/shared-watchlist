import Head from 'next/head'
import { GetServerSidePropsContext } from 'next';
import { BaseSyntheticEvent, useEffect, useState } from 'react'
import axios from 'axios'
import { google } from 'googleapis'
import { Reorder } from 'framer-motion';
import { PTWTItem, sortListByNamePTW, sortSymbol } from '../lib/list_methods';

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

export default function Home({ res }: {res: PTWTItem[]}) {
  const [response, setResponse] = useState<PTWTItem[]>(res);
  const [sortMethod, setSortMethod] = useState<string>('');
  const [isEdited, setIsEdited] = useState<string>('');

  useEffect(() => {
    document.addEventListener('click', (e: any) => {
      if (e.target?.tagName === 'INPUT') return;
      setIsEdited('');
    })

    /* const retrieveUpdates = setInterval(async () => {
      const updateResponse = await axios.get('/api/getupdates/ptw');
      setResponse(updateResponse.data);
    }, 3000);
    
    return () => {
      clearInterval(retrieveUpdates);
    }; */
  },[])
  
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
        <h2 className='p-2 text-3xl'>Plan to Watch{sortMethod ? <span onClick={() => {setResponse(res); setSortMethod('')}} className='cursor-pointer'> ↻</span> : null}</h2>
        <table>
          <tbody>
            <tr>
              <th onClick={() => sortListByNamePTW('title', res, sortMethod, setSortMethod, setResponse)} className='w-[30rem] cursor-pointer'><span>Title</span><span className='absolute'>{sortSymbol('title', sortMethod)}</span></th>
            </tr> 
            <Reorder.Group values={response} onReorder={setResponse}>
              {response.map((item, i) => {
                return ( 
                  <Reorder.Item
                    value={item}
                    key={item.id}
                    className='p-0 hover:bg-neutral-700'
                  >
                    <div style={sortMethod ? undefined : {cursor: 'move'}} onDoubleClick={() => {setIsEdited(`title${item.id}`)}} className='p-2'><span className='cursor-text'>{isEdited == `title${item.id}` ? editForm('title', item.id, item.title) : item.title}</span></div>
                  </Reorder.Item>
                )
              })}
            </Reorder.Group>
          </tbody>
        </table>
        {response != res && !sortMethod ? 
          <div className='flex gap-2 my-2'>
            <button className='input-submit p-2 rounded-md' onClick={() => {console.log(response)}}>Save Changes</button>
            <button className='input-submit p-2 rounded-md' onClick={() => {setResponse(res)}}>Cancel</button>
          </div>
         : null}
      </main>
    </>
  )
}
