// Tipos escritos à mão a partir da migration em supabase/migrations/0001_init.sql.
// Se preferir, gere automaticamente depois com:
//   npx supabase gen types typescript --project-id <seu-project-id> > src/lib/supabase/types.ts

export type StatusPagamento = "Pendente" | "Confirmado";
export type Role = "tesouraria" | "recepcao" | "camisas";
export type FaixaEtariaCamisa = "ate_11" | "12_mais";

export interface CamisaItemInput {
  nome_participante?: string;
  modelo_camisa: string;
  faixa_etaria_camisa: FaixaEtariaCamisa;
  corte_camisa?: string | null;
  tamanho_camisa?: string | null;
  idade_crianca?: number | null;
}

export interface Database {
  public: {
    Views: Record<string, never>;
    Tables: {
      inscricoes: {
        Row: {
          id: string;
          nome: string;
          cpf: string;
          whatsapp: string;
          valor: number;
          status_pagamento: StatusPagamento;
          status_presenca: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cpf: string;
          whatsapp: string;
          valor: number;
          status_pagamento?: StatusPagamento;
          status_presenca?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inscricoes"]["Insert"]>;
        Relationships: [];
      };
      pedidos_camisas: {
        Row: {
          id: string;
          inscricao_id: string | null;
          cpf_comprador: string;
          nome_comprador: string;
          whatsapp_comprador: string;
          nome_participante: string;
          modelo_camisa: string;
          corte_camisa: string | null;
          tamanho_camisa: string | null;
          idade_crianca: number | null;
          faixa_etaria_camisa: FaixaEtariaCamisa;
          valor: number;
          status_pagamento: StatusPagamento;
          created_at: string;
        };
        Insert: {
          id?: string;
          inscricao_id?: string | null;
          cpf_comprador: string;
          nome_comprador: string;
          whatsapp_comprador: string;
          nome_participante: string;
          modelo_camisa: string;
          corte_camisa?: string | null;
          tamanho_camisa?: string | null;
          idade_crianca?: number | null;
          faixa_etaria_camisa: FaixaEtariaCamisa;
          valor: number;
          status_pagamento?: StatusPagamento;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pedidos_camisas"]["Insert"]>;
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
      criar_pedido: {
        Args: {
          p_quer_inscricao: boolean;
          p_nome: string;
          p_cpf: string;
          p_whatsapp: string;
          p_camisas: CamisaItemInput[];
        };
        Returns: {
          inscricao: Database["public"]["Tables"]["inscricoes"]["Row"] | null;
          camisas: Database["public"]["Tables"]["pedidos_camisas"]["Row"][];
        };
      };
      buscar_pedido_por_cpf: {
        Args: { p_cpf: string };
        Returns: {
          inscricao: Database["public"]["Tables"]["inscricoes"]["Row"] | null;
          camisas: Database["public"]["Tables"]["pedidos_camisas"]["Row"][];
        };
      };
      confirmar_presenca: {
        Args: { p_id: string };
        Returns: {
          sucesso: boolean;
          motivo: "ok" | "ja_utilizado" | "pagamento_pendente" | "nao_encontrada";
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

export type PedidoResultado = {
  inscricao: Database["public"]["Tables"]["inscricoes"]["Row"] | null;
  camisas: Database["public"]["Tables"]["pedidos_camisas"]["Row"][];
};
