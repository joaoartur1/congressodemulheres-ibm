"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { Card, SectionTitle, Alert, PrimaryButton, Spinner } from "@/components/ui";
import { MODELOS_CAMISA } from "@/lib/config";
import { formatCPF, formatWhats, isCpfValido, formatNumero } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type EstoqueItem = Database["public"]["Tables"]["estoque_extra_camisas"]["Row"];

export default function CamisaExtraPage() {
  const router = useRouter();
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
      .channel("camisa-extra-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "estoque_extra_camisas" }, carregar)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, carregar]);

  const estoquePorModelo = MODELOS_CAMISA.map((m) => ({
    ...m,
    itens: estoque.filter((e) => e.modelo_camisa === m.id),
  })).filter((m) => m.itens.some((it) => it.quantidade_total - it.quantidade_vendida > 0));

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
    const res = await fetch("/api/comprar-camisa-extra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        p_nome: nome,
        p_cpf: cpf,
        p_whatsapp: whatsapp,
        p_modelo: item.modelo_camisa,
        p_tamanho: item.tamanho_camisa,
        p_corte: item.corte_camisa,
      }),
    });
    const json = await res.json();
    setEnviando(false);

    if (!res.ok) {
      show(json.error || "Não foi possível concluir o pedido.", "error");
      carregar();
      return;
    }

    sessionStorage.setItem("checkout", JSON.stringify({ inscricao: null, camisas: [json.data] }));
    router.push("/checkout");
  }

  if (loading) {
    return <div className="px-6 py-16 text-center text-muted">Carregando…</div>;
  }

  return (
    <div className="fade-in mx-auto max-w-[640px] px-6 py-16">
      <SectionTitle subtitle="Últimas unidades disponíveis — enquanto durar o estoque">
        Camisa <em className="italic text-lilas">Extra</em>
      </SectionTitle>

      <Card>
        {estoquePorModelo.length === 0 ? (
          <Alert type="warn">
            😢 Todas as camisas extras já foram vendidas. Não há mais estoque disponível.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Alert type="info">
              💜 Estoque limitado — o modelo/tamanho pode esgotar a qualquer momento. Depois de
              pedir, você paga por PIX na tela seguinte.
            </Alert>

            <div>
              <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">Nome</label>
              <input
                type="text"
                placeholder="Seu nome completo"
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
              <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">
                WhatsApp
              </label>
              <input
                type="text"
                placeholder="DDD + número"
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatWhats(e.target.value))}
                className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
              />
              {errors.whatsapp && (
                <div className="mt-1 text-[0.78rem] text-perigo">{errors.whatsapp}</div>
              )}
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
              {errors.modelo && (
                <div className="mt-1 text-[0.78rem] text-perigo">{errors.modelo}</div>
              )}
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
                      it.corte_camisa === "Babylook"
                        ? `${it.tamanho_camisa} Babylook`
                        : it.tamanho_camisa;
                    return (
                      <option key={it.id} value={it.id} disabled={restante === 0}>
                        {label} — {restante === 0 ? "esgotado" : `${formatNumero(restante)} restante(s)`}
                      </option>
                    );
                  })}
                </select>
                {errors.tamanho && (
                  <div className="mt-1 text-[0.78rem] text-perigo">{errors.tamanho}</div>
                )}
              </div>
            )}

            <PrimaryButton type="submit" disabled={enviando} className="w-full">
              {enviando ? <Spinner size={20} /> : "✦ Confirmar Pedido"}
            </PrimaryButton>
          </form>
        )}
      </Card>
    </div>
  );
}
