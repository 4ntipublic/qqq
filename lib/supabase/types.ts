
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
          size_mb: number | null
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
          size_mb?: number | null
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
          size_mb?: number | null
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
