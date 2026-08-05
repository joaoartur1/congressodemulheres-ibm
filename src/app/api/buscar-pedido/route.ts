import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const LIMITE = 20;
const JANELA_MINUTOS = 15;

export async function POST(req: NextRequest) {
  const { cpf } = await req.json();
  if (typeof cpf !== "string" || !cpf.trim()) {
    return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
  const supabase = createAdminClient();

  const { data: liberado } = await supabase.rpc("checar_rate_limit", {
    p_chave: `buscar_pedido:${ip}`,
    p_limite: LIMITE,
    p_janela_minutos: JANELA_MINUTOS,
  });

  if (!liberado) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." },
      { status: 429 }
    );
  }

  const { data, error } = await supabase.rpc("buscar_pedido_por_cpf", { p_cpf: cpf });
  if (error) {
    return NextResponse.json({ error: "Não foi possível consultar agora." }, { status: 500 });
  }

  return NextResponse.json({ data });
}
