export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      Completed: {
        Row: {
          end: string | null
          endconv: number | null
          episode: string | null
          episode_actual: number | null
          episode_total: number | null
          id: number
          notes: string | null
          rating1: string | null
          rating1average: number | null
          rating2: string | null
          rating2average: number | null
          rating3: string | null
          rating3average: number | null
          start: string | null
          startconv: number | null
          title: string | null
          type: string | null
          type_conv: string[] | null
        }
        Insert: {
          end?: string | null
          endconv?: number | null
          episode?: string | null
          episode_actual?: number | null
          episode_total?: number | null
          id?: number
          notes?: string | null
          rating1?: string | null
          rating1average?: number | null
          rating2?: string | null
          rating2average?: number | null
          rating3?: string | null
          rating3average?: number | null
          start?: string | null
          startconv?: number | null
          title?: string | null
          type?: string | null
          type_conv?: string[] | null
        }
        Update: {
          end?: string | null
          endconv?: number | null
          episode?: string | null
          episode_actual?: number | null
          episode_total?: number | null
          id?: number
          notes?: string | null
          rating1?: string | null
          rating1average?: number | null
          rating2?: string | null
          rating2average?: number | null
          rating3?: string | null
          rating3average?: number | null
          start?: string | null
          startconv?: number | null
          title?: string | null
          type?: string | null
          type_conv?: string[] | null
        }
      }
      CompletedDetails: {
        Row: {
          average_episode_duration: number | null
          end_date: string | null
          id: number
          image_url: string | null
          mal_alternative_title: string | null
          mal_id: number | null
          mal_synopsis: string | null
          mal_title: string | null
          start_date: string | null
        }
        Insert: {
          average_episode_duration?: number | null
          end_date?: string | null
          id?: number
          image_url?: string | null
          mal_alternative_title?: string | null
          mal_id?: number | null
          mal_synopsis?: string | null
          mal_title?: string | null
          start_date?: string | null
        }
        Update: {
          average_episode_duration?: number | null
          end_date?: string | null
          id?: number
          image_url?: string | null
          mal_alternative_title?: string | null
          mal_id?: number | null
          mal_synopsis?: string | null
          mal_title?: string | null
          start_date?: string | null
        }
      }
      Genre_to_Titles: {
        Row: {
          anime_id: number
          genre_id: number
          id: number
        }
        Insert: {
          anime_id: number
          genre_id: number
          id: number
        }
        Update: {
          anime_id?: number
          genre_id?: number
          id?: number
        }
      }
      Genres: {
        Row: {
          id: number
          name: string | null
        }
        Insert: {
          id?: number
          name?: string | null
        }
        Update: {
          id?: number
          name?: string | null
        }
      }
      "PTW-Casual": {
        Row: {
          id: number
          title: string | null
        }
        Insert: {
          id?: number
          title?: string | null
        }
        Update: {
          id?: number
          title?: string | null
        }
      }
      "PTW-CurrentSeason": {
        Row: {
          id: number
          status: string | null
          title: string | null
        }
        Insert: {
          id?: number
          status?: string | null
          title?: string | null
        }
        Update: {
          id?: number
          status?: string | null
          title?: string | null
        }
      }
      "PTW-Movies": {
        Row: {
          id: number
          title: string | null
        }
        Insert: {
          id?: number
          title?: string | null
        }
        Update: {
          id?: number
          title?: string | null
        }
      }
      "PTW-NonCasual": {
        Row: {
          id: number
          title: string | null
        }
        Insert: {
          id?: number
          title?: string | null
        }
        Update: {
          id?: number
          title?: string | null
        }
      }
      "PTW-Rolled": {
        Row: {
          id: number
          status: string | null
          title: string | null
        }
        Insert: {
          id?: number
          status?: string | null
          title?: string | null
        }
        Update: {
          id?: number
          status?: string | null
          title?: string | null
        }
      }
      RealtimeData: {
        Row: {
          content: string | null
          id: number
          name: string | null
        }
        Insert: {
          content?: string | null
          id?: number
          name?: string | null
        }
        Update: {
          content?: string | null
          id?: number
          name?: string | null
        }
      }
      SeasonalDetails: {
        Row: {
          broadcast: string | null
          id: number
          image_url: string | null
          latest_episode: number | null
          mal_id: number
          message: string | null
          num_episodes: number | null
          start_date: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          broadcast?: string | null
          id?: number
          image_url?: string | null
          latest_episode?: number | null
          mal_id?: number
          message?: string | null
          num_episodes?: number | null
          start_date?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          broadcast?: string | null
          id?: number
          image_url?: string | null
          latest_episode?: number | null
          mal_id?: number
          message?: string | null
          num_episodes?: number | null
          start_date?: string | null
          status?: string | null
          title?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
