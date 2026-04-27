// Real schema typing aligned with the live Supabase tables.
// `is_visible` replaces the old `status` enum for beats.
// `sales.method` and `sales.amount` are the exact column names.

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          created_at?: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
      }
      beats: {
        Row: {
          id: string
          title: string
          bpm: number
          category_id: string | null
          video_url: string | null
          audio_url: string | null
          is_visible: boolean
          release_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          bpm: number
          category_id?: string | null
          video_url?: string | null
          audio_url?: string | null
          is_visible?: boolean
          release_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          bpm?: number
          category_id?: string | null
          video_url?: string | null
          audio_url?: string | null
          is_visible?: boolean
          release_date?: string | null
          created_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          invoice_id: string
          status: string
          method: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          status?: string
          method: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          status?: string
          method?: string
          amount?: number
          created_at?: string
        }
      }
    }
  }
}
