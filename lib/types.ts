import { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { Database } from './database.types'

export type CompletedFields = 'title' | 'type' | 'episode' | 'rating1' | 'rating2' | 'startconv' | 'endconv'

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

export interface PTWRolledTableItemProps {
	props: {
		item: Database['public']['Tables']['PTW-Rolled']['Row']
		index: number
		isLoadingEditForm: string[]
		setIsEdited: (value: PTWEdited) => void
		isEdited: PTWEdited
		isEditedRef: MutableRefObject<string>
		sortMethodRef: MutableRefObject<string>
		setContextMenu: Dispatch<SetStateAction<{
			top: number
			left: number
			currentItem: Database['public']['Tables']['PTW-Rolled']['Row'] | null
		}>>
		contextMenuButtonRef: MutableRefObject<any>
		responseRolled: Database['public']['Tables']['PTW-Rolled']['Row'][] | undefined
		setResponseRolled: Dispatch<SetStateAction<Database['public']['Tables']['PTW-Rolled']['Row'][] | undefined>>
		setIsLoadingEditForm: Dispatch<SetStateAction<string[]>>
	}
	editFormParams: EditFormParams
}

export interface EditFormParams {
	isLoadingEditForm: string[]
	setIsLoadingEditForm: Dispatch<SetStateAction<string[]>>
	isEditedRef: MutableRefObject<string>
	setIsEdited: (value: PTWEdited) => void
	responseRolled: Database['public']['Tables']['PTW-Rolled']['Row'][] | undefined
	responseCasual: Database['public']['Tables']['PTW-Casual']['Row'][] | undefined
	responseNonCasual: Database['public']['Tables']['PTW-NonCasual']['Row'][] | undefined
	responseMovies: Database['public']['Tables']['PTW-Movies']['Row'][] | undefined
	setResponseRolled: Dispatch<SetStateAction<Database['public']['Tables']['PTW-Rolled']['Row'][] | undefined>>
	setResponseCasual: Dispatch<SetStateAction<Database['public']['Tables']['PTW-Casual']['Row'][] | undefined>>
	setResponseNonCasual: Dispatch<SetStateAction<Database['public']['Tables']['PTW-NonCasual']['Row'][] | undefined>>
	setResponseMovies: Dispatch<SetStateAction<Database['public']['Tables']['PTW-Movies']['Row'][] | undefined>>
}

export interface PTWItem {
	id: number
	title: string
}

export type PTWTables = "rolled" | "casual" | "noncasual" | "movies"

export type PTWEdited = `${PTWTables}_${string}_${number}` | ''

//* Seasonal /index page types
export type CurrentSeasonWithDetails = Database['public']['Tables']['PTW-CurrentSeason']['Row'] & { SeasonalDetails: Pick<Database['public']['Tables']['SeasonalDetails']['Row'], 'mal_id' | 'start_date' | 'latest_episode'>[] }

export type CurrentSeasonField = 'seasonal-title' | 'seasonal-status'

export type CurrentSeasonIsEdited = `${CurrentSeasonField}_${string}_${number}` | ''

export type CurrentSeasonIsLoading = `${CurrentSeasonField}_${number}`

export interface SeasonalTableItemProps { 
	props: {
		item: CurrentSeasonWithDetails
		index: number
		setIsLoadingEditForm: Dispatch<SetStateAction<CurrentSeasonIsLoading[]>>
		isLoadingEditForm: CurrentSeasonIsLoading[]
		setIsEdited: (value: CurrentSeasonIsEdited) => void
		isEdited: CurrentSeasonIsEdited
		isEditedRef: MutableRefObject<CurrentSeasonIsEdited>
		contextMenuButtonRef: MutableRefObject<any>
		setContextMenu: Dispatch<SetStateAction<{
			top: number
			left: number
			currentItem: CurrentSeasonWithDetails | null
		}>>
		response: CurrentSeasonWithDetails[] | undefined
		setResponse: Dispatch<SetStateAction<CurrentSeasonWithDetails[] | undefined>>
	}
}

//* Statistics page types
export interface StatTable {
	rating1Mean: number
	rating2Mean: number
	ratingMalMean: number
	rating1Median: number
	rating2Median: number
	ratingMalMedian: number
	rating1SD: number
	rating2SD: number
	ratingMalSD: number
	rating1Variance: number
	rating2Variance: number
	ratingMalVariance: number
	rating1MAD: number
	rating2MAD: number
	ratingMalMAD: number
	rating1MalCorrelation: number
	rating2MalCorrelation: number
	rating1rating2Correlation: number
	rating1MalCovariance: number
	rating2MalCovariance: number
	rating1rating2Covariance: number
}

export interface StatisticsProps {
	titleCount: number
	totalEpisodes: number
	totalEpisodesWatched: number
	totalTimeWatched: number
	typeFreq: { [key: string]: number }
	genreFreq: { id: number; name: string | null; count: number }[]
	genreByRating: GenreByRatingData[]
	titleByRatingDiff: DifferenceRatingData[]
	rating1FreqArr: Array<{ [key: number]: number }>
	rating2FreqArr: Array<{ [key: number]: number }>
	ratingMalFreqArr: Array<{ [key: number]: number }>
	dateRatingData: {
		id: number
		title: string
		rating1average: number | null
		rating2average: number | null
		malRating: number | null
		broadcastDate: string | null
		endWatchDate: number | null
	}[]
	ratingStatTable: StatTable
}

export interface GenreByRatingData {
	id: number
	name: string
	rating1mean: number
	rating2mean: number
	rating1median: number | null
	rating2median: number | null
	titlecount: number
}

export interface DifferenceRatingData {
	id: number
	title: string | null
	rating1average: number | null
	rating2average: number | null
	rating1MalDiff: number
	rating2MalDiff: number
	rating1rating2Diff: number
}