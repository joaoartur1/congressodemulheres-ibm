"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { BadgeStatus } from "@/components/ui";
import { formatMoeda, formatNumero } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Inscricao = Database["public"]["Tables"]["inscricoes"]["Row"];

export default function GestaoPage() {
  const [supabase] = useState(() => createClient());
  const { show } = useToast();
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "pendentes" | "pagos">("todos");

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from("inscricoes")
      .select("*")
      .order("created_at", { ascending: false });
    setInscricoes(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega os dados no mount
    carregar();

    const channel = supabase
      .channel("gestao-realtime")
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

  const inscricoesFiltradas = inscricoes
    .filter((i) => {
      if (filtro === "pendentes") return i.status_pagamento !== "Confirmado";
      if (filtro === "pagos") return i.status_pagamento === "Confirmado";
      return true;
    })
    .filter((i) => {
      const termo = busca.trim().toLowerCase();
      if (!termo) return true;
      return i.nome.toLowerCase().includes(termo);
    });

  const kpis = [
    { label: "Total Inscritas", value: formatNumero(inscricoes.length), icon: "👑", color: "text-roxo" },
    { label: "Confirmadas", value: formatNumero(confirmadas.length), icon: "✅", color: "text-sucesso" },
    { label: "Pendentes", value: formatNumero(pendentes.length), icon: "⏳", color: "text-aviso" },
    { label: "Arrecadado", value: formatMoeda(totalArrecadado), icon: "💰", color: "text-lilas" },
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
        <p className="mt-2 text-sm text-muted">
          Pagamentos da inscrição — camisas são geridas pela equipe responsável, em &ldquo;Gestão
          de Camisas&rdquo;.
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
            <div className={`font-titulo text-xl sm:text-2xl font-bold tabular-nums truncate ${k.color}`}>
              {k.value}
            </div>
            <div className="mt-0.5 text-[0.78rem] text-muted">{k.label}</div>
          </div>
        ))}
      </div>

      <h3 className="mb-4 font-titulo text-xl font-bold text-roxo">Inscrições</h3>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="🔍 Buscar por nome…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-2.5 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white sm:max-w-[280px]"
        />
        <div className="flex gap-2">
          {(
            [
              { valor: "todos", label: "Todos" },
              { valor: "pendentes", label: "Pendentes" },
              { valor: "pagos", label: "Pagos" },
            ] as const
          ).map((f) => (
            <button
              key={f.valor}
              type="button"
              onClick={() => setFiltro(f.valor)}
              className={`rounded-full px-4 py-2 text-[0.8rem] font-semibold transition ${
                filtro === f.valor
                  ? "bg-roxo text-white"
                  : "border border-lilas bg-white text-roxo hover:bg-creme"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {inscricoes.length === 0 && (
          <p className="text-sm text-muted">Nenhuma inscrição ainda.</p>
        )}
        {inscricoes.length > 0 && inscricoesFiltradas.length === 0 && (
          <p className="text-sm text-muted">Nenhuma inscrição encontrada.</p>
        )}
        {inscricoesFiltradas.map((i) => (
          <div
            key={i.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-lilas bg-white p-4 shadow-[0_2px_10px_rgba(100,87,155,0.07)]"
          >
            <div>
              <div className="font-titulo text-lg font-bold text-roxo">{i.id}</div>
              <div className="text-[0.88rem] text-texto">{i.nome}</div>
              <div className="text-[0.75rem] text-muted">
                {i.cpf} · {i.whatsapp} · R$ {formatNumero(i.valor)}
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
