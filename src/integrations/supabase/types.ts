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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      colaboradores: {
        Row: {
          cargo: string | null
          created_at: string | null
          email_encarregado: string | null
          empresa_id: string | null
          id: string
          nome_completo: string
          setor_id: string | null
          status: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string | null
          email_encarregado?: string | null
          empresa_id?: string | null
          id?: string
          nome_completo: string
          setor_id?: string | null
          status?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string | null
          email_encarregado?: string | null
          empresa_id?: string | null
          id?: string
          nome_completo?: string
          setor_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          cnpj: string
          created_at: string | null
          id: string
          nome_fantasia: string
        }
        Insert: {
          cnpj: string
          created_at?: string | null
          id?: string
          nome_fantasia: string
        }
        Update: {
          cnpj?: string
          created_at?: string | null
          id?: string
          nome_fantasia?: string
        }
        Relationships: []
      }
      entregas_epi: {
        Row: {
          colaborador_id: string | null
          created_at: string | null
          data_entrega: string
          data_vencimento: string
          empresa_id: string | null
          epi_id: string | null
          id: string
          status_troca: string | null
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string | null
          data_entrega?: string
          data_vencimento: string
          empresa_id?: string | null
          epi_id?: string | null
          id?: string
          status_troca?: string | null
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string | null
          data_entrega?: string
          data_vencimento?: string
          empresa_id?: string | null
          epi_id?: string | null
          id?: string
          status_troca?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entregas_epi_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_epi_epi_id_fkey"
            columns: ["epi_id"]
            isOneToOne: false
            referencedRelation: "epis"
            referencedColumns: ["id"]
          },
        ]
      }
      epis: {
        Row: {
          ca_numero: string | null
          created_at: string | null
          empresa_id: string | null
          id: string
          nome_epi: string
          periodicidade_dias: number
        }
        Insert: {
          ca_numero?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          nome_epi: string
          periodicidade_dias: number
        }
        Update: {
          ca_numero?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          nome_epi?: string
          periodicidade_dias?: number
        }
        Relationships: [
          {
            foreignKeyName: "epis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          empresa_id: string | null
          id: string
          nome: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      setores: {
        Row: {
          created_at: string | null
          email_encarregado: string | null
          empresa_id: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          email_encarregado?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          email_encarregado?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "setores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_empresa_onboarding: {
        Args: { p_cnpj: string; p_nome_fantasia: string }
        Returns: string
      }
      get_user_empresa_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
