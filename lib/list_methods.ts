import { Dispatch, MutableRefObject, SetStateAction } from 'react'
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
	end: { original: undefined, converted: undefined }
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

export const sortSymbol = (type: string, sortMethodRef: MutableRefObject<string>) => {
	if (sortMethodRef.current.includes(type)) {
		return sortMethodRef.current.includes(`asc_${type}`) ? '▲' : '▼'
	} else {
		return ''
	}
}

//* SUPABASE LIST METHODS

export const initialTitleItemSupabase = {
	end: '',
	episode: '',
	episode_actual: 0,
	episode_total: 0,
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
	type_conv: [''],
	startconv: 0,
	endconv: 0
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
	sortMethodRef: MutableRefObject<string>,
	setResponse: Dispatch<
		SetStateAction<Database['public']['Tables']['Completed']['Row'][] | undefined>
	>
) => {
	if (sortMethodRef.current === `asc_title`) {
		sortMethodRef.current = 'desc_title'
		setResponse(res?.slice().sort((a, b) => a.title!.localeCompare(b.title!)))
	} else {
		sortMethodRef.current = 'asc_title'
		setResponse(res?.slice().sort((a, b) => b.title!.localeCompare(a.title!)))
	}
}

export const sortListByTypeSupabase = (
	res: Database['public']['Tables']['Completed']['Row'][] | undefined,
	sortMethodRef: MutableRefObject<string>,
	setResponse: Dispatch<
		SetStateAction<Database['public']['Tables']['Completed']['Row'][] | undefined>
	>
) => {
	if (sortMethodRef.current === `asc_type`) {
		sortMethodRef.current = 'desc_type'
		setResponse(res?.slice().sort((a, b) => a.type!.localeCompare(b.type!)))
	} else {
		sortMethodRef.current = 'asc_type'
		setResponse(res?.slice().sort((a, b) => b.type!.localeCompare(a.type!)))
	}
}

export const sortListByEpisodeSupabase = (
	res: Database['public']['Tables']['Completed']['Row'][] | undefined,
	sortMethodRef: MutableRefObject<string>,
	setResponse: Dispatch<
		SetStateAction<Database['public']['Tables']['Completed']['Row'][] | undefined>
	>
) => {
	if (sortMethodRef.current === `desc_episode`) {
		sortMethodRef.current = `asc_episode`
		setResponse(
			res?.slice().sort((a, b) => {
				if (a.episode_actual == null) {
					return -1
				}
				return a.episode_actual! - b.episode_actual!
			})
		)
	} else {
		sortMethodRef.current = `desc_episode`
		setResponse(
			res?.slice().sort((a, b) => {
				if (b.episode_actual == null) {
					return -1
				}
				return b.episode_actual! - a.episode_actual!
			})
		)
	}
}

export const sortListByRatingSupabase = (
	rating: 'rating1' | 'rating2',
	res: Database['public']['Tables']['Completed']['Row'][] | undefined,
	sortMethodRef: MutableRefObject<string>,
	setResponse: Dispatch<
		SetStateAction<Database['public']['Tables']['Completed']['Row'][] | undefined>
	>
) => {
	if (sortMethodRef.current === `ratingdesc_${rating}`) {
		sortMethodRef.current = `ratingasc_${rating}`
		setResponse(
			res?.slice().sort((a, b) => {
				if (a[`${rating}average`] == null) {
					return -1
				}
				return a[`${rating}average`]! - b[`${rating}average`]!
			})
		)
	} else {
		sortMethodRef.current = `ratingdesc_${rating}`
		setResponse(
			res?.slice().sort((a, b) => {
				if (b[`${rating}average`] == null) {
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
	sortMethodRef: MutableRefObject<string>,
	setResponse: Dispatch<
		SetStateAction<Database['public']['Tables']['Completed']['Row'][] | undefined>
	>
) => {
	if (sortMethodRef.current === `dateasc_${date}`) {
		sortMethodRef.current = `datedesc_${date}`
		setResponse(
			res?.slice().sort((a, b) => {
				return b[date]! - a[date]!
			})
		)
	} else {
		sortMethodRef.current = `dateasc_${date}`
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
	sortMethodRef: MutableRefObject<string>,
	setResponse: Dispatch<
		SetStateAction<Database['public']['Tables']['PTW-Rolled']['Row'][] | undefined>
	>
) => {
	if (sortMethodRef.current === `titleasc_${name}`) {
		sortMethodRef.current = `titledesc_${name}`
		setResponse(res?.slice().sort((a, b) => b.title!.localeCompare(a.title!)))
	} else {
		sortMethodRef.current = `titleasc_${name}`
		setResponse(res?.slice().sort((a, b) => a.title!.localeCompare(b.title!)))
	}
}

export function levenshtein(s: string, t: string) {
	if (s === t) {
		return 0
	}
	var n = s.length,
		m = t.length
	if (n === 0 || m === 0) {
		return n + m
	}
	var x = 0,
		y,
		a,
		b,
		c,
		d,
		g,
		h
	var p = new Uint16Array(n)
	var u = new Uint32Array(n)
	for (y = 0; y < n; ) {
		u[y] = s.charCodeAt(y)
		p[y] = ++y
	}

	for (; x + 3 < m; x += 4) {
		var e1 = t.charCodeAt(x)
		var e2 = t.charCodeAt(x + 1)
		var e3 = t.charCodeAt(x + 2)
		var e4 = t.charCodeAt(x + 3)
		c = x
		b = x + 1
		d = x + 2
		g = x + 3
		h = x + 4
		for (y = 0; y < n; y++) {
			a = p[y]
			if (a < c || b < c) {
				c = a > b ? b + 1 : a + 1
			} else {
				if (e1 !== u[y]) {
					c++
				}
			}

			if (c < b || d < b) {
				b = c > d ? d + 1 : c + 1
			} else {
				if (e2 !== u[y]) {
					b++
				}
			}

			if (b < d || g < d) {
				d = b > g ? g + 1 : b + 1
			} else {
				if (e3 !== u[y]) {
					d++
				}
			}

			if (d < g || h < g) {
				g = d > h ? h + 1 : d + 1
			} else {
				if (e4 !== u[y]) {
					g++
				}
			}
			p[y] = h = g
			g = d
			d = b
			b = c
			c = a
		}
	}

	for (; x < m; ) {
		var e = t.charCodeAt(x)
		c = x
		d = ++x
		for (y = 0; y < n; y++) {
			a = p[y]
			if (a < c || d < c) {
				d = a > d ? d + 1 : a + 1
			} else {
				if (e !== u[y]) {
					d = c + 1
				} else {
					d = c
				}
			}
			p[y] = d
			c = a
		}
		h = d
	}

	return h
}
