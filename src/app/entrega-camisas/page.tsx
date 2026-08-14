"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { MODELOS_CAMISA } from "@/lib/config";
import { formatNumero, descricaoTamanhoCamisa } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type PedidoCamisa = Database["public"]["Tables"]["pedidos_camisas"]["Row"];

export default function EntregaCamisasPage() {
  const [supabase] = useState(() => createClient());
  const { show } = useToast();
  const [pedidos, setPedidos] = useState<PedidoCamisa[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from("pedidos_camisas")
      .select("*")
      .eq("status_pagamento", "Confirmado")
      .order("nome_participante", { ascending: true });
    setPedidos(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega os dados no mount
    carregar();

    const channel = supabase
      .channel("entrega-camisas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos_camisas" }, carregar)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, carregar]);

  async function confirmarEntrega(id: string) {
    setConfirmando(id);
    const { error } = await supabase.from("pedidos_camisas").update({ entregue: true }).eq("id", id);
    setConfirmando(null);
    if (error) {
      show("Não foi possível registrar a entrega.", "error");
      return;
    }
    show("Entrega confirmada!");
  }

  const termo = busca.trim().toLowerCase();
  const resultados = termo
    ? pedidos.filter(
        (p) =>
          p.nome_participante.toLowerCase().includes(termo) ||
          p.nome_comprador.toLowerCase().includes(termo)
      )
    : [];

  const totalPagos = pedidos.length;
  const totalEntregues = pedidos.filter((p) => p.entregue).length;

  if (loading) {
    return <div className="px-6 py-16 text-center text-muted">Carregando…</div>;
  }

  return (
    <div className="fade-in mx-auto max-w-[720px] px-6 py-16">
      <div className="mb-8 text-center">
        <h2 className="font-titulo text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-roxo">
          Entrega de <em className="italic text-lilas">Camisas</em>
        </h2>
        <p className="mt-2 text-sm text-muted">
          Busque pelo nome, confira o tamanho antes de entregar e confirme a retirada.
        </p>
        <div className="mx-auto mt-3 mb-4 h-[3px] w-[60px] rounded-full bg-gradient-to-r from-roxo to-dourado" />
        <p className="text-[0.8rem] text-muted">
          {formatNumero(totalEntregues)} de {formatNumero(totalPagos)} camisas pagas já entregues
        </p>
      </div>

      <input
        type="text"
        placeholder="🔍 Buscar pelo nome…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        autoFocus
        className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
      />

      <div className="mt-5 space-y-3">
        {!termo && (
          <p className="text-center text-sm text-muted">Digite um nome pra começar a buscar.</p>
        )}
        {termo && resultados.length === 0 && (
          <p className="text-center text-sm text-muted">Nenhuma camisa paga encontrada com esse nome.</p>
        )}
        {resultados.map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl border p-5 shadow-[0_2px_10px_rgba(100,87,155,0.07)] ${
              p.entregue ? "border-sucesso bg-sucesso-bg/30" : "border-lilas bg-white"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-titulo text-lg font-bold text-roxo">{p.nome_participante}</div>
                {p.nome_participante !== p.nome_comprador && (
                  <div className="text-[0.78rem] text-muted">comprado por {p.nome_comprador}</div>
                )}
                <div className="mt-1 text-sm text-texto">
                  👕 {MODELOS_CAMISA.find((m) => m.id === p.modelo_camisa)?.nome ?? p.modelo_camisa}
                </div>
                <div className="mt-0.5 font-titulo text-2xl font-bold tabular-nums text-roxo">
                  {descricaoTamanhoCamisa(p)}
                </div>
              </div>
              {p.entregue ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sucesso-bg px-3 py-1 text-xs font-bold text-sucesso">
                  ✓ Já entregue
                </span>
              ) : (
                <button
                  disabled={confirmando === p.id}
                  onClick={() => confirmarEntrega(p.id)}
                  className="shrink-0 whitespace-nowrap rounded-full bg-sucesso px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-default disabled:opacity-60"
                >
                  ✔ Confirmar Entrega
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
