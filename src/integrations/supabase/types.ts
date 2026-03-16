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
      alocacoes_obras: {
        Row: {
          ativo: boolean | null
          colaborador_id: string | null
          data_alocacao: string | null
          id: string
          obra_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          colaborador_id?: string | null
          data_alocacao?: string | null
          id?: string
          obra_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          colaborador_id?: string | null
          data_alocacao?: string | null
          id?: string
          obra_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alocacoes_obras_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alocacoes_obras_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "view_conformidade_colaboradores"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "alocacoes_obras_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
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
          {
            foreignKeyName: "auditoria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
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
            foreignKeyName: "colaboradores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
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
            foreignKeyName: "colaboradores_obras_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "view_conformidade_colaboradores"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaboradores_obras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_obras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
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
      convites: {
        Row: {
          created_at: string
          created_by: string
          email: string
          empresa_id: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          status: string
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          empresa_id: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          empresa_id?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "convites_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convites_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
            referencedColumns: ["id"]
          },
        ]
      }
      diario_obra: {
        Row: {
          autor_id: string | null
          created_at: string
          descricao: string
          empresa_id: string
          foto_url: string | null
          id: string
          obra_id: string
        }
        Insert: {
          autor_id?: string | null
          created_at?: string
          descricao: string
          empresa_id: string
          foto_url?: string | null
          id?: string
          obra_id: string
        }
        Update: {
          autor_id?: string | null
          created_at?: string
          descricao?: string
          empresa_id?: string
          foto_url?: string | null
          id?: string
          obra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diario_obra_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_obra_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_obra_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          asaas_customer_id: string | null
          cnpj: string
          created_at: string | null
          id: string
          nome_fantasia: string
          plan_type: string | null
          plano_id: string | null
          status_assinatura: string | null
          subscription_id_asaas: string | null
          trial_ends_at: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          cnpj: string
          created_at?: string | null
          id?: string
          nome_fantasia: string
          plan_type?: string | null
          plano_id?: string | null
          status_assinatura?: string | null
          subscription_id_asaas?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          cnpj?: string
          created_at?: string | null
          id?: string
          nome_fantasia?: string
          plan_type?: string | null
          plano_id?: string | null
          status_assinatura?: string | null
          subscription_id_asaas?: string | null
          trial_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      entregas_epi: {
        Row: {
          ca_numero_entregue: string | null
          colaborador_id: string | null
          created_at: string | null
          data_entrega: string
          data_validade_ca_entregue: string | null
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
          ca_numero_entregue?: string | null
          colaborador_id?: string | null
          created_at?: string | null
          data_entrega?: string
          data_validade_ca_entregue?: string | null
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
          ca_numero_entregue?: string | null
          colaborador_id?: string | null
          created_at?: string | null
          data_entrega?: string
          data_validade_ca_entregue?: string | null
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
            foreignKeyName: "entregas_epi_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "view_conformidade_colaboradores"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
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
          custo_estimado: number | null
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
          custo_estimado?: number | null
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
          custo_estimado?: number | null
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
          {
            foreignKeyName: "epis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          alvara_url: string | null
          cidade: string | null
          cliente: string | null
          created_at: string | null
          data_fim_real: string | null
          data_inicio: string
          data_prevista_fim: string | null
          empresa_id: string
          endereco: string | null
          id: string
          nome: string
          requisitos_obrigatorios: string[] | null
          responsavel: string | null
          status: string | null
          tipo: string | null
        }
        Insert: {
          alvara_url?: string | null
          cidade?: string | null
          cliente?: string | null
          created_at?: string | null
          data_fim_real?: string | null
          data_inicio: string
          data_prevista_fim?: string | null
          empresa_id: string
          endereco?: string | null
          id?: string
          nome: string
          requisitos_obrigatorios?: string[] | null
          responsavel?: string | null
          status?: string | null
          tipo?: string | null
        }
        Update: {
          alvara_url?: string | null
          cidade?: string | null
          cliente?: string | null
          created_at?: string | null
          data_fim_real?: string | null
          data_inicio?: string
          data_prevista_fim?: string | null
          empresa_id?: string
          endereco?: string | null
          id?: string
          nome?: string
          requisitos_obrigatorios?: string[] | null
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
          {
            foreignKeyName: "fk_obras_empresa"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          id: string
          limite_colaboradores: number
          limite_obras: number | null
          nome: string
          permite_obras: boolean | null
          slug: string
          valor_mensal: number | null
        }
        Insert: {
          id?: string
          limite_colaboradores: number
          limite_obras?: number | null
          nome: string
          permite_obras?: boolean | null
          slug: string
          valor_mensal?: number | null
        }
        Update: {
          id?: string
          limite_colaboradores?: number
          limite_obras?: number | null
          nome?: string
          permite_obras?: boolean | null
          slug?: string
          valor_mensal?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          empresa_id: string
          id: string
          nome: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          terms_ip_address: string | null
          terms_version: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          empresa_id: string
          id?: string
          nome?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          terms_ip_address?: string | null
          terms_version?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          empresa_id?: string
          id?: string
          nome?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          terms_ip_address?: string | null
          terms_version?: string | null
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
          {
            foreignKeyName: "profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
            referencedColumns: ["id"]
          },
        ]
      }
      requisitos_colaboradores: {
        Row: {
          colaborador_id: string | null
          data_emissao: string | null
          data_validade: string | null
          documento_url: string | null
          id: string
          status_verificado: boolean | null
          tipo_requisito: string
          updated_at: string | null
        }
        Insert: {
          colaborador_id?: string | null
          data_emissao?: string | null
          data_validade?: string | null
          documento_url?: string | null
          id?: string
          status_verificado?: boolean | null
          tipo_requisito: string
          updated_at?: string | null
        }
        Update: {
          colaborador_id?: string | null
          data_emissao?: string | null
          data_validade?: string | null
          documento_url?: string | null
          id?: string
          status_verificado?: boolean | null
          tipo_requisito?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requisitos_colaboradores_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisitos_colaboradores_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "view_conformidade_colaboradores"
            referencedColumns: ["colaborador_id"]
          },
        ]
      }
      setores: {
        Row: {
          created_at: string | null
          email_encarregado: string | null
          empresa_id: string
          encarregado_nome: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          email_encarregado?: string | null
          empresa_id: string
          encarregado_nome?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          email_encarregado?: string | null
          empresa_id?: string
          encarregado_nome?: string | null
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
          {
            foreignKeyName: "setores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_alertas_vencimento: {
        Row: {
          ca_numero: string | null
          colaborador_id: string | null
          colaborador_nome: string | null
          data_entrega: string | null
          data_vencimento: string | null
          empresa_id: string | null
          entrega_id: string | null
          epi_nome: string | null
          status_troca: string | null
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
            foreignKeyName: "entregas_epi_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "view_conformidade_colaboradores"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
            referencedColumns: ["id"]
          },
        ]
      }
      v_empresas_trial_vencido: {
        Row: {
          email_admin: string | null
          id: string | null
          nome_fantasia: string | null
          trial_ends_at: string | null
        }
        Relationships: []
      }
      view_conformidade_colaboradores: {
        Row: {
          cargo: string | null
          colaborador_id: string | null
          integracao_concluida: boolean | null
          nome_colaborador: string | null
          possui_epis: boolean | null
          status_colaborador: string | null
          validade_aso: string | null
        }
        Insert: {
          cargo?: string | null
          colaborador_id?: string | null
          integracao_concluida?: never
          nome_colaborador?: string | null
          possui_epis?: never
          status_colaborador?: string | null
          validade_aso?: never
        }
        Update: {
          cargo?: string | null
          colaborador_id?: string | null
          integracao_concluida?: never
          nome_colaborador?: string | null
          possui_epis?: never
          status_colaborador?: string | null
          validade_aso?: never
        }
        Relationships: []
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
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
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
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_epis_vencendo_7_dias: {
        Row: {
          ca_numero: string | null
          colaborador_id: string | null
          colaborador_nome: string | null
          data_entrega: string | null
          data_vencimento: string | null
          empresa_id: string | null
          entrega_id: string | null
          epi_nome: string | null
          status_troca: string | null
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
            foreignKeyName: "entregas_epi_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "view_conformidade_colaboradores"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
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
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
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
          {
            foreignKeyName: "entregas_epi_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_trial_vencido"
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
      verificar_limite_colaboradores: {
        Args: { empresa_uuid: string }
        Returns: {
          limite_maximo: number
          pode_ativar: boolean
          total_ativos: number
        }[]
      }
      verificar_limite_obras: {
        Args: { empresa_uuid: string }
        Returns: {
          limite_maximo: number
          pode_criar: boolean
          total_atual: number
        }[]
      }
    }
    Enums: {
      motivo_entrega_tipo:
        | "entrega_inicial"
        | "vencimento"
        | "dano_desgaste"
        | "extravio"
        | "ajuste"
      user_role: "super_admin" | "admin" | "viewer" | "owner" | "editor"
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
      user_role: ["super_admin", "admin", "viewer", "owner", "editor"],
    },
  },
} as const
