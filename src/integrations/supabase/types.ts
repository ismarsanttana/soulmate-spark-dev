export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          app_name: string
          icon_url: string | null
          id: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          app_name?: string
          icon_url?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          app_name?: string
          icon_url?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          cpf: string
          created_at: string
          full_name: string
          id: string
          notes: string | null
          phone: string
          preferred_date: string
          preferred_time: string
          secretaria_slug: string | null
          specialty: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cpf: string
          created_at?: string
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          preferred_date: string
          preferred_time: string
          secretaria_slug?: string | null
          specialty: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cpf?: string
          created_at?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          preferred_date?: string
          preferred_time?: string
          secretaria_slug?: string | null
          specialty?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_secretaria_slug_fkey"
            columns: ["secretaria_slug"]
            isOneToOne: false
            referencedRelation: "secretarias"
            referencedColumns: ["slug"]
          },
        ]
      }
      appointments_audit: {
        Row: {
          accessed_at: string
          action: string
          appointment_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          action: string
          appointment_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          action?: string
          appointment_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      campaign_banners: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_type: string
          end_date: string | null
          id: string
          image_url: string
          is_active: boolean
          link: string | null
          secretaria_slug: string | null
          start_date: string
          target_audience: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_type?: string
          end_date?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link?: string | null
          secretaria_slug?: string | null
          start_date?: string
          target_audience?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_type?: string
          end_date?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link?: string | null
          secretaria_slug?: string | null
          start_date?: string
          target_audience?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_banners_secretaria_slug_fkey"
            columns: ["secretaria_slug"]
            isOneToOne: false
            referencedRelation: "secretarias"
            referencedColumns: ["slug"]
          },
        ]
      }
      city_agenda: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_date: string
          id: string
          image_url: string | null
          location: string | null
          secretaria_slug: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          location?: string | null
          secretaria_slug?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          location?: string | null
          secretaria_slug?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_agenda_secretaria_slug_fkey"
            columns: ["secretaria_slug"]
            isOneToOne: false
            referencedRelation: "secretarias"
            referencedColumns: ["slug"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string
          event_date: string
          event_time: string | null
          id: string
          location: string
          status: Database["public"]["Enums"]["content_status"] | null
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          event_date: string
          event_time?: string | null
          id?: string
          location: string
          status?: Database["public"]["Enums"]["content_status"] | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          event_date?: string
          event_time?: string | null
          id?: string
          location?: string
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string
        }
        Relationships: []
      }
      gallery: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string
          secretaria_slug: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url: string
          secretaria_slug?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string
          secretaria_slug?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_secretaria_slug_fkey"
            columns: ["secretaria_slug"]
            isOneToOne: false
            referencedRelation: "secretarias"
            referencedColumns: ["slug"]
          },
        ]
      }
      live_streams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ended_at: string | null
          id: string
          scheduled_at: string
          secretaria_slug: string | null
          started_at: string | null
          status: string
          stream_url: string
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          scheduled_at: string
          secretaria_slug?: string | null
          started_at?: string | null
          status?: string
          stream_url: string
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          scheduled_at?: string
          secretaria_slug?: string | null
          started_at?: string | null
          status?: string
          stream_url?: string
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_secretaria_slug_fkey"
            columns: ["secretaria_slug"]
            isOneToOne: false
            referencedRelation: "secretarias"
            referencedColumns: ["slug"]
          },
        ]
      }
      news: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          published_at: string
          status: Database["public"]["Enums"]["content_status"] | null
          summary: string
          title: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string
          status?: Database["public"]["Enums"]["content_status"] | null
          summary: string
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string
          status?: Database["public"]["Enums"]["content_status"] | null
          summary?: string
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          notification_type: string | null
          read: boolean
          sent_by: string | null
          target_audience: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          notification_type?: string | null
          read?: boolean
          sent_by?: string | null
          target_audience?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          notification_type?: string | null
          read?: boolean
          sent_by?: string | null
          target_audience?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ombudsman_protocols: {
        Row: {
          category: string
          created_at: string
          description: string
          email: string | null
          full_name: string
          id: string
          manifestation_type: Database["public"]["Enums"]["manifestation_type"]
          protocol_number: string
          response: string | null
          status: Database["public"]["Enums"]["protocol_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          email?: string | null
          full_name: string
          id?: string
          manifestation_type: Database["public"]["Enums"]["manifestation_type"]
          protocol_number: string
          response?: string | null
          status?: Database["public"]["Enums"]["protocol_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          email?: string | null
          full_name?: string
          id?: string
          manifestation_type?: Database["public"]["Enums"]["manifestation_type"]
          protocol_number?: string
          response?: string | null
          status?: Database["public"]["Enums"]["protocol_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      podcasts: {
        Row: {
          audio_url: string
          category: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration: number | null
          id: string
          published_at: string
          secretaria_slug: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          title: string
        }
        Insert: {
          audio_url: string
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          published_at?: string
          secretaria_slug?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title: string
        }
        Update: {
          audio_url?: string
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          published_at?: string
          secretaria_slug?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "podcasts_secretaria_slug_fkey"
            columns: ["secretaria_slug"]
            isOneToOne: false
            referencedRelation: "secretarias"
            referencedColumns: ["slug"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          email: string | null
          full_name: string
          gender: string | null
          id: string
          lgbtqiapn: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          gender?: string | null
          id: string
          lgbtqiapn?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          lgbtqiapn?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      secretarias: {
        Row: {
          address: string | null
          business_hours: string | null
          color: string
          created_at: string
          description: string | null
          email: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_hours?: string | null
          color?: string
          created_at?: string
          description?: string | null
          email?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_hours?: string | null
          color?: string
          created_at?: string
          description?: string | null
          email?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      secretary_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          secretaria_slug: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          secretaria_slug: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          secretaria_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          created_at: string
          created_by: string | null
          duration: number
          expires_at: string
          id: string
          link: string | null
          media_type: string
          media_url: string
          secretaria_slug: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration?: number
          expires_at?: string
          id?: string
          link?: string | null
          media_type: string
          media_url: string
          secretaria_slug?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration?: number
          expires_at?: string
          id?: string
          link?: string | null
          media_type?: string
          media_url?: string
          secretaria_slug?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_secretaria_slug_fkey"
            columns: ["secretaria_slug"]
            isOneToOne: false
            referencedRelation: "secretarias"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "prefeito" | "secretario"
      content_status: "draft" | "pending" | "published"
      manifestation_type: "denuncia" | "sugestao" | "elogio" | "reclamacao"
      protocol_status: "aberto" | "em_andamento" | "encerrado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "prefeito", "secretario"],
      content_status: ["draft", "pending", "published"],
      manifestation_type: ["denuncia", "sugestao", "elogio", "reclamacao"],
      protocol_status: ["aberto", "em_andamento", "encerrado"],
    },
  },
} as const
