"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";
import { Card, SectionTitle, Alert, PrimaryButton, Spinner } from "@/components/ui";
import { formatCPF, formatWhats, isCpfValido } from "@/lib/utils";
import { VALOR_BASE, VALOR_CAMISA, TAMANHOS_CAMISA } from "@/lib/config";
import type { Database } from "@/lib/supabase/types";

type Estoque = Database["public"]["Tables"]["estoque_camisas"]["Row"];

export default function InscricaoPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const { show } = useToast();

  const [estoque, setEstoque] = useState<Estoque[]>([]);
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    whatsapp: "",
    quer_camisa: false,
    tamanho_camisa: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("estoque_camisas")
      .select("*")
      .then(({ data }) => setEstoque(data ?? []));
  }, [supabase]);

  function disponivel(tam: string) {
    const s = estoque.find((e) => e.tamanho === tam);
    return s ? s.quantidade_total - s.quantidade_vendida : 0;
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Nome obrigatório";
    if (!isCpfValido(form.cpf)) e.cpf = "CPF inválido (use 000.000.000-00)";
    if (form.whatsapp.replace(/\D/g, "").length < 10) e.whatsapp = "WhatsApp inválido";
    if (form.quer_camisa && !form.tamanho_camisa) e.tamanho_camisa = "Escolha um tamanho";
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

    const { data, error } = await supabase.rpc("criar_inscricao", {
      p_nome: form.nome,
      p_cpf: form.cpf,
      p_whatsapp: form.whatsapp,
      p_quer_camisa: form.quer_camisa,
      p_tamanho_camisa: form.quer_camisa ? form.tamanho_camisa : null,
    });

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        show("Este CPF já possui uma inscrição.", "error");
      } else if (error.message?.toLowerCase().includes("esgotado")) {
        show(`Tamanho ${form.tamanho_camisa} esgotado. Escolha outro tamanho.`, "error");
        supabase
          .from("estoque_camisas")
          .select("*")
          .then(({ data }) => setEstoque(data ?? []));
      } else {
        show(error.message || "Não foi possível concluir a inscrição.", "error");
      }
      return;
    }

    sessionStorage.setItem("checkout", JSON.stringify(data));
    router.push("/checkout");
  }

  return (
    <div className="fade-in mx-auto max-w-[560px] px-6 py-16">
      <SectionTitle subtitle="Garanta sua vaga no Congresso de Mulheres 2026">
        Faça sua <em className="italic text-lilas">Inscrição</em>
      </SectionTitle>

      <Card>
        <Alert type="info">
          💜 Inscrição: <strong>R$ {VALOR_BASE},00</strong>
          {VALOR_CAMISA > 0 && (
            <>
              {" "}
              · Camisa adicional: <strong>+R$ {VALOR_CAMISA},00</strong>
            </>
          )}
        </Alert>

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
                setForm({ ...form, quer_camisa: e.target.checked, tamanho_camisa: "" })
              }
              className="h-[18px] w-[18px] accent-roxo"
            />
            <span className="text-[0.88rem] font-medium text-texto">
              Adquirir camisa oficial do congresso
              {VALOR_CAMISA > 0 && <small className="text-roxo"> (+R$ {VALOR_CAMISA},00)</small>}
            </span>
          </label>

          {form.quer_camisa && (
            <div className="fade-in">
              <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">
                Tamanho da Camisa
              </label>
              <select
                value={form.tamanho_camisa}
                onChange={(e) => setForm({ ...form, tamanho_camisa: e.target.value })}
                className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
              >
                <option value="">Selecione</option>
                {TAMANHOS_CAMISA.map((tam) => {
                  const disp = disponivel(tam);
                  return (
                    <option key={tam} value={tam} disabled={disp <= 0}>
                      {tam} — {disp <= 0 ? "Esgotado" : `${disp} disponíveis`}
                    </option>
                  );
                })}
              </select>
              {errors.tamanho_camisa && (
                <div className="mt-1 text-[0.78rem] text-perigo">{errors.tamanho_camisa}</div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between rounded-[10px] bg-creme px-4 py-3">
            <span className="text-[0.85rem] text-muted">Total</span>
            <strong className="font-titulo text-xl text-roxo">
              R$ {VALOR_BASE + (form.quer_camisa ? VALOR_CAMISA : 0)},00
            </strong>
          </div>

          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? <Spinner size={20} /> : "✦ Confirmar Inscrição"}
          </PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
