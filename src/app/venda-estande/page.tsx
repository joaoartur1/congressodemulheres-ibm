"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { PrimaryButton, Spinner } from "@/components/ui";
import { MODELOS_CAMISA } from "@/lib/config";
import { formatCPF, formatWhats, isCpfValido, formatNumero } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type EstoqueItem = Database["public"]["Tables"]["estoque_extra_camisas"]["Row"];

export default function VendaEstandePage() {
  const [supabase] = useState(() => createClient());
  const { show } = useToast();
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [modelo, setModelo] = useState("");
  const [itemEstoqueId, setItemEstoqueId] = useState<number | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from("estoque_extra_camisas")
      .select("*")
      .order("modelo_camisa", { ascending: true });
    setEstoque(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega os dados no mount
    carregar();

    const channel = supabase
      .channel("venda-estande-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "estoque_extra_camisas" }, carregar)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, carregar]);

  const estoquePorModelo = MODELOS_CAMISA.map((m) => ({
    ...m,
    itens: estoque.filter((e) => e.modelo_camisa === m.id),
  })).filter((m) => m.itens.length > 0);

  const itensDoModeloSelecionado = estoque.filter((e) => e.modelo_camisa === modelo);

  function validate() {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = "Nome obrigatório";
    if (!isCpfValido(cpf)) e.cpf = "CPF inválido (use 000.000.000-00)";
    if (whatsapp.replace(/\D/g, "").length < 10) e.whatsapp = "WhatsApp inválido";
    if (!modelo) e.modelo = "Escolha o modelo";
    if (!itemEstoqueId) e.tamanho = "Escolha o tamanho";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});

    const item = estoque.find((it) => it.id === itemEstoqueId);
    if (!item) return;

    setEnviando(true);
    const { data, error } = await supabase.rpc("vender_camisa_estande", {
      p_modelo: item.modelo_camisa,
      p_tamanho: item.tamanho_camisa,
      p_corte: item.corte_camisa,
      p_nome_participante: nome,
      p_nome_comprador: nome,
      p_cpf_comprador: cpf,
      p_whatsapp_comprador: whatsapp,
    });
    setEnviando(false);

    if (error) {
      show(error.message || "Não foi possível registrar a venda.", "error");
      return;
    }

    show(`Venda registrada! Pedido ${data?.id}.`);
    setNome("");
    setCpf("");
    setWhatsapp("");
    setModelo("");
    setItemEstoqueId("");
  }

  if (loading) {
    return <div className="px-6 py-16 text-center text-muted">Carregando…</div>;
  }

  return (
    <div className="fade-in mx-auto max-w-[640px] px-6 py-16">
      <div className="mb-8 text-center">
        <h2 className="font-titulo text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-roxo">
          Venda no <em className="italic text-lilas">Estande</em>
        </h2>
        <p className="mt-2 text-sm text-muted">
          Registre uma venda presencial — o estoque abaixo é descontado na hora, pagamento já
          entra como confirmado.
        </p>
        <div className="mx-auto mt-3 h-[3px] w-[60px] rounded-full bg-gradient-to-r from-roxo to-dourado" />
      </div>

      <h3 className="mb-3 font-titulo text-lg font-bold text-roxo">Estoque restante</h3>
      <div className="mb-10 space-y-4">
        {estoquePorModelo.length === 0 && (
          <p className="text-sm text-muted">Nenhum estoque cadastrado.</p>
        )}
        {estoquePorModelo.map((m) => (
          <div key={m.id}>
            <div className="mb-2 text-sm font-semibold text-roxo">{m.nome}</div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {m.itens.map((it) => {
                const restante = it.quantidade_total - it.quantidade_vendida;
                return (
                  <div
                    key={it.id}
                    className={`rounded-lg border p-2 text-center ${
                      restante === 0 ? "border-lilas/40 bg-creme opacity-50" : "border-lilas bg-white"
                    }`}
                  >
                    <div className="font-titulo text-lg font-bold tabular-nums text-roxo">
                      {formatNumero(restante)}
                    </div>
                    <div className="text-[0.68rem] text-muted">
                      {it.corte_camisa === "Babylook" ? `${it.tamanho_camisa} Babylook` : it.tamanho_camisa}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <h3 className="mb-4 font-titulo text-lg font-bold text-roxo">Registrar Venda</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">Nome</label>
          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
          />
          {errors.nome && <div className="mt-1 text-[0.78rem] text-perigo">{errors.nome}</div>}
        </div>

        <div>
          <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">CPF</label>
          <input
            type="text"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
          />
          {errors.cpf && <div className="mt-1 text-[0.78rem] text-perigo">{errors.cpf}</div>}
        </div>

        <div>
          <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">WhatsApp</label>
          <input
            type="text"
            placeholder="DDD + número"
            value={whatsapp}
            onChange={(e) => setWhatsapp(formatWhats(e.target.value))}
            className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
          />
          {errors.whatsapp && <div className="mt-1 text-[0.78rem] text-perigo">{errors.whatsapp}</div>}
        </div>

        <div>
          <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">Modelo</label>
          <select
            value={modelo}
            onChange={(e) => {
              setModelo(e.target.value);
              setItemEstoqueId("");
            }}
            className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
          >
            <option value="">Selecione</option>
            {estoquePorModelo.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
          {errors.modelo && <div className="mt-1 text-[0.78rem] text-perigo">{errors.modelo}</div>}
        </div>

        {modelo && (
          <div>
            <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">
              Tamanho / Corte
            </label>
            <select
              value={itemEstoqueId}
              onChange={(e) => setItemEstoqueId(Number(e.target.value))}
              className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
            >
              <option value="">Selecione</option>
              {itensDoModeloSelecionado.map((it) => {
                const restante = it.quantidade_total - it.quantidade_vendida;
                const label =
                  it.corte_camisa === "Babylook" ? `${it.tamanho_camisa} Babylook` : it.tamanho_camisa;
                return (
                  <option key={it.id} value={it.id} disabled={restante === 0}>
                    {label} — {restante === 0 ? "esgotado" : `${restante} restante(s)`}
                  </option>
                );
              })}
            </select>
            {errors.tamanho && <div className="mt-1 text-[0.78rem] text-perigo">{errors.tamanho}</div>}
          </div>
        )}

        <PrimaryButton type="submit" disabled={enviando} className="w-full">
          {enviando ? <Spinner size={20} /> : "✦ Registrar Venda"}
        </PrimaryButton>
      </form>
    </div>
  );
}
