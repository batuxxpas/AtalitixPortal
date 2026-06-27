export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'company_admin' | 'company_user'
export type AssessmentStatus = 'draft' | 'in_progress' | 'completed' | 'archived'
export type QuestionType = 'single_choice' | 'multiple_choice' | 'scale' | 'text'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          company_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          company_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          industry: string | null
          size: string | null
          country: string | null
          city: string | null
          website: string | null
          logo_url: string | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          industry?: string | null
          size?: string | null
          country?: string | null
          city?: string | null
          website?: string | null
          logo_url?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          industry?: string | null
          size?: string | null
          country?: string | null
          city?: string | null
          website?: string | null
          logo_url?: string | null
          description?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      question_categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          order_index: number
          weight: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          order_index?: number
          weight?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          order_index?: number
          weight?: number
          is_active?: boolean
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          category_id: string
          text: string
          description: string | null
          type: QuestionType
          weight: number
          order_index: number
          is_required: boolean
          is_active: boolean
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          text: string
          description?: string | null
          type?: QuestionType
          weight?: number
          order_index?: number
          is_required?: boolean
          is_active?: boolean
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          text?: string
          description?: string | null
          type?: QuestionType
          weight?: number
          order_index?: number
          is_required?: boolean
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      question_options: {
        Row: {
          id: string
          question_id: string
          text: string
          value: number
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          text: string
          value: number
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          text?: string
          value?: number
          order_index?: number
        }
        Relationships: []
      }
      assessments: {
        Row: {
          id: string
          company_id: string
          created_by: string
          title: string
          status: AssessmentStatus
          started_at: string | null
          completed_at: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          created_by: string
          title?: string
          status?: AssessmentStatus
          started_at?: string | null
          completed_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          created_by?: string
          title?: string
          status?: AssessmentStatus
          started_at?: string | null
          completed_at?: string | null
          metadata?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      assessment_answers: {
        Row: {
          id: string
          assessment_id: string
          question_id: string
          option_ids: string[] | null
          text_answer: string | null
          numeric_answer: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          question_id: string
          option_ids?: string[] | null
          text_answer?: string | null
          numeric_answer?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          question_id?: string
          option_ids?: string[] | null
          text_answer?: string | null
          numeric_answer?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      erp_solutions: {
        Row: {
          id: string
          name: string
          slug: string
          vendor: string
          description: string | null
          logo_url: string | null
          website: string | null
          tier: string | null
          suitable_for_sizes: string[] | null
          suitable_for_industries: string[] | null
          features: Json | null
          pricing_model: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          vendor: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          tier?: string | null
          suitable_for_sizes?: string[] | null
          suitable_for_industries?: string[] | null
          features?: Json | null
          pricing_model?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          vendor?: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          tier?: string | null
          suitable_for_sizes?: string[] | null
          suitable_for_industries?: string[] | null
          features?: Json | null
          pricing_model?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      assessment_results: {
        Row: {
          id: string
          assessment_id: string
          total_score: number
          category_scores: Json
          recommended_solutions: Json
          analysis_summary: string | null
          generated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          total_score: number
          category_scores: Json
          recommended_solutions: Json
          analysis_summary?: string | null
          generated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          total_score?: number
          category_scores?: Json
          recommended_solutions?: Json
          analysis_summary?: string | null
          generated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      assessment_status: AssessmentStatus
      question_type: QuestionType
    }
    CompositeTypes: Record<string, never>
  }
}
