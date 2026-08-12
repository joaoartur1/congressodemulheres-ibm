"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { Card, SectionTitle, Alert, PrimaryButton, Spinner } from "@/components/ui";
import { Lightbox } from "@/components/Lightbox";
import { formatCPF, formatWhats, isCpfValido } from "@/lib/utils";
import {
  VALOR_BASE,
  TAMANHOS_CAMISA,
  CORTES_CAMISA,
  MODELOS_CAMISA,
  FAIXAS_ETARIAS_CAMISA,
  IDADES_CAMISA_INFANTIL,
  PRAZO_CAMISAS,
} from "@/lib/config";
import type { FaixaEtariaCamisa } from "@/lib/supabase/types";

interface CamisaItem {
  nome_participante: string;
  modelo_camisa: string;
  faixa_etaria_camisa: FaixaEtariaCamisa | "";
  corte_camisa: string;
  tamanho_camisa: string;
  idade_crianca: string;
}

function itemVazio(): CamisaItem {
  return {
    nome_participante: "",
    modelo_camisa: "",
    faixa_etaria_camisa: "",
    corte_camisa: "",
    tamanho_camisa: "",
    idade_crianca: "",
  };
}

function valorItem(item: CamisaItem): number | null {
  const modelo = MODELOS_CAMISA.find((m) => m.id === item.modelo_camisa);
  if (!modelo || !item.faixa_etaria_camisa) return null;
  return modelo.precos[item.faixa_etaria_camisa];
}

