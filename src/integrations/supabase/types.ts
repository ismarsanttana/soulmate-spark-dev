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
      advertising_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          secretaria_slug: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          secretaria_slug: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          secretaria_slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
      attendance_queue: {
        Row: {
          called_at: string | null
          completed_at: string | null
          created_at: string
          full_name: string
          id: string
          location: string | null
          position: number | null
          priority: number | null
          secretaria_slug: string
          service_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          full_name: string
          id?: string
          location?: string | null
          position?: number | null
          priority?: number | null
          secretaria_slug: string
          service_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          full_name?: string
          id?: string
          location?: string | null
          position?: number | null
          priority?: number | null
          secretaria_slug?: string
          service_type?: string
          status?: string
          updated_at?: string
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
      employee_absences: {
        Row: {
          absence_date: string
          absence_type: string
          attachment_url: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          is_justified: boolean | null
          justification: string | null
          updated_at: string
        }
        Insert: {
          absence_date: string
          absence_type: string
          attachment_url?: string | null
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          is_justified?: boolean | null
          justification?: string | null
          updated_at?: string
        }
        Update: {
          absence_date?: string
          absence_type?: string
          attachment_url?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          is_justified?: boolean | null
          justification?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_absences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "secretaria_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_timeclock: {
        Row: {
          approved_by: string | null
          clock_in: string
          clock_out: string | null
          created_at: string
          employee_id: string
          id: string
          location: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          clock_in: string
          clock_out?: string | null
          created_at?: string
          employee_id: string
          id?: string
          location?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          location?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_timeclock_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "secretaria_employees"
            referencedColumns: ["id"]
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
          alergias: string | null
          autorizacao_busca_medica: boolean | null
          autorizacao_uso_imagem: boolean | null
          avatar_url: string | null
          birth_date: string | null
          cartao_sus: string | null
          certidao_nascimento: string | null
          cpf: string | null
          created_at: string
          doc_certidao_url: string | null
          doc_comprovante_residencia_url: string | null
          doc_cpf_url: string | null
          doc_foto_url: string | null
          doc_guarda_tutela_url: string | null
          doc_historico_escolar_url: string | null
          doc_rg_url: string | null
          doc_vacinacao_url: string | null
          email: string | null
          endereco_completo: string | null
          endereco_transporte: string | null
          full_name: string
          gender: string | null
          id: string
          laudo_aee_url: string | null
          lgbtqiapn: boolean | null
          medicacoes_continuas: string | null
          nacionalidade: string | null
          naturalidade: string | null
          necessidades_especiais: string | null
          nis: string | null
          ponto_embarque: string | null
          restricoes_alimentares: string | null
          rg: string | null
          telefone: string | null
          telefone_emergencia: string | null
          updated_at: string
          usa_transporte_escolar: boolean | null
        }
        Insert: {
          alergias?: string | null
          autorizacao_busca_medica?: boolean | null
          autorizacao_uso_imagem?: boolean | null
          avatar_url?: string | null
          birth_date?: string | null
          cartao_sus?: string | null
          certidao_nascimento?: string | null
          cpf?: string | null
          created_at?: string
          doc_certidao_url?: string | null
          doc_comprovante_residencia_url?: string | null
          doc_cpf_url?: string | null
          doc_foto_url?: string | null
          doc_guarda_tutela_url?: string | null
          doc_historico_escolar_url?: string | null
          doc_rg_url?: string | null
          doc_vacinacao_url?: string | null
          email?: string | null
          endereco_completo?: string | null
          endereco_transporte?: string | null
          full_name: string
          gender?: string | null
          id: string
          laudo_aee_url?: string | null
          lgbtqiapn?: boolean | null
          medicacoes_continuas?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          necessidades_especiais?: string | null
          nis?: string | null
          ponto_embarque?: string | null
          restricoes_alimentares?: string | null
          rg?: string | null
          telefone?: string | null
          telefone_emergencia?: string | null
          updated_at?: string
          usa_transporte_escolar?: boolean | null
        }
        Update: {
          alergias?: string | null
          autorizacao_busca_medica?: boolean | null
          autorizacao_uso_imagem?: boolean | null
          avatar_url?: string | null
          birth_date?: string | null
          cartao_sus?: string | null
          certidao_nascimento?: string | null
          cpf?: string | null
          created_at?: string
          doc_certidao_url?: string | null
          doc_comprovante_residencia_url?: string | null
          doc_cpf_url?: string | null
          doc_foto_url?: string | null
          doc_guarda_tutela_url?: string | null
          doc_historico_escolar_url?: string | null
          doc_rg_url?: string | null
          doc_vacinacao_url?: string | null
          email?: string | null
          endereco_completo?: string | null
          endereco_transporte?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          laudo_aee_url?: string | null
          lgbtqiapn?: boolean | null
          medicacoes_continuas?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          necessidades_especiais?: string | null
          nis?: string | null
          ponto_embarque?: string | null
          restricoes_alimentares?: string | null
          rg?: string | null
          telefone?: string | null
          telefone_emergencia?: string | null
          updated_at?: string
          usa_transporte_escolar?: boolean | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          permissions: Json | null
          role_name: string
          secretaria_slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role_name: string
          secretaria_slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role_name?: string
          secretaria_slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_secretaria_slug_fkey"
            columns: ["secretaria_slug"]
            isOneToOne: false
            referencedRelation: "secretarias"
            referencedColumns: ["slug"]
          },
        ]
      }
      school_classes: {
        Row: {
          class_name: string
          created_at: string
          created_by: string | null
          grade_level: string
          id: string
          max_students: number | null
          school_name: string | null
          school_year: string
          shift: string | null
          status: string | null
          teacher_user_id: string | null
          updated_at: string
        }
        Insert: {
          class_name: string
          created_at?: string
          created_by?: string | null
          grade_level: string
          id?: string
          max_students?: number | null
          school_name?: string | null
          school_year: string
          shift?: string | null
          status?: string | null
          teacher_user_id?: string | null
          updated_at?: string
        }
        Update: {
          class_name?: string
          created_at?: string
          created_by?: string | null
          grade_level?: string
          id?: string
          max_students?: number | null
          school_name?: string | null
          school_year?: string
          shift?: string | null
          status?: string | null
          teacher_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      secretaria_employees: {
        Row: {
          address: string | null
          area: string | null
          ato_nomeacao_arquivo_url: string | null
          ato_nomeacao_data: string | null
          ato_nomeacao_numero: string | null
          birth_date: string | null
          cargo: string | null
          chefe_imediato: string | null
          cpf: string
          created_at: string
          created_by: string | null
          data_exercicio: string | null
          email: string | null
          equipamentos: Json | null
          full_name: string
          funcao: string
          id: string
          jornada: string | null
          lotacao: string | null
          matricula: string
          phone: string | null
          regime_juridico: string | null
          salario: number | null
          secretaria_slug: string
          situacao: string | null
          termo_lgpd_arquivo_url: string | null
          termo_lgpd_assinado: boolean | null
          termo_responsabilidade_arquivo_url: string | null
          termo_responsabilidade_assinado: boolean | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          ato_nomeacao_arquivo_url?: string | null
          ato_nomeacao_data?: string | null
          ato_nomeacao_numero?: string | null
          birth_date?: string | null
          cargo?: string | null
          chefe_imediato?: string | null
          cpf: string
          created_at?: string
          created_by?: string | null
          data_exercicio?: string | null
          email?: string | null
          equipamentos?: Json | null
          full_name: string
          funcao: string
          id?: string
          jornada?: string | null
          lotacao?: string | null
          matricula: string
          phone?: string | null
          regime_juridico?: string | null
          salario?: number | null
          secretaria_slug: string
          situacao?: string | null
          termo_lgpd_arquivo_url?: string | null
          termo_lgpd_assinado?: boolean | null
          termo_responsabilidade_arquivo_url?: string | null
          termo_responsabilidade_assinado?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          ato_nomeacao_arquivo_url?: string | null
          ato_nomeacao_data?: string | null
          ato_nomeacao_numero?: string | null
          birth_date?: string | null
          cargo?: string | null
          chefe_imediato?: string | null
          cpf?: string
          created_at?: string
          created_by?: string | null
          data_exercicio?: string | null
          email?: string | null
          equipamentos?: Json | null
          full_name?: string
          funcao?: string
          id?: string
          jornada?: string | null
          lotacao?: string | null
          matricula?: string
          phone?: string | null
          regime_juridico?: string | null
          salario?: number | null
          secretaria_slug?: string
          situacao?: string | null
          termo_lgpd_arquivo_url?: string | null
          termo_lgpd_assinado?: boolean | null
          termo_responsabilidade_arquivo_url?: string | null
          termo_responsabilidade_assinado?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secretaria_employees_secretaria_slug_fkey"
            columns: ["secretaria_slug"]
            isOneToOne: false
            referencedRelation: "secretarias"
            referencedColumns: ["slug"]
          },
        ]
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
      secretary_requests: {
        Row: {
          created_at: string
          description: string
          from_secretary_slug: string
          from_user_id: string
          id: string
          priority: string
          responded_at: string | null
          responded_by: string | null
          response: string | null
          status: string
          title: string
          to_secretary_slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          from_secretary_slug: string
          from_user_id: string
          id?: string
          priority?: string
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string
          title: string
          to_secretary_slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          from_secretary_slug?: string
          from_user_id?: string
          id?: string
          priority?: string
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string
          title?: string
          to_secretary_slug?: string
          updated_at?: string
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
      student_attendance: {
        Row: {
          attendance_date: string
          class_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          status: string
          student_user_id: string
        }
        Insert: {
          attendance_date: string
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status: string
          student_user_id: string
        }
        Update: {
          attendance_date?: string
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "school_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          attendance: Json | null
          class_id: string | null
          class_name: string | null
          created_at: string
          created_by: string | null
          grade_level: string | null
          grades: Json | null
          id: string
          matricula: string
          metadata: Json | null
          school_name: string | null
          school_year: string | null
          status: string | null
          student_user_id: string
          updated_at: string
        }
        Insert: {
          attendance?: Json | null
          class_id?: string | null
          class_name?: string | null
          created_at?: string
          created_by?: string | null
          grade_level?: string | null
          grades?: Json | null
          id?: string
          matricula: string
          metadata?: Json | null
          school_name?: string | null
          school_year?: string | null
          status?: string | null
          student_user_id: string
          updated_at?: string
        }
        Update: {
          attendance?: Json | null
          class_id?: string | null
          class_name?: string | null
          created_at?: string
          created_by?: string | null
          grade_level?: string | null
          grades?: Json | null
          id?: string
          matricula?: string
          metadata?: Json | null
          school_name?: string | null
          school_year?: string | null
          status?: string | null
          student_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "school_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_relationships: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          metadata: Json | null
          related_user_id: string
          relationship_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          related_user_id: string
          relationship_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          related_user_id?: string
          relationship_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          role: Database["public"]["Enums"]["app_role"]
          role_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          role: Database["public"]["Enums"]["app_role"]
          role_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          role_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_enrollment_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "prefeito"
        | "secretario"
        | "professor"
        | "aluno"
        | "pai"
        | "cidadao"
        | "responsavel"
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
      app_role: [
        "admin",
        "prefeito",
        "secretario",
        "professor",
        "aluno",
        "pai",
        "cidadao",
        "responsavel",
      ],
      content_status: ["draft", "pending", "published"],
      manifestation_type: ["denuncia", "sugestao", "elogio", "reclamacao"],
      protocol_status: ["aberto", "em_andamento", "encerrado"],
    },
  },
} as const
