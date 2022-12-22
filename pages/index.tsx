import Head from 'next/head'
import { google } from 'googleapis'
import { useEffect, useState } from 'react'
import { GetServerSidePropsContext } from 'next';

interface Rating {
  actual: string | undefined,
  average: number | undefined
}

interface TitleItem {
  title: string | undefined,
  type: string | undefined,
  episode: string | undefined,
  rating1: Rating,
  rating2: Rating,
  rating3: Rating,
  start: string | undefined,
  end: string | undefined,
}

export const getStaticProps = async (context: GetServerSidePropsContext) => {
  const auth = await google.auth.getClient({ credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!), scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth });
  
  const resDataFilter = await sheets.spreadsheets.values.batchGetByDataFilter({
    spreadsheetId: '105TaxFl8ICFYglf0dzOBbvg6Iw2IjTNjlEb1V2czqQc',
    requestBody: {
      dataFilters: [{
        a1Range: 'A1:A999'
      }],
    }
  });

  const lenOfAvailableTitles = resDataFilter.data.valueRanges?.[0].valueRange?.values?.length;
  const range = `Sheet1!B2:J${lenOfAvailableTitles}`;
  
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
      title: fixed[0] ? fixed[0] : '',
      type: fixed[1] ? fixed[1] : '',
      episode: fixed[2] ? fixed[2] : '',
      rating1: {
        actual: fixed[3] ? fixed[3] : '',
        average: fixed[3] ? getAverage(fixed[3]) : ''
      },
      rating2: {
        actual: fixed[4] ? fixed[4] : '',
        average: fixed[3] ? getAverage(fixed[4]) : ''
      },
      rating3: {
        actual: fixed[5] ? fixed[5] : '',
        average: fixed[5] ? getAverage(fixed[5]) : ''
      },
      start: fixed[6] ? fixed[6] : '',
      end: fixed[7] ? fixed[7] : '',
      notes: fixed[8] ? fixed[8] : ''
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

  const sortSymbol = (rating: string) => {
    if(sortMethod.includes(rating)) {
      return sortMethod.includes(`desc_${rating}`) ? '▼' : '▲';
    } else {
      return '';
    }
  }

  return (
    <>
      <Head>
        <title>Cytube Watchlist</title>
        <meta name="description" content="Cytube Watchlist" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className='flex flex-col items-center justify-center'>
        <h2 className='p-2 text-3xl'>Watchlist</h2>
        <table>
          <tbody>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Episode(s)</th>
              <th onClick={() => sortListByRating('rating1')} className='w-32 cursor-pointer'><span>GoodTaste</span><span className='absolute'>{sortSymbol('rating1')}</span></th>
              <th onClick={() => sortListByRating('rating2')} className='w-32 cursor-pointer'><span>TomoLover</span><span className='absolute'>{sortSymbol('rating2')}</span></th>
              <th>Start Date</th>
              <th>End Date</th>
            </tr>
            {response.map(item => {
              return <tr key={item.title}>
                <td>{item.title}</td>
                <td>{item.type}</td>
                <td>{item.episode}</td>
                <td>{item.rating1.actual}</td>
                <td>{item.rating2.actual}</td>
                <td>{item.start}</td>
                <td>{item.end}</td>
              </tr>
            })}
          </tbody>
        </table>
      </main>
    </>
  )
}
