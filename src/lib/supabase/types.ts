// Tipos escritos à mão a partir da migration em supabase/migrations/0001_init.sql.
// Se preferir, gere automaticamente depois com:
//   npx supabase gen types typescript --project-id <seu-project-id> > src/lib/supabase/types.ts

export type StatusPagamento = "Pendente" | "Confirmado";
export type Role = "tesouraria" | "recepcao" | "camisas";
export type FaixaEtariaCamisa = "ate_11" | "12_mais";

export interface Database {
  public: {
    Views: Record<string, never>;
    Tables: {
      estoque_camisas: {
        Row: {
          tamanho: string;
          quantidade_total: number;
          quantidade_vendida: number;
        };
        Insert: {
          tamanho: string;
          quantidade_total: number;
          quantidade_vendida?: number;
        };
        Update: {
          tamanho?: string;
          quantidade_total?: number;
          quantidade_vendida?: number;
        };
        Relationships: [];
      };
      inscricoes: {
        Row: {
          id: string;
          nome: string;
          cpf: string;
          whatsapp: string;
          quer_camisa: boolean;
          tamanho_camisa: string | null;
          modelo_camisa: string | null;
          faixa_etaria_camisa: FaixaEtariaCamisa | null;
          valor: number;
          valor_camisa: number | null;
          status_pagamento: StatusPagamento;
          status_pagamento_camisa: StatusPagamento | null;
          status_presenca: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cpf: string;
          whatsapp: string;
          quer_camisa?: boolean;
          tamanho_camisa?: string | null;
          modelo_camisa?: string | null;
          faixa_etaria_camisa?: FaixaEtariaCamisa | null;
          valor: number;
          valor_camisa?: number | null;
          status_pagamento?: StatusPagamento;
          status_pagamento_camisa?: StatusPagamento | null;
          status_presenca?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inscricoes"]["Insert"]>;
        Relationships: [];
      };
      perfis_equipe: {
        Row: {
          id: string;
          nome: string;
          role: Role;
        };
        Insert: {
          id: string;
          nome: string;
          role: Role;
        };
        Update: Partial<Database["public"]["Tables"]["perfis_equipe"]["Insert"]>;
        Relationships: [];
      };
      programacao: {
        Row: {
          id: number;
          dia: string;
          horario: string;
          titulo: string;
          preletora: string | null;
          ordem: number;
        };
        Insert: {
          id?: number;
          dia: string;
          horario: string;
          titulo: string;
          preletora?: string | null;
          ordem?: number;
        };
        Update: Partial<Database["public"]["Tables"]["programacao"]["Insert"]>;
        Relationships: [];
      };
      palestrantes: {
        Row: {
          id: number;
          nome: string;
          foto_url: string | null;
          resumo: string;
          igreja: string | null;
          instagram: string | null;
          cidade: string | null;
          video_url: string | null;
          ordem: number;
        };
        Insert: {
          id?: number;
          nome: string;
          foto_url?: string | null;
          resumo: string;
          igreja?: string | null;
          instagram?: string | null;
          cidade?: string | null;
          video_url?: string | null;
          ordem?: number;
        };
        Update: Partial<Database["public"]["Tables"]["palestrantes"]["Insert"]>;
        Relationships: [];
      };
      perguntas_frequentes: {
        Row: {
          id: number;
          pergunta: string;
          resposta: string;
          ordem: number;
        };
        Insert: {
          id?: number;
          pergunta: string;
          resposta: string;
          ordem?: number;
        };
        Update: Partial<Database["public"]["Tables"]["perguntas_frequentes"]["Insert"]>;
        Relationships: [];
      };
      looks: {
        Row: {
          id: number;
          foto_url: string;
          legenda: string | null;
          ordem: number;
        };
        Insert: {
          id?: number;
          foto_url: string;
          legenda?: string | null;
          ordem?: number;
        };
        Update: Partial<Database["public"]["Tables"]["looks"]["Insert"]>;
        Relationships: [];
      };
    };
    Functions: {
      criar_inscricao: {
        Args: {
          p_nome: string;
          p_cpf: string;
          p_whatsapp: string;
          p_quer_camisa: boolean;
          p_modelo_camisa: string | null;
          p_tamanho_camisa: string | null;
          p_faixa_etaria_camisa: FaixaEtariaCamisa | null;
        };
        Returns: Database["public"]["Tables"]["inscricoes"]["Row"];
      };
      buscar_inscricao_por_cpf: {
        Args: { p_cpf: string };
        Returns: Database["public"]["Tables"]["inscricoes"]["Row"][];
      };
      confirmar_presenca: {
        Args: { p_id: string };
        Returns: {
          sucesso: boolean;
          inscricao: Database["public"]["Tables"]["inscricoes"]["Row"];
        }[];
      };
      checar_rate_limit: {
        Args: { p_chave: string; p_limite: number; p_janela_minutos: number };
        Returns: boolean;
      };
    };
  };
}
