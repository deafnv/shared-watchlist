import Head from 'next/head'
import { google } from 'googleapis'
import { useEffect, useState } from 'react'
import { GetServerSidePropsContext } from 'next';

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
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
  })

  return {
    props: {
      res: res.data.values,
      resBatch: resDataFilter.data.valueRanges?.[0].valueRange?.values
    }
  };
}

export default function Home({ res, resBatch }: {res: string[][], resBatch: string[]}) {
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
              <th>GoodTaste</th>
              <th>TomoLover</th>
              <th>Start Date</th>
              <th>End Date</th>
            </tr>
            {res.map(title => {
              return <tr key={title[0]}>
                <td>{title[0]}</td>
                <td>{title[1]}</td>
                <td>{title[2]}</td>
                <td>{title[3]}</td>
                <td>{title[4]}</td>
                <td>{title[6]}</td>
                <td>{title[7]}</td>
              </tr>
            })}
          </tbody>
        </table>
      </main>
    </>
  )
}
