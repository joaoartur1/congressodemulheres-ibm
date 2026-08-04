"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { BadgeStatus } from "@/components/ui";
import { MODELOS_CAMISA } from "@/lib/config";
import type { Database } from "@/lib/supabase/types";

type Inscricao = Database["public"]["Tables"]["inscricoes"]["Row"];

export default function GestaoCamisasPage() {
  const [supabase] = useState(() => createClient());
  const { show } = useToast();
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from("inscricoes")
      .select("*")
      .eq("quer_camisa", true)
      .order("created_at", { ascending: false });
    setInscricoes(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega os dados no mount
    carregar();

    const channel = supabase
      .channel("gestao-camisas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "inscricoes" }, carregar)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, carregar]);

  async function confirmarPagamento(id: string) {
    setConfirmando(id);
    const { error } = await supabase
      .from("inscricoes")
      .update({ status_pagamento_camisa: "Confirmado" })
      .eq("id", id);
    setConfirmando(null);
    if (error) {
      show("Não foi possível confirmar o pagamento.", "error");
      return;
    }
    show("Pagamento da camisa confirmado!");
  }

  const pendentes = inscricoes.filter((i) => i.status_pagamento_camisa !== "Confirmado");
  const confirmados = inscricoes.filter((i) => i.status_pagamento_camisa === "Confirmado");
  const totalArrecadado = confirmados.reduce((acc, i) => acc + Number(i.valor_camisa ?? 0), 0);

  const porModelo = MODELOS_CAMISA.map((m) => ({
    ...m,
    pedidos: inscricoes.filter((i) => i.modelo_camisa === m.id),
  })).filter((m) => m.pedidos.length > 0);

  const kpis = [
    { label: "Total de Pedidos", value: inscricoes.length, icon: "👕", color: "text-roxo" },
    { label: "Pagos", value: confirmados.length, icon: "✅", color: "text-sucesso" },
    { label: "Pendentes", value: pendentes.length, icon: "⏳", color: "text-aviso" },
    { label: "Arrecadado", value: `R$ ${totalArrecadado}`, icon: "💰", color: "text-lilas" },
  ];

  if (loading) {
    return <div className="px-6 py-16 text-center text-muted">Carregando…</div>;
  }

  return (
    <div className="fade-in mx-auto max-w-[1100px] px-6 py-16">
      <div className="mb-2 text-center">
        <h2 className="font-titulo text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-roxo">
          Gestão de <em className="italic text-lilas">Camisas</em>
        </h2>
        <p className="mt-2 text-sm text-muted">
          Pedidos são por encomenda — sem limite de estoque. Confirme aqui apenas os pagamentos
          feitos via PIX da responsável pelas camisas.
        </p>
        <div className="mx-auto mt-3 mb-8 h-[3px] w-[60px] rounded-full bg-gradient-to-r from-roxo to-dourado" />
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-lilas bg-white p-5 text-center shadow-[0_4px_20px_rgba(100,87,155,0.08)]"
          >
            <div className="text-2xl">{k.icon}</div>
            <div className={`font-titulo text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="mt-0.5 text-[0.78rem] text-muted">{k.label}</div>
          </div>
        ))}
      </div>

      {porModelo.length > 0 && (
        <>
          <h3 className="mb-4 font-titulo text-xl font-bold text-roxo">Pedidos por Modelo</h3>
          <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {porModelo.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-lilas bg-white p-3 text-center shadow-[0_2px_10px_rgba(100,87,155,0.06)]"
              >
                <div className="font-titulo text-2xl font-bold text-roxo">
                  {m.pedidos.length}
                </div>
                <div className="text-[0.75rem] text-muted">{m.nome}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="mb-4 font-titulo text-xl font-bold text-roxo">Pedidos</h3>
      <div className="space-y-3">
        {inscricoes.length === 0 && <p className="text-sm text-muted">Nenhum pedido ainda.</p>}
        {inscricoes.map((i) => (
          <div
            key={i.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-lilas bg-white p-4 shadow-[0_2px_10px_rgba(100,87,155,0.07)]"
          >
            <div>
              <div className="font-titulo text-lg font-bold text-roxo">{i.id}</div>
              <div className="text-[0.88rem] text-texto">{i.nome}</div>
              <div className="text-[0.75rem] text-muted">
                {i.whatsapp} ·{" "}
                {MODELOS_CAMISA.find((m) => m.id === i.modelo_camisa)?.nome ?? i.modelo_camisa} ·{" "}
                {i.tamanho_camisa} ·{" "}
                {i.faixa_etaria_camisa === "ate_11" ? "11 anos ou menos" : "12 anos ou mais"} · R${" "}
                {i.valor_camisa}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BadgeStatus status={i.status_pagamento_camisa ?? "Pendente"} />
              <button
                disabled={i.status_pagamento_camisa === "Confirmado" || confirmando === i.id}
                onClick={() => confirmarPagamento(i.id)}
                className="whitespace-nowrap rounded-lg bg-sucesso px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:opacity-90 disabled:cursor-default disabled:bg-sucesso-bg disabled:text-sucesso"
              >
                {i.status_pagamento_camisa === "Confirmado" ? "✓ Confirmado" : "Confirmar pagamento"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
