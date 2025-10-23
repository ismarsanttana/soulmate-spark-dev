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
          specialty?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      events: {
        Row: {
          created_at: string
          description: string
          event_date: string
          event_time: string | null
          id: string
          location: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          event_date: string
          event_time?: string | null
          id?: string
          location: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          event_date?: string
          event_time?: string | null
          id?: string
          location?: string
          title?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          published_at: string
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
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
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
      manifestation_type: ["denuncia", "sugestao", "elogio", "reclamacao"],
      protocol_status: ["aberto", "em_andamento", "encerrado"],
    },
  },
} as const
