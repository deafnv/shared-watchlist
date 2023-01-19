import { createClient } from "@supabase/supabase-js";
import { GetStaticPropsContext } from "next";
import { Database } from "../lib/database.types";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

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

  function determineEpisode(latestEpisode: number, index: number) {
    const accountFor2Cour = latestEpisode > 12 ? latestEpisode - 12 : latestEpisode;
    if (accountFor2Cour > index) { //* Not sure why this isn't index + 1
      return 'red'
    } else return 'black'
  }

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
              <div className='flex flex-col items-center gap-2' key={item.id}>
                <table>
                  <tbody>
                    <tr>
                      <th>Title</th>
                      <th>Episodes</th>
                    </tr>
                    <tr>
                      <td className='w-96 p-2 flex flex-col items-center justify-center gap-3'>
                        <Image src={item.image_url ?? 'https://via.placeholder.com/400x566'} alt='Art' height={200} width={150}/>
                        <span className='font-bold'>{item.title}</span>
                        <span style={{textTransform: 'capitalize'}}>
                          <span className='font-semibold'>Broadcast: </span>{item.broadcast ?? 'Unknown'}
                        </span>
                        <span>
                          <span className='font-semibold'>Episodes: </span>{item.num_episodes ? item.num_episodes : 'Unknown'}
                        </span>
                        <Link href={`https://myanimelist.net/anime/${item.mal_id}`} target='_blank' className='link'>MyAnimeList</Link>
                      </td>
                      <td className='p-0'>
                        <table>
                          <tbody>
                            <tr>
                              {rows.map((item1, index1) => {
                                return <th className='w-11' key={index1}>{item.latest_episode! > 12 ? index1 + 13 : index1 + 1}</th>
                              })}
                            </tr>
                            <tr>
                              {rows.map((item1, index1) => {
                                return <td 
                                  style={{
                                    background: determineEpisode(item.latest_episode!, index1)
                                  }}
                                  className='p-6' 
                                  key={index1}
                                ></td>
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {item.message == 'Validate' ? 
                  <div className='grid grid-cols-2 gap-2'>
                    <span className='col-span-2 text-red-500 '>⚠ This entry appears to be wrong (Non-functional)</span>
                    <button className='input-submit px-2 p-1'>Change</button>
                    <button className='input-submit px-2 p-1 bg-rose-600 hover:bg-rose'>Ignore</button>
                  </div>
                : null}
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