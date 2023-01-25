import { Dispatch, SetStateAction } from 'react'
import { Database } from './database.types'

export interface Rating {
  actual: string | undefined
  average: number | undefined
}

export interface WatchDates {
  original: string | undefined
  converted: number | undefined
}

export interface TitleItem {
  id: number
  title: string | undefined
  type: string | undefined
  episode: string | undefined
  rating1: Rating
  rating2: Rating
  rating3: Rating
  start: WatchDates
  end: WatchDates
}

export interface PTWTItem {
  id: number
  title: string
}

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max)
}

//* COMPLETED LIST METHODS

export const initialTitleItem: TitleItem = {
  id: 0,
  title: undefined,
  type: undefined,
  episode: undefined,
  rating1: { actual: undefined, average: undefined },
  rating2: { actual: undefined, average: undefined },
  rating3: { actual: undefined, average: undefined },
  start: { original: undefined, converted: undefined },
  end: { original: undefined, converted: undefined },
}

export const sortListByName = (
  name: string,
  res: Array<TitleItem>,
  sortMethod: string,
  setSortMethod: Dispatch<SetStateAction<string>>,
  setResponse: Dispatch<SetStateAction<TitleItem[]>>
) => {
  if (sortMethod === `titleasc_${name}`) {
    setSortMethod(`titledesc_${name}`)
    setResponse(res.slice().sort((a, b) => b.title!.localeCompare(a.title!)))
  } else {
    setSortMethod(`titleasc_${name}`)
    setResponse(res.slice().sort((a, b) => a.title!.localeCompare(b.title!)))
  }
}

export const sortListByRating = (
  rating: string,
  res: Array<TitleItem>,
  sortMethod: string,
  setSortMethod: Dispatch<SetStateAction<string>>,
  setResponse: Dispatch<SetStateAction<TitleItem[]>>
) => {
  if (sortMethod === `ratingasc_${rating}`) {
    setSortMethod(`ratingdesc_${rating}`)
    setResponse(
      res.slice().sort((a, b) => {
        if ((b as any)[rating].average! == null) {
          return -1
        }
        return (b as any)[rating].average! - (a as any)[rating].average!
      })
    )
  } else {
    setSortMethod(`ratingasc_${rating}`)
    setResponse(
      res.slice().sort((a, b) => {
        if ((a as any)[rating].average! == null) {
          return -1
        }
        return (a as any)[rating].average! - (b as any)[rating].average!
      })
    )
  }
}

export const sortListByDate = (
  date: string,
  res: Array<TitleItem>,
  sortMethod: string,
  setSortMethod: Dispatch<SetStateAction<string>>,
  setResponse: Dispatch<SetStateAction<TitleItem[]>>
) => {
  if (sortMethod === `dateasc_${date}`) {
    setSortMethod(`datedesc_${date}`)
    setResponse(
      res.slice().sort((a, b) => {
        return (b as any)[date].converted! - (a as any)[date].converted!
      })
    )
  } else {
    setSortMethod(`dateasc_${date}`)
    setResponse(
      res.slice().sort((a, b) => {
        return (a as any)[date].converted! - (b as any)[date].converted!
      })
    )
  }
}

export const sortSymbol = (type: string, sortMethod: string) => {
  if (sortMethod.includes(type)) {
    return sortMethod.includes(`desc_${type}`) ? '▼' : '▲'
  } else {
    return ''
  }
}

//* SUPABASE LIST METHODS

export const initialTitleItemSupabase = {
  end: '',
  episode: '',
  id: 0,
  notes: '',
  rating1: '',
  rating1average: 0,
  rating2: '',
  rating2average: 0,
  rating3: '',
  rating3average: 0,
  start: '',
  title: '',
  type: '',
  startconv: 0,
  endconv: 0,
}

