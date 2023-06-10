import { GetStaticPropsContext } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRef, useState } from 'react'
import IconButton from '@mui/material/IconButton'
import RefreshIcon from '@mui/icons-material/Refresh'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { Completed, Genres } from '@prisma/client'
import prisma from '@/lib/prisma'

export async function getStaticPaths() {
  const genres = await prisma.genres.findMany({
    orderBy: {
      id: 'asc',
    },
  })

  const paths = genres?.map((item) => ({
    params: { id: item.id.toString() },
  }))

  return {
    paths,
    fallback: true,
  }
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const id = context.params?.id as string
  const genre = await prisma.genres.findUnique({
    where: {
      id: parseInt(id),
    },
  })
  const completedOfGenre = await prisma.completed.findMany({
    where: {
      genres: {
        some: {
          genre_id: {
            equals: parseInt(id),
          },
        },
      },
    },
  })

  return {
    props: {
      genre,
      res: JSON.parse(JSON.stringify(completedOfGenre)),
    },
    revalidate: 360,
  }
}

export default function GenrePage({ genre, res }: { genre: Genres | null; res: Completed[] }) {
  const sortMethodRef = useRef('')

  const [response, setResponse] = useState(res)

  if (!response?.[0]) {
    return (
      <>
        <Head>
          s<title>Watchlist</title>
          <meta name='description' content={`${genre?.name} animes in Completed`} />
        </Head>

        <main className='flex flex-col items-center justify-center gap-3 mx-auto h-[90dvh] md:w-3/5 sm:w-full'>
          <h2 className='p-2 text-2xl sm:text-3xl'>No results found</h2>
        </main>
      </>
    )
  }

  function handleSort(sortBy: 'rating1' | 'rating2') {
    if (sortMethodRef.current == `${sortBy}_desc`) {
      const sorted = response
        ?.slice()
        .sort((a: any, b: any) => a[`${sortBy}average`] - b[`${sortBy}average`])
      sortMethodRef.current = `${sortBy}_asc`
      setResponse(sorted)
    } else {
      const sorted = response
        ?.slice()
        .sort((a: any, b: any) => b[`${sortBy}average`] - a[`${sortBy}average`])
      sortMethodRef.current = `${sortBy}_desc`
      setResponse(sorted)
    }
  }

  return (
    <>
      <Head>
        <title>Watchlist</title>
        <meta name='description' content={`${genre?.name} animes in Completed`} />
      </Head>

      <main className='flex flex-col items-center justify-center mx-auto md:w-4/5 sm:w-full'>
        <header className='flex items-center mb-3'>
          <h2 className='p-2 text-2xl sm:text-3xl'>{genre?.name}</h2>
          {sortMethodRef.current && (
            <IconButton
              title='Reset sort'
              onClick={() => {
                sortMethodRef.current = ''
                setResponse(res)
              }}
              className='flex items-center justify-center h-8 w-8 cursor-pointer rounded-full translate-y-[1px]'
            >
              <RefreshIcon sx={{ fontSize: 28 }} />
            </IconButton>
          )}
        </header>
        <section className='p-2 pt-1 bg-primary-foreground rounded-md'>
          <div className='grid grid-cols-[2fr_1fr_1fr] border-b'>
            <div className='flex items-center justify-center p-3 text-lg text-center font-semibold'>
              Title
            </div>
            <div
              onClick={() => handleSort('rating1')}
              className='flex items-center justify-center p-3 text-lg text-center font-semibold cursor-pointer'
            >
              <span className='relative'>
                Rating 1
                {sortMethodRef.current.includes('rating1') && (
                  <span className='absolute -right-5'>
                    <ArrowDropDownIcon
                      sx={{ rotate: sortMethodRef.current.includes('asc') ? '180deg' : '0' }}
                    />
                  </span>
                )}
              </span>
            </div>
            <div
              onClick={() => handleSort('rating2')}
              className='flex items-center justify-center p-3 text-lg text-center font-semibold cursor-pointer'
            >
              <span className='relative'>
                Rating 2
                {sortMethodRef.current.includes('rating2') && (
                  <span className='absolute -right-5'>
                    <ArrowDropDownIcon
                      sx={{ rotate: sortMethodRef.current.includes('asc') ? '180deg' : '0' }}
                    />
                  </span>
                )}
              </span>
            </div>
          </div>
          <ul className='flex flex-col gap-2 h-[75dvh] overflow-auto'>
            {response?.map((item, index) => {
              return (
                <li
                  key={index}
                  className='grid grid-cols-[2fr_1fr_1fr] p-0 text-center hover:bg-primary-accent rounded-md'
                >
                  <Link href={`/completed/anime/${item.id}`} className='px-5 py-3 h-full w-full'>
                    {item.title}
                  </Link>
                  <span className='flex items-center justify-center p-2 text-center'>
                    {item.rating1}
                  </span>
                  <span className='flex items-center justify-center p-2 text-center'>
                    {item.rating2}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      </main>
    </>
  )
}
