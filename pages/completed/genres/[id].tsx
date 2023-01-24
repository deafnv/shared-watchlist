import { createClient } from "@supabase/supabase-js";
import { GetStaticPropsContext } from "next";
import { Database } from "../../../lib/database.types";
import { useEffect, useState } from "react";
import Head from "next/head";

export async function getStaticPaths() {
  const supabase = createClient<Database>('https://esjopxdrlewtpffznsxh.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_API_KEY!);
  const { data } = await supabase
    .from('Genres')
    .select()
    .order('id')

  const paths = data?.map(item => ({
    params: { id: item.id.toString() }
  }))

  return {
    paths,
    fallback: true,
  }
}

export function getStaticProps(context: GetStaticPropsContext) {
  return {
    props: {
      id: context.params?.id
    },
    revalidate: 360,
  }
}

export default function GenrePage({ id }:{ id: number }) {
  const [response, setResponse] = useState<({id: number;} & {title: string | null;} & {Genres: {name: string | null;} | {name: string | null;}[] | null;})[] | null>();
  
  useEffect(() => {
    const supabase = createClient<Database>('https://esjopxdrlewtpffznsxh.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_API_KEY!);
    const getData = async () => {
      const { data } = await supabase
        .from('Completed')
        .select(`
          id,
          title,
          Genres!inner (
            name
          )
        `)
        .eq('Genres.id', id)

      setResponse(data!);
    }
    getData();
  },[])

  return (
    <>
      <Head>
        <title>Cytube Watchlist</title>
        <meta name="description" content={`${(response?.[0].Genres as {name: string | null}[])![0].name} animes in Completed`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className='flex flex-col items-center justify-center gap-3'>
        <h2 className='p-2 text-3xl'>{(response?.[0].Genres as {name: string | null}[])![0].name}</h2>
        {response?.map((item, index) => {
          return <span key={index}>
            {item.title}
          </span>
        })}
      </main> 
    </>
  )
}