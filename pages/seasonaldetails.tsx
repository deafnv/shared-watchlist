import { createClient } from "@supabase/supabase-js";
import { GetStaticPropsContext } from "next";
import { Database } from "../lib/database.types";
import Head from "next/head";
import Image from "next/image";

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const supabase = createClient<Database>('https://esjopxdrlewtpffznsxh.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_API_KEY!);
  const { data } = await supabase 
    .from('SeasonalDetails')
    .select()
    .order('start_date', { ascending: true });

  return {
    props: {
      res: data
    },
  }
}

export default function SeasonalDetails({ res }: { res: Database['public']['Tables']['SeasonalDetails']['Row'][]}) {
  const rows = Array(12).fill('asd')

  return (
    <>
      <Head>
        <title>Cytube Watchlist</title>
        <meta name="description" content="Seasonal Details" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className='flex flex-col items-center justify-center p-4'>
        <h2 className='mb-6 text-3xl'>Seasonal Details</h2>
        <div className='flex flex-col gap-6'>
          {res.map((item) => {
            return (
              <div className='' key={item.id}>
                {item.message ? <span className='text-red-500'>⚠ This entry appears to be wrong</span> : null}
                <table>
                  <tbody>
                    <tr>
                      <th>Title</th>
                      <th>Episodes</th>
                    </tr>
                    <tr>
                      <td className='w-96 p-2 flex flex-col items-center justify-center'>
                        <Image src={item.image_url ?? 'https://via.placeholder.com/400x566'} alt='Art' height={200} width={150}/>
                        {item.title}
                      </td>
                      <td className='p-0'>
                        <table>
                          <tbody>
                            <tr>
                              {rows.map((item, index) => {
                                return <th className='w-11' key={index}>{index + 1}</th>
                              })}
                            </tr>
                            <tr>
                              {rows.map((item, index) => {
                                return <td className='p-6' key={index}></td>
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
        <button className='input-submit px-2 p-1'>Refresh</button>
        <button className='input-submit px-2 p-1'>Reload</button>
      </main>
    </>
  )
}