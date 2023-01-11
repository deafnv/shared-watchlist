import { Dispatch, SetStateAction } from "react"
import { Database } from "./database.types"

export interface Rating {
  actual: string | undefined,
  average: number | undefined
}

export interface WatchDates {
  original: string | undefined,
  converted: number | undefined
}

export interface TitleItem{
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

export interface PTWTItem {
  id: number, 
  title: string
}

//* COMPLETED LIST METHODS

export const initialTitleItem: TitleItem = {
  id: 0,
  title: undefined,
  type: undefined,
  episode: undefined,
  rating1: {actual: undefined, average: undefined},
  rating2: {actual: undefined, average: undefined},
  rating3: {actual: undefined, average: undefined},
  start: {original: undefined, converted: undefined},
  end: {original: undefined, converted: undefined}
}

export const sortListByName = (name: string, res: Array<TitleItem>, sortMethod: string, setSortMethod: Dispatch<SetStateAction<string>>, setResponse: Dispatch<SetStateAction<TitleItem[]>>) => {
  if (sortMethod === `titleasc_${name}`) {
    setSortMethod(`titledesc_${name}`)
    setResponse(res.slice().sort((a, b) => b.title!.localeCompare(a.title!)));
  } else {
    setSortMethod(`titleasc_${name}`);
    setResponse(res.slice().sort((a, b) => a.title!.localeCompare(b.title!)));
  }
}

export const sortListByRating = (rating: string, res: Array<TitleItem>, sortMethod: string, setSortMethod: Dispatch<SetStateAction<string>>, setResponse: Dispatch<SetStateAction<TitleItem[]>>) => {
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

export const sortListByDate = (date: string, res: Array<TitleItem>, sortMethod: string, setSortMethod: Dispatch<SetStateAction<string>>, setResponse: Dispatch<SetStateAction<TitleItem[]>>) => {
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

export const sortSymbol = (type: string, sortMethod: string) => {
  if(sortMethod.includes(type)) {
    return sortMethod.includes(`desc_${type}`) ? '▼' : '▲';
  } else {
    return '';
  }
}


//* SUPABASE LIST METHODS

export const initialTitleItemSupabase = {
  end: null,
  episode: null,
  id: 0,
  notes: null,
  rating1: null,
  rating1average: null,
  rating2: null,
  rating2average: null,
  rating3: null,
  rating3average: null,
  start: null,
  title: null,
  type: null
}

export const sortListByNameSupabase = (name: string, res: Database['public']['Tables']['Completed']['Row'][], sortMethod: string, setSortMethod: Dispatch<SetStateAction<string>>, setResponse: Dispatch<SetStateAction<Database['public']['Tables']['Completed']['Row'][] | undefined>>) => {
  if (sortMethod === `titleasc_${name}`) {
    setSortMethod(`titledesc_${name}`)
    setResponse(res.slice().sort((a, b) => b.title!.localeCompare(a.title!)));
  } else {
    setSortMethod(`titleasc_${name}`);
    setResponse(res.slice().sort((a, b) => a.title!.localeCompare(b.title!)));
  }
}

export const sortListByRatingSupabase = (rating: string, res: Database['public']['Tables']['Completed']['Row'][], sortMethod: string, setSortMethod: Dispatch<SetStateAction<string>>, setResponse: Dispatch<SetStateAction<Database['public']['Tables']['Completed']['Row'][] | undefined>>) => {
  if (sortMethod === `ratingasc_${rating}`) {
    setSortMethod(`ratingdesc_${rating}`)
    setResponse(res.slice().sort((a, b) => {
      if ((b as any)[`${rating}average`] == null) {
        return -1;
      }
      return (a as any)[`${rating}average`] - (b as any)[`${rating}average`];
    }));
  } else {
    setSortMethod(`ratingasc_${rating}`);
    setResponse(res.slice().sort((a, b) => {
      if ((a as any)[`${rating}average`] == null) {
        return -1;
      }
      return (b as any)[`${rating}average`] - (a as any)[`${rating}average`];
    }));
  }
}

//TODO: THIS WILL NOT WORK!!!! FIX THIS SO IT CONVERTS TO DATES BEFORE SORTING
export const sortListByDateSupabase = (date: string, res: Database['public']['Tables']['Completed']['Row'][], sortMethod: string, setSortMethod: Dispatch<SetStateAction<string>>, setResponse: Dispatch<SetStateAction<Database['public']['Tables']['Completed']['Row'][] | undefined>>) => {
  if (sortMethod === `dateasc_${date}`) {
    setSortMethod(`datedesc_${date}`)
    setResponse(res.slice().sort((a, b) => {
      return (b as any)[date] - (a as any)[date];
    }));
  } else {
    setSortMethod(`dateasc_${date}`);
    setResponse(res.slice().sort((a, b) => {
      return (a as any)[date] - (b as any)[date];
    }));
  }
}


//* PLAN TO WATCH LIST METHODS

export const sortListByNamePTW = (name: string, res: Array<PTWTItem>, sortMethod: string, setSortMethod: Dispatch<SetStateAction<string>>, setResponse: Dispatch<SetStateAction<PTWTItem[]>>) => {
  if (sortMethod === `titleasc_${name}`) {
    setSortMethod(`titledesc_${name}`)
    setResponse(res.slice().sort((a, b) => b.title!.localeCompare(a.title!)));
  } else {
    setSortMethod(`titleasc_${name}`);
    setResponse(res.slice().sort((a, b) => a.title!.localeCompare(b.title!)));
  }
}