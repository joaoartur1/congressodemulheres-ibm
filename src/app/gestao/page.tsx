"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { BadgeStatus } from "@/components/ui";
import type { Database } from "@/lib/supabase/types";

type Inscricao = Database["public"]["Tables"]["inscricoes"]["Row"];
type Estoque = Database["public"]["Tables"]["estoque_camisas"]["Row"];

export default function GestaoPage() {
  const [supabase] = useState(() => createClient());
  const { show } = useToast();
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [estoque, setEstoque] = useState<Estoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const [{ data: i }, { data: e }] = await Promise.all([
      supabase.from("inscricoes").select("*").order("created_at", { ascending: false }),
      supabase.from("estoque_camisas").select("*"),
    ]);
    setInscricoes(i ?? []);
    setEstoque(e ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega os dados no mount
    carregar();

    const channel = supabase
      .channel("gestao-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "inscricoes" }, carregar)
      .on("postgres_changes", { event: "*", schema: "public", table: "estoque_camisas" }, carregar)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, carregar]);

  async function confirmarPagamento(id: string) {
    setConfirmando(id);
    const { error } = await supabase
      .from("inscricoes")
      .update({ status_pagamento: "Confirmado" })
      .eq("id", id);
    setConfirmando(null);
    if (error) {
      show("Não foi possível confirmar o pagamento.", "error");
      return;
    }
    show("Pagamento confirmado!");
  }

  const pendentes = inscricoes.filter((i) => i.status_pagamento === "Pendente");
  const confirmadas = inscricoes.filter((i) => i.status_pagamento === "Confirmado");
  const totalArrecadado = confirmadas.reduce((acc, i) => acc + Number(i.valor), 0);

  const kpis = [
    { label: "Total Inscritas", value: inscricoes.length, icon: "👑", color: "text-roxo" },
    { label: "Confirmadas", value: confirmadas.length, icon: "✅", color: "text-sucesso" },
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
          Gestão e <em className="italic text-lilas">Financeiro</em>
        </h2>
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

      <h3 className="mb-4 font-titulo text-xl font-bold text-roxo">📦 Estoque de Camisas</h3>
      <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {estoque.map((s) => {
          const disp = s.quantidade_total - s.quantidade_vendida;
          const pct = Math.round((s.quantidade_vendida / s.quantidade_total) * 100);
          return (
            <div
              key={s.tamanho}
              className="rounded-2xl border border-lilas bg-white p-5 shadow-[0_4px_20px_rgba(100,87,155,0.08)]"
            >
              <div className="mb-2 flex items-center justify-between">
                <strong className="font-titulo text-lg text-roxo">Tamanho {s.tamanho}</strong>
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${
                    disp === 0
                      ? "bg-perigo-bg text-perigo"
                      : disp <= 3
                        ? "bg-aviso-bg text-aviso"
                        : "bg-sucesso-bg text-sucesso"
                  }`}
                >
                  {disp === 0 ? "Esgotado" : `${disp} disp.`}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-lilas">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-roxo to-dourado transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1.5 text-[0.75rem] text-muted">
                {s.quantidade_vendida} de {s.quantidade_total} vendidas
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="mb-4 font-titulo text-xl font-bold text-roxo">Inscrições</h3>
      <div className="space-y-3">
        {inscricoes.length === 0 && (
          <p className="text-sm text-muted">Nenhuma inscrição ainda.</p>
        )}
        {inscricoes.map((i) => (
          <div
            key={i.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-lilas bg-white p-4 shadow-[0_2px_10px_rgba(100,87,155,0.07)]"
          >
            <div>
              <div className="font-titulo text-lg font-bold text-roxo">{i.id}</div>
              <div className="text-[0.88rem] text-texto">{i.nome}</div>
              <div className="text-[0.75rem] text-muted">
                {i.cpf} · {i.whatsapp}
                {i.quer_camisa ? ` · Camisa ${i.tamanho_camisa}` : ""} · R$ {i.valor}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BadgeStatus status={i.status_pagamento} />
              <button
                disabled={i.status_pagamento === "Confirmado" || confirmando === i.id}
                onClick={() => confirmarPagamento(i.id)}
                className="whitespace-nowrap rounded-lg bg-sucesso px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:opacity-90 disabled:cursor-default disabled:bg-sucesso-bg disabled:text-sucesso"
              >
                {i.status_pagamento === "Confirmado" ? "✓ Confirmado" : "Confirmar pagamento"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
