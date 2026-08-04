"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { Card } from "@/components/ui";
import {
  PIX_CHAVE,
  PIX_TITULAR,
  PIX_BANCO,
  WHATSAPP_FABRICIA,
  PIX_CAMISA_CHAVE,
  PIX_CAMISA_TITULAR,
  PIX_CAMISA_BANCO,
  WHATSAPP_RAYSSA,
  MODELOS_CAMISA,
  EVENTO,
} from "@/lib/config";
import type { Database } from "@/lib/supabase/types";

type Inscricao = Database["public"]["Tables"]["inscricoes"]["Row"];

function PixBlock({
  titulo,
  chave,
  titular,
  banco,
  valor,
}: {
  titulo: string;
  chave: string;
  titular: string;
  banco?: string;
  valor: number;
}) {
  const { show } = useToast();
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    navigator.clipboard.writeText(chave).catch(() => {});
    setCopiado(true);
    show("Chave PIX copiada!");
    setTimeout(() => setCopiado(false), 3000);
  }

  return (
    <div className="mb-4 rounded-[14px] border-2 border-dashed border-roxo bg-creme p-5 text-left">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">💳</span>
          <strong className="text-[0.9rem] text-roxo">{titulo}</strong>
        </div>
        <strong className="font-titulo text-lg text-lilas">R$ {valor},00</strong>
      </div>
      <div className="mb-2 text-[0.78rem] text-muted">
        {titular}
        {banco ? ` · ${banco}` : ""}
      </div>
      <div className="mb-2 break-all rounded-lg bg-white px-3.5 py-2.5 font-mono text-sm text-roxo">
        {chave}
      </div>
      <button
        onClick={copiar}
        className="rounded-lg bg-roxo px-5 py-2.5 text-[0.82rem] font-semibold text-white transition hover:bg-roxo-escuro"
      >
        {copiado ? "✓ Copiado!" : "📋 Copiar Chave PIX"}
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const [data, setData] = useState<Inscricao | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("checkout");
    if (!raw) {
      router.replace("/inscricao");
      return;
    }
    // sessionStorage só existe no client — precisa ser lido depois do mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(JSON.parse(raw));
  }, [router]);

  if (!data) return null;

  const modelo = MODELOS_CAMISA.find((m) => m.id === data.modelo_camisa);
  const temCamisa = data.quer_camisa && data.valor_camisa != null;

  const msgInscricao = encodeURIComponent(
    `Olá, Fabrícia! Fiz o PIX da minha inscrição no ${EVENTO.subtitulo}.\n✦ ID do Pedido: ${data.id}\n👤 Nome: ${data.nome}\n💰 Valor: R$ ${data.valor},00\nSegue o comprovante. 💜`
  );
  const whatsLinkInscricao = `https://wa.me/${WHATSAPP_FABRICIA}?text=${msgInscricao}`;

  const msgCamisa = encodeURIComponent(
    `Olá, Rayssa! Fiz o PIX da minha camisa do ${EVENTO.subtitulo}.\n✦ ID do Pedido: ${data.id}\n👤 Nome: ${data.nome}\n👕 Camisa (${modelo?.nome ?? data.modelo_camisa}): R$ ${data.valor_camisa},00\nSegue o comprovante. 💜`
  );
  const whatsLinkCamisa = `https://wa.me/${WHATSAPP_RAYSSA}?text=${msgCamisa}`;

  return (
    <div className="fade-in mx-auto max-w-[520px] px-6 py-16">
      <Card className="text-center">
        <div className="mb-2 text-5xl">🎉</div>
        <h2 className="font-titulo text-2xl font-bold text-roxo">Inscrição Realizada!</h2>
        <p className="mb-6 mt-1 text-[0.85rem] text-muted">
          Efetue o(s) pagamento(s) para confirmar sua vaga
        </p>

        <div className="mb-5 rounded-2xl bg-creme p-4">
          <div className="text-[0.72rem] uppercase tracking-[0.1em] text-muted">
            ID do Pedido
          </div>
          <div className="font-titulo text-4xl font-bold tracking-wide text-roxo">{data.id}</div>
          <div className="text-[0.8rem] text-muted">{data.nome}</div>
          <span className="mt-1.5 inline-flex rounded-full bg-aviso-bg px-3 py-1 text-[0.72rem] font-bold text-aviso">
            ● Aguardando Pagamento
          </span>
        </div>

        <PixBlock
          titulo="Inscrição"
          chave={PIX_CHAVE}
          titular={PIX_TITULAR}
          banco={PIX_BANCO}
          valor={data.valor}
        />

        {data.quer_camisa && data.valor_camisa != null && (
          <PixBlock
            titulo={`Camisa (${modelo?.nome ?? data.modelo_camisa})`}
            chave={PIX_CAMISA_CHAVE}
            titular={PIX_CAMISA_TITULAR}
            banco={PIX_CAMISA_BANCO}
            valor={data.valor_camisa}
          />
        )}

        <a href={whatsLinkInscricao} target="_blank" rel="noreferrer">
          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-[0.9rem] font-bold text-white transition hover:bg-[#1DA851]">
            📱 Confirmar Inscrição (Fabrícia)
          </button>
        </a>

        {temCamisa && (
          <a href={whatsLinkCamisa} target="_blank" rel="noreferrer">
            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-[0.9rem] font-bold text-white transition hover:bg-[#1DA851]">
              📱 Confirmar Camisa (Rayssa)
            </button>
          </a>
        )}

        <p className="mt-4 text-[0.75rem] leading-relaxed text-muted">
          Após o pagamento, guarde o ID do pedido. Use-o na aba <strong>Meu Passe</strong> após a
          confirmação para acessar seu QR Code.
          {temCamisa && " O pagamento da camisa é confirmado separado do da inscrição."}
        </p>
      </Card>
    </div>
  );
}
