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
      auditoria: {
        Row: {
          acao: string
          created_at: string | null
          detalhes: Json | null
          empresa_id: string | null
          id: string
          registro_id: string
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          detalhes?: Json | null
          empresa_id?: string | null
          id?: string
          registro_id: string
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          detalhes?: Json | null
          empresa_id?: string | null
          id?: string
          registro_id?: string
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          cargo: string | null
          created_at: string | null
          email_encarregado: string | null
          empresa_id: string
          id: string
          nome_completo: string
          onboarding_completo: boolean | null
          setor_id: string | null
          status: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string | null
          email_encarregado?: string | null
          empresa_id: string
          id?: string
          nome_completo: string
          onboarding_completo?: boolean | null
          setor_id?: string | null
          status?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string | null
          email_encarregado?: string | null
          empresa_id?: string
          id?: string
          nome_completo?: string
          onboarding_completo?: boolean | null
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
      colaboradores_obras: {
        Row: {
          ativo: boolean | null
          colaborador_id: string
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          empresa_id: string
          id: string
          motivo_movimentacao: string | null
          obra_id: string
        }
        Insert: {
          ativo?: boolean | null
          colaborador_id: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio: string
          empresa_id: string
          id?: string
          motivo_movimentacao?: string | null
          obra_id: string
        }
        Update: {
          ativo?: boolean | null
          colaborador_id?: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          empresa_id?: string
          id?: string
          motivo_movimentacao?: string | null
          obra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_obras_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_obras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_obras_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
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
          dispositivo: string | null
          empresa_id: string
          epi_id: string | null
          hash_registro: string | null
          id: string
          ip_registro: string | null
          motivo_entrega:
            | Database["public"]["Enums"]["motivo_entrega_tipo"]
            | null
          notificado_em: string | null
          observacoes: string | null
          responsavel_id: string | null
          status: string | null
          status_troca: string | null
          tipo_validacao: string | null
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string | null
          data_entrega?: string
          data_vencimento: string
          dispositivo?: string | null
          empresa_id: string
          epi_id?: string | null
          hash_registro?: string | null
          id?: string
          ip_registro?: string | null
          motivo_entrega?:
            | Database["public"]["Enums"]["motivo_entrega_tipo"]
            | null
          notificado_em?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          status?: string | null
          status_troca?: string | null
          tipo_validacao?: string | null
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string | null
          data_entrega?: string
          data_vencimento?: string
          dispositivo?: string | null
          empresa_id?: string
          epi_id?: string | null
          hash_registro?: string | null
          id?: string
          ip_registro?: string | null
          motivo_entrega?:
            | Database["public"]["Enums"]["motivo_entrega_tipo"]
            | null
          notificado_em?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          status?: string | null
          status_troca?: string | null
          tipo_validacao?: string | null
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
          {
            foreignKeyName: "entregas_epi_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      epis: {
        Row: {
          ca_numero: string | null
          created_at: string | null
          data_validade_ca: string | null
          empresa_id: string
          fabricante: string | null
          id: string
          nome_epi: string
          periodicidade_dias: number
        }
        Insert: {
          ca_numero?: string | null
          created_at?: string | null
          data_validade_ca?: string | null
          empresa_id: string
          fabricante?: string | null
          id?: string
          nome_epi: string
          periodicidade_dias: number
        }
        Update: {
          ca_numero?: string | null
          created_at?: string | null
          data_validade_ca?: string | null
          empresa_id?: string
          fabricante?: string | null
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
      obras: {
        Row: {
          cidade: string | null
          created_at: string | null
          data_fim_real: string | null
          data_inicio: string
          data_prevista_fim: string | null
          empresa_id: string
          id: string
          nome: string
          responsavel: string | null
          status: string | null
          tipo: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string | null
          data_fim_real?: string | null
          data_inicio: string
          data_prevista_fim?: string | null
          empresa_id: string
          id?: string
          nome: string
          responsavel?: string | null
          status?: string | null
          tipo?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string | null
          data_fim_real?: string | null
          data_inicio?: string
          data_prevista_fim?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          responsavel?: string | null
          status?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_obras_empresa"
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
          email: string | null
          empresa_id: string
          id: string
          nome: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          empresa_id: string
          id?: string
          nome?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          empresa_id?: string
          id?: string
          nome?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
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
          empresa_id: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          email_encarregado?: string | null
          empresa_id: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          email_encarregado?: string | null
          empresa_id?: string
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
      v_alertas_vencimento: {
        Row: {
          colaborador_nome: string | null
          data_vencimento: string | null
          email_encarregado: string | null
          empresa_id: string | null
          epi_nome: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      view_dashboard_conformidade: {
        Row: {
          cas_vencidos: number | null
          colaboradores_irregulares: number | null
          empresa_id: string | null
          epis_vencidos: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_epis_para_escalacao: {
        Row: {
          data_vencimento: string | null
          dias_atraso: number | null
          empresa_id: string | null
          entrega_id: string | null
          nome_completo: string | null
          nome_epi: string | null
          nome_fantasia: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_epis_vencendo_7_dias: {
        Row: {
          email_notificacao: string | null
          empresa_id: string | null
          empresa_nome: string | null
          lista_epis: Json | null
          total_epis: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_epis_vencidos: {
        Row: {
          data_vencimento: string | null
          email_notificacao: string | null
          empresa_id: string | null
          empresa_nome: string | null
          entrega_id: string | null
          nome_completo: string | null
          nome_epi: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_relatorio_mensal_resumo: {
        Row: {
          empresa_id: string | null
          nome_fantasia: string | null
          total_entregues_mes: number | null
          total_pendentes: number | null
          total_vencidos: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invite: { Args: { p_convite_id: string }; Returns: string }
      create_empresa_onboarding: {
        Args: { p_cnpj: string; p_nome_fantasia: string }
        Returns: string
      }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_empresa_id: { Args: never; Returns: string }
    }
    Enums: {
      motivo_entrega_tipo:
        | "entrega_inicial"
        | "vencimento"
        | "dano_desgaste"
        | "extravio"
        | "ajuste"
      user_role: "super_admin" | "admin" | "viewer"
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
      motivo_entrega_tipo: [
        "entrega_inicial",
        "vencimento",
        "dano_desgaste",
        "extravio",
        "ajuste",
      ],
      user_role: ["super_admin", "admin", "viewer"],
    },
  },
} as const
