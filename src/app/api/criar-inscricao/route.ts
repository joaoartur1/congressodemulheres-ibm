import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const LIMITE = 5;
const JANELA_MINUTOS = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
  const supabase = createAdminClient();

  const { data: liberado } = await supabase.rpc("checar_rate_limit", {
    p_chave: `criar_inscricao:${ip}`,
    p_limite: LIMITE,
    p_janela_minutos: JANELA_MINUTOS,
  });

  if (!liberado) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um pouco e tente de novo." },
      { status: 429 }
    );
  }

  const { data, error } = await supabase.rpc("criar_inscricao", {
    p_nome: body.p_nome,
    p_cpf: body.p_cpf,
    p_whatsapp: body.p_whatsapp,
    p_quer_camisa: body.p_quer_camisa,
    p_modelo_camisa: body.p_modelo_camisa,
    p_tamanho_camisa: body.p_tamanho_camisa,
    p_faixa_etaria_camisa: body.p_faixa_etaria_camisa,
  });

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
  }

  return NextResponse.json({ data });
}
