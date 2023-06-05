import { Dispatch, MutableRefObject, SetStateAction } from 'react'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { Database } from './database.types'
import { CompletedFields, TitleItem } from '@/lib/types'
import { Completed, PTWRolled } from '@prisma/client'

export function getRandomInt(max: number) {
	return Math.floor(Math.random() * max)
}

//* COMPLETED LIST METHODS
export const initialTitleItemCompleted = {
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

export function SortSymbol({
	type,
	sortMethodRef
}: {
	type: CompletedFields
	sortMethodRef: MutableRefObject<`${'asc' | 'desc'}_${CompletedFields}` | ''> 
}) {
	if (sortMethodRef.current.includes(type)) {
		if (sortMethodRef.current.includes(`asc_${type}`)) {
			return (
				<span className="absolute -right-5">
					<ArrowDropDownIcon />
				</span>
			)
		} else {
			return (
				<span className="absolute -right-5">
					<ArrowDropDownIcon style={{ rotate: '180deg' }} />
				</span>
			)
		}
	} else {
		return null
	}
}

export const sortListByNameCompleted = (
	res: Completed[] | undefined,
	sortMethodRef: MutableRefObject<`${'asc' | 'desc'}_${CompletedFields}` | ''>,
	setResponse: Dispatch<SetStateAction<Completed[] | undefined>>
) => {
	if (sortMethodRef.current === `desc_title`) {
		sortMethodRef.current = 'asc_title'
		setResponse(res?.slice().sort((a, b) => b.title!.localeCompare(a.title!)))
	} else {
		sortMethodRef.current = 'desc_title'
		setResponse(res?.slice().sort((a, b) => a.title!.localeCompare(b.title!)))
	}
}

export const sortListByTypeCompleted = (
	res: Completed[] | undefined,
	sortMethodRef: MutableRefObject<`${'asc' | 'desc'}_${CompletedFields}` | ''>,
	setResponse: Dispatch<SetStateAction<Completed[] | undefined>>
) => {
	if (sortMethodRef.current === `desc_type`) {
		sortMethodRef.current = 'asc_type'
		setResponse(res?.slice().sort((a, b) => b.type!.localeCompare(a.type!)))
	} else {
		sortMethodRef.current = 'desc_type'
		setResponse(res?.slice().sort((a, b) => a.type!.localeCompare(b.type!)))
	}
}

export const sortListByEpisodeCompleted = (
	res: Completed[] | undefined,
	sortMethodRef: MutableRefObject<`${'asc' | 'desc'}_${CompletedFields}` | ''>,
	setResponse: Dispatch<SetStateAction<Completed[] | undefined>>
) => {
	if (sortMethodRef.current === `desc_episode`) {
		sortMethodRef.current = `asc_episode`
		setResponse(
			res?.slice().sort((a, b) => {
				if (b.episode_actual == null) {
					return -1
				}
				return b.episode_actual! - a.episode_actual!
			})
		)
	} else {
		sortMethodRef.current = `desc_episode`
		setResponse(
			res?.slice().sort((a, b) => {
				if (a.episode_actual == null) {
					return -1
				}
				return a.episode_actual! - b.episode_actual!
			})
		)
	}
}

export const sortListByRatingCompleted = (
	rating: 'rating1' | 'rating2',
	res: Completed[] | undefined,
	sortMethodRef: MutableRefObject<`${'asc' | 'desc'}_${CompletedFields}` | ''>,
	setResponse: Dispatch<SetStateAction<Completed[] | undefined>>
) => {
	if (sortMethodRef.current === `asc_${rating}`) {
		sortMethodRef.current = `desc_${rating}`
		setResponse(
			res?.slice().sort((a, b) => {
				if (a[`${rating}average`] == null) {
					return -1
				}
				return a[`${rating}average`]! - b[`${rating}average`]!
			})
		)
	} else {
		sortMethodRef.current = `asc_${rating}`
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

export const sortListByDateCompleted = (
	date: 'startconv' | 'endconv',
	res: Completed[] | undefined,
	sortMethodRef: MutableRefObject<`${'asc' | 'desc'}_${CompletedFields}` | ''>,
	setResponse: Dispatch<SetStateAction<Completed[] | undefined>>
) => {
	//* date == 'startconv' ? 'start' : 'end' is a workaround for conflicting types
	if (sortMethodRef.current === `desc_${date == 'startconv' ? 'start' : 'end'}`) {
		sortMethodRef.current = `asc_${date == 'startconv' ? 'start' : 'end'}`
		setResponse(
			res?.slice().sort((a, b) => {
				return b[date]!.localeCompare(a[date]!)
			})
		)
	} else {
		sortMethodRef.current = `desc_${date == 'startconv' ? 'start' : 'end'}`
		setResponse(
			res?.slice().sort((a, b) => {
				return a[date]!.localeCompare(b[date]!)
			})
		)
	}
}

//* PLAN TO WATCH LIST METHODS

export type PTWRolledFields = 'title'

export const sortListByTitlePTW = (
	res: PTWRolled[] | undefined,
	sortMethodRef: MutableRefObject<`${'asc' | 'desc'}_${PTWRolledFields}` | ''>,
	setResponse: Dispatch<SetStateAction<PTWRolled[] | undefined>>
) => {
	if (!res) return
	if (sortMethodRef.current === `desc_title`) {
		sortMethodRef.current = `asc_title`
		setResponse(res.slice().sort((a, b) => b.title!.localeCompare(a.title!)))
	} else {
		sortMethodRef.current = `desc_title`
		setResponse(res.slice().sort((a, b) => a.title!.localeCompare(b.title!)))
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
