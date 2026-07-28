"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { Card } from "@/components/ui";
import { PIX_CHAVE, PIX_TITULAR, EVENTO } from "@/lib/config";
import type { Database } from "@/lib/supabase/types";

type Inscricao = Database["public"]["Tables"]["inscricoes"]["Row"];

export default function CheckoutPage() {
  const router = useRouter();
  const { show } = useToast();
  const [data, setData] = useState<Inscricao | null>(null);
  const [copiado, setCopiado] = useState(false);

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

  const msg = encodeURIComponent(
    `Olá! Fiz minha inscrição no ${EVENTO.subtitulo}.\n✦ ID do Pedido: ${data.id}\n💰 Valor: R$ ${data.valor},00\nAguardando confirmação de pagamento. 💜`
  );
  const whatsLink = `https://wa.me/55${data.whatsapp}?text=${msg}`;

  function copiarPix() {
    navigator.clipboard.writeText(PIX_CHAVE).catch(() => {});
    setCopiado(true);
    show("Chave PIX copiada!");
    setTimeout(() => setCopiado(false), 3000);
  }

  return (
    <div className="fade-in mx-auto max-w-[520px] px-6 py-16">
      <Card className="text-center">
        <div className="mb-2 text-5xl">🎉</div>
        <h2 className="font-titulo text-2xl font-bold text-roxo">Inscrição Realizada!</h2>
        <p className="mb-6 mt-1 text-[0.85rem] text-muted">
          Efetue o pagamento para confirmar sua vaga
        </p>

        <div className="mb-5 rounded-2xl bg-creme p-4">
          <div className="text-[0.72rem] uppercase tracking-[0.1em] text-muted">
            ID do Pedido
          </div>
          <div className="font-titulo text-4xl font-bold tracking-wide text-roxo">{data.id}</div>
          <div className="text-[0.8rem] text-muted">{data.nome}</div>
          <div className="my-1.5 text-2xl font-bold text-lilas">R$ {data.valor},00</div>
          <span className="inline-flex rounded-full bg-aviso-bg px-3 py-1 text-[0.72rem] font-bold text-aviso">
            ● Aguardando Pagamento
          </span>
        </div>

        <div className="mb-6 rounded-[14px] border-2 border-dashed border-roxo bg-creme p-5 text-left">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xl">💳</span>
            <strong className="text-[0.9rem] text-roxo">Pagamento via PIX</strong>
          </div>
          <div className="mb-2 text-[0.78rem] text-muted">{PIX_TITULAR}</div>
          <div className="mb-2 break-all rounded-lg bg-white px-3.5 py-2.5 font-mono text-sm text-roxo">
            {PIX_CHAVE}
          </div>
          <button
            onClick={copiarPix}
            className="rounded-lg bg-roxo px-5 py-2.5 text-[0.82rem] font-semibold text-white transition hover:bg-roxo-escuro"
          >
            {copiado ? "✓ Copiado!" : "📋 Copiar Chave PIX"}
          </button>
        </div>

        <a href={whatsLink} target="_blank" rel="noreferrer">
          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-[0.9rem] font-bold text-white transition hover:bg-[#1DA851]">
            📱 Confirmar via WhatsApp
          </button>
        </a>

        <p className="mt-4 text-[0.75rem] leading-relaxed text-muted">
          Após o pagamento, guarde o ID do pedido. Use-o na aba <strong>Meu Passe</strong> após a
          confirmação para acessar seu QR Code.
        </p>
      </Card>
    </div>
  );
}