/* export const sortBasedOnSortMethod = (res: Database['public']['Tables']['Completed']['Row'][], sortMethod: string) => {
  if (sortMethod.includes('title')) {
    if (sortMethod.includes('titleasc')) {
      return res.slice().sort((a, b) => a.title!.localeCompare(b.title!)); // Ascending title
    } else {
      return res.slice().sort((a, b) => b.title!.localeCompare(a.title!)) //Descending title
    }
  } else if (sortMethod.includes('rating')) {
    const rating = sortMethod.match(/(?<=_)[^_]+$/);
    if (sortMethod.includes('ratingasc')) {
      return res.slice().sort((a, b) => {
        if ((a as any)[`${rating}average`] == null) {
          return -1;
        }
        return (b as any)[`${rating}average`] - (a as any)[`${rating}average`];
      });
    } else {
      return res.slice().sort((a, b) => {
        if ((b as any)[`${rating}average`] == null) {
          return -1;
        }
        return (a as any)[`${rating}average`] - (b as any)[`${rating}average`];
      });
    }
  } else { //!Use this for date sorting

  }
} */

export const sortListByNameSupabase = (
  res: Database['public']['Tables']['Completed']['Row'][] | undefined,
  sortMethod: string,
  setSortMethod: Dispatch<SetStateAction<string>>,
  setResponse: Dispatch<
    SetStateAction<
      Database['public']['Tables']['Completed']['Row'][] | undefined
    >
  >
) => {
  if (sortMethod === `titleasc_title`) {
    setSortMethod(`titledesc_title`)
    setResponse(res?.slice().sort((a, b) => b.title!.localeCompare(a.title!)))
  } else {
    setSortMethod(`titleasc_title`)
    setResponse(res?.slice().sort((a, b) => a.title!.localeCompare(b.title!)))
  }
}

export const sortListByRatingSupabase = (
  rating: 'rating1' | 'rating2',
  res: Database['public']['Tables']['Completed']['Row'][] | undefined,
  sortMethod: string,
  setSortMethod: Dispatch<SetStateAction<string>>,
  setResponse: Dispatch<
    SetStateAction<
      Database['public']['Tables']['Completed']['Row'][] | undefined
    >
  >
) => {
  if (sortMethod === `ratingasc_${rating}`) {
    setSortMethod(`ratingdesc_${rating}`)
    setResponse(
      res?.slice().sort((a, b) => {
        if (b[`${rating}average`] == null) {
          return -1
        }
        return a[`${rating}average`]! - b[`${rating}average`]!
      })
    )
  } else {
    setSortMethod(`ratingasc_${rating}`)
    setResponse(
      res?.slice().sort((a, b) => {
        if (a[`${rating}average`] == null) {
          return -1
        }
        return b[`${rating}average`]! - a[`${rating}average`]!
      })
    )
  }
}

export const sortListByDateSupabase = (
  date: 'startconv' | 'endconv',
  res: Database['public']['Tables']['Completed']['Row'][] | undefined,
  sortMethod: string,
  setSortMethod: Dispatch<SetStateAction<string>>,
  setResponse: Dispatch<
    SetStateAction<
      Database['public']['Tables']['Completed']['Row'][] | undefined
    >
  >
) => {
  if (sortMethod === `dateasc_${date}`) {
    setSortMethod(`datedesc_${date}`)
    setResponse(
      res?.slice().sort((a, b) => {
        return b[date]! - a[date]!
      })
    )
  } else {
    setSortMethod(`dateasc_${date}`)
    setResponse(
      res?.slice().sort((a, b) => {
        return a[date]! - b[date]!
      })
    )
  }
}

//* PLAN TO WATCH LIST METHODS

export const sortListByNamePTW = (
  name: string,
  res: Database['public']['Tables']['PTW-Rolled']['Row'][] | undefined,
  sortMethod: string,
  setSortMethod: Dispatch<SetStateAction<string>>,
  setResponse: Dispatch<
    SetStateAction<
      Database['public']['Tables']['PTW-Rolled']['Row'][] | undefined
    >
  >
) => {
  if (sortMethod === `titleasc_${name}`) {
    setSortMethod(`titledesc_${name}`)
    setResponse(res?.slice().sort((a, b) => b.title!.localeCompare(a.title!)))
  } else {
    setSortMethod(`titleasc_${name}`)
    setResponse(res?.slice().sort((a, b) => a.title!.localeCompare(b.title!)))
  }
}