export default function InscricaoPage() {
  const router = useRouter();
  const { show } = useToast();

  const [camisaFechada, setCamisaFechada] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Date.now() é impuro, não pode rodar durante o render
    setCamisaFechada(Date.now() > new Date(PRAZO_CAMISAS).getTime());
  }, []);

  const [querInscricao, setQuerInscricao] = useState(true);
  const [querCamisa, setQuerCamisa] = useState(false);
  const [dados, setDados] = useState({ nome: "", cpf: "", whatsapp: "" });
  const [camisas, setCamisas] = useState<CamisaItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  function alternarCamisa(marcado: boolean) {
    if (camisaFechada) return;
    setQuerCamisa(marcado);
    setCamisas(marcado ? [itemVazio()] : []);
  }

  function atualizarItem(index: number, patch: Partial<CamisaItem>) {
    setCamisas((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removerItem(index: number) {
    setCamisas((prev) => {
      const novo = prev.filter((_, i) => i !== index);
      if (novo.length === 0) setQuerCamisa(false);
      return novo;
    });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!dados.nome.trim()) e.nome = "Nome obrigatório";
    if (!isCpfValido(dados.cpf)) e.cpf = "CPF inválido (use 000.000.000-00)";
    if (dados.whatsapp.replace(/\D/g, "").length < 10) e.whatsapp = "WhatsApp inválido";

    if (!querInscricao && camisas.length === 0) {
      e.geral = "Escolha ao menos a inscrição ou uma camisa";
    }

    camisas.forEach((item, i) => {
      if (!item.nome_participante.trim()) e[`camisa_${i}_nome`] = "Nome de quem vai usar a camisa";
      if (!item.modelo_camisa) e[`camisa_${i}_modelo`] = "Escolha um modelo";
      if (!item.faixa_etaria_camisa) e[`camisa_${i}_faixa`] = "Escolha a faixa etária";
      if (item.faixa_etaria_camisa === "ate_11") {
        if (!item.idade_crianca) e[`camisa_${i}_idade`] = "Escolha a idade";
      } else if (item.faixa_etaria_camisa === "12_mais") {
        if (!item.corte_camisa) e[`camisa_${i}_corte`] = "Escolha o corte";
        if (!item.tamanho_camisa) e[`camisa_${i}_tamanho`] = "Escolha um tamanho";
      }
    });

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
    setLoading(true);

    const p_camisas = camisas.map((item) => ({
      nome_participante: item.nome_participante,
      modelo_camisa: item.modelo_camisa,
      faixa_etaria_camisa: item.faixa_etaria_camisa,
      corte_camisa: item.faixa_etaria_camisa === "12_mais" ? item.corte_camisa : null,
      tamanho_camisa: item.faixa_etaria_camisa === "12_mais" ? item.tamanho_camisa : null,
      idade_crianca: item.faixa_etaria_camisa === "ate_11" ? Number(item.idade_crianca) : null,
    }));

    const res = await fetch("/api/criar-pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        p_quer_inscricao: querInscricao,
        p_nome: dados.nome,
        p_cpf: dados.cpf,
        p_whatsapp: dados.whatsapp,
        p_camisas,
      }),
    });
    const json = await res.json();

    setLoading(false);

    if (!res.ok) {
      if (json.code === "23505") {
        show("Este CPF já possui uma inscrição.", "error");
      } else {
        show(json.error || "Não foi possível concluir o pedido.", "error");
      }
      return;
    }

    sessionStorage.setItem("checkout", JSON.stringify(json.data));
    router.push("/checkout");
  }

  return (
    <div className="fade-in mx-auto max-w-[640px] px-6 py-16">
      <SectionTitle subtitle="Garanta sua vaga e/ou sua camisa no Congresso de Mulheres 2026">
        Faça seu <em className="italic text-lilas">Pedido</em>
      </SectionTitle>

      <Card>
        {querInscricao && <Alert type="info">💜 Inscrição: <strong>R$ {VALOR_BASE},00</strong></Alert>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border-2 border-lilas bg-creme px-4 py-3.5 transition hover:border-roxo">
            <input
              type="checkbox"
              checked={querInscricao}
              onChange={(e) => setQuerInscricao(e.target.checked)}
              className="h-[18px] w-[18px] accent-roxo"
            />
            <span className="text-[0.88rem] font-medium text-texto">
              Quero me inscrever no congresso
            </span>
          </label>

          {camisaFechada ? (
            <Alert type="warn">
              👕 As vendas de camisa encerraram no dia 13/08 às 23h59. Só é possível se inscrever
              no congresso agora.
            </Alert>
          ) : (
            <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border-2 border-lilas bg-creme px-4 py-3.5 transition hover:border-roxo">
              <input
                type="checkbox"
                checked={querCamisa}
                onChange={(e) => alternarCamisa(e.target.checked)}
                className="h-[18px] w-[18px] accent-roxo"
              />
              <span className="text-[0.88rem] font-medium text-texto">Quero comprar camisa(s)</span>
            </label>
          )}

          {errors.geral && <div className="text-[0.78rem] text-perigo">{errors.geral}</div>}

          <div>
            <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">
              {querInscricao ? "Nome Completo" : "Seu Nome (quem está comprando)"}
            </label>
            <input
              type="text"
              placeholder="Seu nome completo"
              value={dados.nome}
              onChange={(e) => setDados({ ...dados, nome: e.target.value })}
              className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
            />
            {errors.nome && <div className="mt-1 text-[0.78rem] text-perigo">{errors.nome}</div>}
          </div>

          <div>
            <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">CPF</label>
            <input
              type="text"
              placeholder="000.000.000-00"
              value={dados.cpf}
              onChange={(e) => setDados({ ...dados, cpf: formatCPF(e.target.value) })}
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
              value={dados.whatsapp}
              onChange={(e) => setDados({ ...dados, whatsapp: formatWhats(e.target.value) })}
              className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
            />
            {errors.whatsapp && (
              <div className="mt-1 text-[0.78rem] text-perigo">{errors.whatsapp}</div>
            )}
          </div>

          {querCamisa && (
            <div className="fade-in space-y-5">
              <Alert type="info">
                O pagamento da(s) camisa(s) é feito separado da inscrição, direto pro PIX da
                responsável pelas camisas — você vai ver os PIX na tela seguinte.
              </Alert>

              {camisas.map((item, i) => (
                <div key={i} className="space-y-4 rounded-[14px] border-2 border-dashed border-lilas p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.8rem] font-bold uppercase tracking-wide text-roxo">
                      Camisa {i + 1}
                    </span>
                    {camisas.length > 0 && (
                      <button
                        type="button"
                        onClick={() => removerItem(i)}
                        className="text-[0.78rem] font-semibold text-perigo hover:underline"
                      >
                        ✕ Remover
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">
                      Nome de quem vai usar
                    </label>
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={item.nome_participante}
                      onChange={(e) => atualizarItem(i, { nome_participante: e.target.value })}
                      className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
                    />
                    {errors[`camisa_${i}_nome`] && (
                      <div className="mt-1 text-[0.78rem] text-perigo">{errors[`camisa_${i}_nome`]}</div>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-[0.82rem] font-semibold text-roxo">
                      Escolha o Modelo{" "}
                      <span className="font-normal text-muted">(toque na lupa pra ampliar)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {MODELOS_CAMISA.map((m) => (
                        <div
                          key={m.id}
                          className={`relative overflow-hidden rounded-xl border-2 transition ${
                            item.modelo_camisa === m.id
                              ? "border-roxo shadow-[0_0_0_3px_rgba(100,87,155,0.2)]"
                              : "border-lilas hover:border-roxo"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => atualizarItem(i, { modelo_camisa: m.id })}
                            className="block w-full text-left"
                          >
                            <div className="relative aspect-square w-full">
                              <Image src={m.imagem} alt={m.nome} fill className="object-cover" />
                            </div>
                            <div className="p-2">
                              <div className="text-xs font-bold text-roxo">{m.nome}</div>
                              <div className="text-[0.7rem] text-muted">{m.tipo}</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            aria-label={`Ampliar imagem — ${m.nome}`}
                            onClick={() => setLightbox({ src: m.imagem, alt: m.nome })}
                            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-roxo-escuro/60 text-sm text-white backdrop-blur transition hover:bg-roxo-escuro/80"
                          >
                            🔍
                          </button>
                        </div>
                      ))}
                    </div>
                    {errors[`camisa_${i}_modelo`] && (
                      <div className="mt-1 text-[0.78rem] text-perigo">{errors[`camisa_${i}_modelo`]}</div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">
                      Faixa Etária <span className="font-normal text-muted">(define o valor)</span>
                    </label>
                    <select
                      value={item.faixa_etaria_camisa}
                      onChange={(e) =>
                        atualizarItem(i, {
                          faixa_etaria_camisa: e.target.value as FaixaEtariaCamisa,
                          corte_camisa: "",
                          tamanho_camisa: "",
                          idade_crianca: "",
                        })
                      }
                      className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
                    >
                      <option value="">Selecione</option>
                      {FAIXAS_ETARIAS_CAMISA.map((f) => (
                        <option key={f.valor} value={f.valor}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                    {errors[`camisa_${i}_faixa`] && (
                      <div className="mt-1 text-[0.78rem] text-perigo">{errors[`camisa_${i}_faixa`]}</div>
                    )}
                  </div>

                  {item.faixa_etaria_camisa === "ate_11" && (
                    <div>
                      <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">
                        Idade da Criança
                      </label>
                      <select
                        value={item.idade_crianca}
                        onChange={(e) => atualizarItem(i, { idade_crianca: e.target.value })}
                        className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
                      >
                        <option value="">Selecione</option>
                        {IDADES_CAMISA_INFANTIL.map((idade) => (
                          <option key={idade} value={idade}>
                            {idade} {idade === 1 ? "ano" : "anos"}
                          </option>
                        ))}
                      </select>
                      {errors[`camisa_${i}_idade`] && (
                        <div className="mt-1 text-[0.78rem] text-perigo">{errors[`camisa_${i}_idade`]}</div>
                      )}
                    </div>
                  )}

                  {item.faixa_etaria_camisa === "12_mais" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">
                          Corte
                        </label>
                        <select
                          value={item.corte_camisa}
                          onChange={(e) => atualizarItem(i, { corte_camisa: e.target.value })}
                          className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
                        >
                          <option value="">Selecione</option>
                          {CORTES_CAMISA.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        {errors[`camisa_${i}_corte`] && (
                          <div className="mt-1 text-[0.78rem] text-perigo">{errors[`camisa_${i}_corte`]}</div>
                        )}
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">
                          Tamanho
                        </label>
                        <select
                          value={item.tamanho_camisa}
                          onChange={(e) => atualizarItem(i, { tamanho_camisa: e.target.value })}
                          className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
                        >
                          <option value="">Selecione</option>
                          {TAMANHOS_CAMISA.map((tam) => (
                            <option key={tam} value={tam}>
                              {tam}
                            </option>
                          ))}
                        </select>
                        {errors[`camisa_${i}_tamanho`] && (
                          <div className="mt-1 text-[0.78rem] text-perigo">
                            {errors[`camisa_${i}_tamanho`]}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => setCamisas((prev) => [...prev, itemVazio()])}
                className="w-full rounded-[10px] border-2 border-dashed border-lilas py-3 text-[0.85rem] font-semibold text-roxo transition hover:border-roxo hover:bg-creme"
              >
                + Adicionar outra camisa
              </button>
            </div>
          )}

          <div className="space-y-1.5 rounded-[10px] bg-creme px-4 py-3">
            {querInscricao && (
              <div className="flex items-center justify-between">
                <span className="text-[0.85rem] text-muted">Inscrição</span>
                <strong className="font-titulo text-lg text-roxo">R$ {VALOR_BASE},00</strong>
              </div>
            )}
            {camisas.map((item, i) => {
              const valor = valorItem(item);
              if (valor === null) return null;
              return (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[0.85rem] text-muted">
                    Camisa {item.nome_participante || i + 1}
                  </span>
                  <strong className="font-titulo text-lg text-roxo">R$ {valor},00</strong>
                </div>
              );
            })}
          </div>

          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? <Spinner size={20} /> : "✦ Confirmar Pedido"}
          </PrimaryButton>
        </form>
      </Card>

      {lightbox && (
        <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
