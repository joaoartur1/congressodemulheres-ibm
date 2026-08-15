import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const LIMITE = 10;
const JANELA_MINUTOS = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
  const supabase = createAdminClient();

  const { data: liberado } = await supabase.rpc("checar_rate_limit", {
    p_chave: `criar_pedido_extra:${ip}`,
    p_limite: LIMITE,
    p_janela_minutos: JANELA_MINUTOS,
  });

  if (!liberado) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um pouco e tente de novo." },
      { status: 429 }
    );
  }

  const { data, error } = await supabase.rpc("criar_pedido_extra", {
    p_nome: body.p_nome,
    p_cpf: body.p_cpf,
    p_whatsapp: body.p_whatsapp,
    p_modelo: body.p_modelo,
    p_tamanho: body.p_tamanho,
    p_corte: body.p_corte,
  });

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
  }

  return NextResponse.json({ data });
}
