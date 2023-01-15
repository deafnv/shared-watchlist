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
        }
        Insert: {
          end?: string | null
          endconv?: number | null
          episode?: string | null
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
        }
        Update: {
          end?: string | null
          endconv?: number | null
          episode?: string | null
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
        }
      }
      "PTW Casual": {
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
      "PTW Current Season": {
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
      "PTW Movies": {
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
      "PTW Non Casual": {
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
      "PTW Rolled": {
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
