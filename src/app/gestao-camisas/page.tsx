"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { BadgeStatus } from "@/components/ui";
import { MODELOS_CAMISA, TAMANHOS_CAMISA, CORTES_CAMISA } from "@/lib/config";
import { formatMoeda, formatNumero, descricaoTamanhoCamisa } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type PedidoCamisa = Database["public"]["Tables"]["pedidos_camisas"]["Row"];

export default function GestaoCamisasPage() {
  const [supabase] = useState(() => createClient());
  const { show } = useToast();
  const [pedidos, setPedidos] = useState<PedidoCamisa[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "pendentes" | "pagos">("todos");

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from("pedidos_camisas")
      .select("*")
      .order("created_at", { ascending: false });
    setPedidos(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega os dados no mount
    carregar();

    const channel = supabase
      .channel("gestao-camisas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos_camisas" }, carregar)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, carregar]);

  async function confirmarPagamento(id: string) {
    setConfirmando(id);
    const { error } = await supabase
      .from("pedidos_camisas")
      .update({ status_pagamento: "Confirmado" })
      .eq("id", id);
    setConfirmando(null);
    if (error) {
      show("Não foi possível confirmar o pagamento.", "error");
      return;
    }
    show("Pagamento da camisa confirmado!");
  }

  async function excluirPedido(id: string) {
    if (!window.confirm("Excluir este pedido de camisa? Essa ação não pode ser desfeita.")) return;
    setExcluindo(id);
    const { error } = await supabase.from("pedidos_camisas").delete().eq("id", id);
    setExcluindo(null);
    if (error) {
      show("Não foi possível excluir o pedido.", "error");
      return;
    }
    show("Pedido excluído.");
  }

  const pendentes = pedidos.filter((p) => p.status_pagamento !== "Confirmado");
  const confirmados = pedidos.filter((p) => p.status_pagamento === "Confirmado");
  const infantis = pedidos.filter((p) => p.idade_crianca !== null);
  const totalArrecadado = confirmados.reduce((acc, p) => acc + Number(p.valor), 0);

  const porModelo = MODELOS_CAMISA.map((m) => {
    const pedidosModelo = pedidos.filter((p) => p.modelo_camisa === m.id);
    const tamanhos = [
      ...TAMANHOS_CAMISA.flatMap((t) =>
        CORTES_CAMISA.map((c) => ({
          label: c === "Normal" ? t : `${t} ${c}`,
          qtd: pedidosModelo.filter((p) => p.tamanho_camisa === t && p.corte_camisa === c).length,
        }))
      ),
      { label: "Infantil", qtd: pedidosModelo.filter((p) => p.idade_crianca !== null).length },
    ].filter((t) => t.qtd > 0);
    return { ...m, pedidos: pedidosModelo, tamanhos };
  }).filter((m) => m.pedidos.length > 0);

  const pedidosFiltrados = pedidos
    .filter((p) => {
      if (filtro === "pendentes") return p.status_pagamento !== "Confirmado";
      if (filtro === "pagos") return p.status_pagamento === "Confirmado";
      return true;
    })
    .filter((p) => {
      const termo = busca.trim().toLowerCase();
      if (!termo) return true;
      return (
        p.nome_participante.toLowerCase().includes(termo) ||
        p.nome_comprador.toLowerCase().includes(termo)
      );
    });

  const kpis = [
    { label: "Total de Pedidos", value: formatNumero(pedidos.length), icon: "👕", color: "text-roxo" },
    { label: "Pagos", value: formatNumero(confirmados.length), icon: "✅", color: "text-sucesso" },
    { label: "Pendentes", value: formatNumero(pendentes.length), icon: "⏳", color: "text-aviso" },
    { label: "Infantis", value: formatNumero(infantis.length), icon: "🧒", color: "text-azul" },
    { label: "Arrecadado", value: formatMoeda(totalArrecadado), icon: "💰", color: "text-lilas" },
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

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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

      {porModelo.length > 0 && (
        <>
          <h3 className="mb-4 font-titulo text-xl font-bold text-roxo">Pedidos por Modelo e Tamanho</h3>
          <div className="mb-10 space-y-6">
            {porModelo.map((m) => (
              <div key={m.id}>
                <div className="mb-2.5 flex items-baseline gap-2">
                  <h4 className="font-titulo text-base font-bold text-roxo">{m.nome}</h4>
                  <span className="text-[0.78rem] text-muted">
                    ({formatNumero(m.pedidos.length)} {m.pedidos.length === 1 ? "pedido" : "pedidos"})
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {m.tamanhos.map((t) => (
                    <div
                      key={t.label}
                      className="rounded-xl border border-lilas bg-white p-3 text-center shadow-[0_2px_10px_rgba(100,87,155,0.06)]"
                    >
                      <div className="font-titulo text-xl font-bold tabular-nums text-roxo">
                        {formatNumero(t.qtd)}
                      </div>
                      <div className="text-[0.72rem] text-muted">{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="mb-4 font-titulo text-xl font-bold text-roxo">Pedidos</h3>

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
        {pedidos.length === 0 && <p className="text-sm text-muted">Nenhum pedido ainda.</p>}
        {pedidos.length > 0 && pedidosFiltrados.length === 0 && (
          <p className="text-sm text-muted">Nenhum pedido encontrado.</p>
        )}
        {pedidosFiltrados.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-lilas bg-white p-4 shadow-[0_2px_10px_rgba(100,87,155,0.07)]"
          >
            <div>
              <div className="font-titulo text-lg font-bold text-roxo">{p.id}</div>
              <div className="text-[0.88rem] text-texto">
                {p.nome_participante}
                {p.nome_participante !== p.nome_comprador && (
                  <span className="text-muted"> (comprado por {p.nome_comprador})</span>
                )}
              </div>
              <div className="text-[0.75rem] text-muted">
                {p.whatsapp_comprador} ·{" "}
                {MODELOS_CAMISA.find((m) => m.id === p.modelo_camisa)?.nome ?? p.modelo_camisa} ·{" "}
                {descricaoTamanhoCamisa(p)} · R${" "}
                {formatNumero(p.valor)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BadgeStatus status={p.status_pagamento} />
              <button
                disabled={p.status_pagamento === "Confirmado" || confirmando === p.id}
                onClick={() => confirmarPagamento(p.id)}
                className="whitespace-nowrap rounded-lg bg-sucesso px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:opacity-90 disabled:cursor-default disabled:bg-sucesso-bg disabled:text-sucesso"
              >
                {p.status_pagamento === "Confirmado" ? "✓ Confirmado" : "Confirmar pagamento"}
              </button>
              <button
                disabled={excluindo === p.id}
                onClick={() => excluirPedido(p.id)}
                aria-label="Excluir pedido"
                className="whitespace-nowrap rounded-lg border border-perigo px-3 py-2 text-[0.8rem] font-semibold text-perigo transition hover:bg-perigo-bg disabled:cursor-default disabled:opacity-50"
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
