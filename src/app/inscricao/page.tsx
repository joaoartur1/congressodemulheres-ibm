"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
} from "@/lib/config";
import type { FaixaEtariaCamisa } from "@/lib/supabase/types";

export default function InscricaoPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const { show } = useToast();

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    whatsapp: "",
    quer_camisa: false,
    modelo_camisa: "",
    corte_camisa: "",
    tamanho_camisa: "",
    faixa_etaria_camisa: "" as FaixaEtariaCamisa | "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const modeloSelecionado = MODELOS_CAMISA.find((m) => m.id === form.modelo_camisa);
  const valorCamisa =
    modeloSelecionado && form.faixa_etaria_camisa
      ? modeloSelecionado.precos[form.faixa_etaria_camisa]
      : null;

  function validate() {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Nome obrigatório";
    if (!isCpfValido(form.cpf)) e.cpf = "CPF inválido (use 000.000.000-00)";
    if (form.whatsapp.replace(/\D/g, "").length < 10) e.whatsapp = "WhatsApp inválido";
    if (form.quer_camisa) {
      if (!form.modelo_camisa) e.modelo_camisa = "Escolha um modelo";
      if (!form.corte_camisa) e.corte_camisa = "Escolha o corte";
      if (!form.tamanho_camisa) e.tamanho_camisa = "Escolha um tamanho";
      if (!form.faixa_etaria_camisa) e.faixa_etaria_camisa = "Escolha a faixa etária";
    }
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

    const tamanhoCompleto =
      form.corte_camisa === "Babylook"
        ? `${form.tamanho_camisa} Babylook`
        : form.tamanho_camisa;

    const { data, error } = await supabase.rpc("criar_inscricao", {
      p_nome: form.nome,
      p_cpf: form.cpf,
      p_whatsapp: form.whatsapp,
      p_quer_camisa: form.quer_camisa,
      p_modelo_camisa: form.quer_camisa ? form.modelo_camisa : null,
      p_tamanho_camisa: form.quer_camisa ? tamanhoCompleto : null,
      p_faixa_etaria_camisa: form.quer_camisa ? (form.faixa_etaria_camisa || null) : null,
    });

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        show("Este CPF já possui uma inscrição.", "error");
      } else {
        show(error.message || "Não foi possível concluir a inscrição.", "error");
      }
      return;
    }

    sessionStorage.setItem("checkout", JSON.stringify(data));
    router.push("/checkout");
  }

  return (
    <div className="fade-in mx-auto max-w-[640px] px-6 py-16">
      <SectionTitle subtitle="Garanta sua vaga no Congresso de Mulheres 2026">
        Faça sua <em className="italic text-lilas">Inscrição</em>
      </SectionTitle>

      <Card>
        <Alert type="info">💜 Inscrição: <strong>R$ {VALOR_BASE},00</strong></Alert>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">
              Nome Completo
            </label>
            <input
              type="text"
              placeholder="Seu nome completo"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
            />
            {errors.nome && <div className="mt-1 text-[0.78rem] text-perigo">{errors.nome}</div>}
          </div>

          <div>
            <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">CPF</label>
            <input
              type="text"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })}
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
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: formatWhats(e.target.value) })}
              className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
            />
            {errors.whatsapp && (
              <div className="mt-1 text-[0.78rem] text-perigo">{errors.whatsapp}</div>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border-2 border-lilas bg-creme px-4 py-3.5 transition hover:border-roxo">
            <input
              type="checkbox"
              checked={form.quer_camisa}
              onChange={(e) =>
                setForm({
                  ...form,
                  quer_camisa: e.target.checked,
                  modelo_camisa: "",
                  corte_camisa: "",
                  tamanho_camisa: "",
                  faixa_etaria_camisa: "",
                })
              }
              className="h-[18px] w-[18px] accent-roxo"
            />
            <span className="text-[0.88rem] font-medium text-texto">Quero a Camisa</span>
          </label>

          {form.quer_camisa && (
            <div className="fade-in space-y-5">
              <Alert type="info">
                O pagamento da camisa é feito separado da inscrição, direto pro PIX da
                responsável pelas camisas — você vai ver os dois PIX na tela seguinte.
              </Alert>

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
                        form.modelo_camisa === m.id
                          ? "border-roxo shadow-[0_0_0_3px_rgba(100,87,155,0.2)]"
                          : "border-lilas hover:border-roxo"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, modelo_camisa: m.id })}
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
                {errors.modelo_camisa && (
                  <div className="mt-1 text-[0.78rem] text-perigo">{errors.modelo_camisa}</div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">
                  Faixa Etária <span className="font-normal text-muted">(define o valor)</span>
                </label>
                <select
                  value={form.faixa_etaria_camisa}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      faixa_etaria_camisa: e.target.value as FaixaEtariaCamisa,
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
                {errors.faixa_etaria_camisa && (
                  <div className="mt-1 text-[0.78rem] text-perigo">
                    {errors.faixa_etaria_camisa}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">
                    Corte
                  </label>
                  <select
                    value={form.corte_camisa}
                    onChange={(e) => setForm({ ...form, corte_camisa: e.target.value })}
                    className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
                  >
                    <option value="">Selecione</option>
                    {CORTES_CAMISA.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.corte_camisa && (
                    <div className="mt-1 text-[0.78rem] text-perigo">{errors.corte_camisa}</div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">
                    Tamanho
                  </label>
                  <select
                    value={form.tamanho_camisa}
                    onChange={(e) => setForm({ ...form, tamanho_camisa: e.target.value })}
                    className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
                  >
                    <option value="">Selecione</option>
                    {TAMANHOS_CAMISA.map((tam) => (
                      <option key={tam} value={tam}>
                        {tam}
                      </option>
                    ))}
                  </select>
                  {errors.tamanho_camisa && (
                    <div className="mt-1 text-[0.78rem] text-perigo">
                      {errors.tamanho_camisa}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5 rounded-[10px] bg-creme px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[0.85rem] text-muted">Inscrição</span>
              <strong className="font-titulo text-lg text-roxo">R$ {VALOR_BASE},00</strong>
            </div>
            {form.quer_camisa && valorCamisa !== null && (
              <div className="flex items-center justify-between">
                <span className="text-[0.85rem] text-muted">
                  Camisa ({modeloSelecionado?.nome})
                </span>
                <strong className="font-titulo text-lg text-roxo">R$ {valorCamisa},00</strong>
              </div>
            )}
          </div>

          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? <Spinner size={20} /> : "✦ Confirmar Inscrição"}
          </PrimaryButton>
        </form>
      </Card>

      {lightbox && (
        <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
