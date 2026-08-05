"use client";

import { useState } from "react";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import {
  Card,
  SectionTitle,
  Alert,
  PrimaryButton,
  InfoCard,
  BadgeStatus,
  Spinner,
} from "@/components/ui";
import { formatCPF } from "@/lib/utils";
import { PIX_CHAVE, PIX_CAMISA_CHAVE, MODELOS_CAMISA } from "@/lib/config";
import type { PedidoResultado } from "@/lib/supabase/types";

function nomeModelo(modeloId: string) {
  return MODELOS_CAMISA.find((m) => m.id === modeloId)?.nome ?? modeloId;
}

export default function MeuPassePage() {
  const [cpf, setCpf] = useState("");
  const [result, setResult] = useState<PedidoResultado | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function buscar(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setErro(null);

    const res = await fetch("/api/buscar-pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf }),
    });
    const json = await res.json();

    setLoading(false);

    if (!res.ok) {
      setErro(json.error || "Não conseguimos consultar agora. Verifique sua internet e tente de novo.");
      return;
    }

    setResult(json.data ?? null);
    setSearched(true);
  }

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(formatCPF(e.target.value));
    setSearched(false);
    setResult(null);
    setErro(null);
  }

  const inscricao = result?.inscricao ?? null;
  const camisas = result?.camisas ?? [];
  const camisasVinculadas = camisas.filter((c) => inscricao && c.inscricao_id === inscricao.id);
  const camisasAvulsas = camisas.filter((c) => !inscricao || c.inscricao_id !== inscricao.id);
  const nadaEncontrado = !inscricao && camisas.length === 0;
  const tudoPago =
    !!inscricao &&
    inscricao.status_pagamento === "Confirmado" &&
    camisasVinculadas.every((c) => c.status_pagamento === "Confirmado");

  return (
    <div className="fade-in mx-auto max-w-[1100px] px-6 py-16">
      <SectionTitle subtitle="Consulte seu pedido e acesse seu QR Code">
        Meu <em className="italic text-roxo">Passe</em>
      </SectionTitle>

      <div className="mx-auto max-w-[480px]">
        <Card>
          <form onSubmit={buscar} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-roxo">
                Digite seu CPF
              </label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCpfChange}
                className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
              />
            </div>
            <PrimaryButton type="submit" disabled={loading} className="w-full">
              {loading ? <Spinner size={20} /> : "🔍 Buscar Pedido"}
            </PrimaryButton>
          </form>

          {!searched && !erro && !loading && (
            <p className="mt-4 text-center text-sm text-muted">
              Digite o CPF usado no pedido para consultar.
            </p>
          )}

          {erro && (
            <div className="mt-4">
              <Alert type="error">{erro}</Alert>
            </div>
          )}

          {!erro && searched && nadaEncontrado && (
            <div className="mt-4">
              <Alert type="warn">
                CPF não encontrado. Verifique os dados ou faça seu pedido.
              </Alert>
            </div>
          )}

          {!erro && inscricao && !tudoPago && (
            <div className="mt-5 space-y-3">
              <Alert type="warn">
                ⏳ <strong>Pagamento pendente.</strong>
                <br />
                Seu pedido <strong>{inscricao.id}</strong> aguarda confirmação. Após todos os
                pagamentos confirmados, seu QR Code estará disponível aqui.
              </Alert>
              {inscricao.status_pagamento !== "Confirmado" && (
                <InfoCard status="Pendente" id={inscricao.id} nome={inscricao.nome}>
                  <div className="mt-3 text-left text-sm leading-relaxed text-muted">
                    Realize o pagamento da inscrição via PIX para a chave{" "}
                    <strong>{PIX_CHAVE}</strong> e informe à equipe para confirmação.
                  </div>
                </InfoCard>
              )}
              {camisasVinculadas.map((c) => (
                <div key={c.id} className="rounded-xl border border-lilas bg-white p-4 text-left text-sm">
                  <div className="font-semibold text-roxo">
                    👕 {c.nome_participante} — {nomeModelo(c.modelo_camisa)} (
                    {c.faixa_etaria_camisa === "ate_11" ? `${c.idade_crianca} anos` : c.tamanho_camisa})
                  </div>
                  <div className="mt-1">
                    <BadgeStatus status={c.status_pagamento} />
                  </div>
                  {c.status_pagamento !== "Confirmado" && (
                    <div className="mt-2 leading-relaxed text-muted">
                      Pagamento da camisa (separado da inscrição) via PIX para a chave{" "}
                      <strong>{PIX_CAMISA_CHAVE}</strong>.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!erro && inscricao && tudoPago && (
            <div className="mt-6">
              <div className="animate-glow fade-in flex flex-col items-center rounded-2xl border-2 border-lilas bg-white p-8">
                <div className="mb-2 font-titulo text-sm tracking-wide text-muted">
                  PASSE DE ENTRADA
                </div>
                <QRCodeDisplay
                  value={`${inscricao.id}||${inscricao.nome}||${inscricao.cpf}`}
                  size={200}
                  ariaLabel={`Código de entrada de ${inscricao.nome} — mostre esta tela na recepção para o check-in`}
                />
                <p className="mt-2 text-center text-xs text-muted">
                  Mostre esta tela na recepção para o check-in.
                </p>
                <div className="mt-4 text-center">
                  <div className="font-titulo text-3xl font-bold text-roxo">{inscricao.id}</div>
                  <div className="mt-1 text-sm text-texto">{inscricao.nome}</div>
                  <div className="mt-2">
                    <BadgeStatus status="Confirmado" />
                  </div>
                  {camisasVinculadas.map((c) => (
                    <div key={c.id} className="mt-2 rounded-lg bg-lilas/30 px-4 py-2 text-sm text-roxo">
                      <div className="font-semibold">
                        👕 {c.nome_participante} — {nomeModelo(c.modelo_camisa)} (
                        {c.faixa_etaria_camisa === "ate_11" ? `${c.idade_crianca} anos` : c.tamanho_camisa})
                      </div>
                      <div className="mt-1">
                        <BadgeStatus status="Confirmado" />
                      </div>
                    </div>
                  ))}
                  {inscricao.status_presenca && (
                    <div className="mt-2">
                      <span className="inline-flex rounded-full bg-sucesso-bg px-3 py-1 text-xs font-bold text-sucesso">
                        ✓ Check-in Realizado
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!erro && camisasAvulsas.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-titulo text-lg font-bold text-roxo">
                {inscricao ? "Outra(s) camisa(s)" : "Sua(s) camisa(s)"}
              </h3>
              {camisasAvulsas.map((c) => (
                <div key={c.id} className="rounded-xl border border-lilas bg-white p-4 text-left text-sm">
                  <div className="text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                    Código do Pedido
                  </div>
                  <div className="font-titulo text-lg font-bold text-roxo">{c.id}</div>
                  <div className="mt-1 font-semibold text-roxo">
                    👕 {c.nome_participante} — {nomeModelo(c.modelo_camisa)} (
                    {c.faixa_etaria_camisa === "ate_11" ? `${c.idade_crianca} anos` : c.tamanho_camisa})
                  </div>
                  <div className="mt-1">
                    <BadgeStatus status={c.status_pagamento} />
                  </div>
                  {c.status_pagamento !== "Confirmado" && (
                    <div className="mt-2 leading-relaxed text-muted">
                      Pagamento via PIX para a chave <strong>{PIX_CAMISA_CHAVE}</strong>.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
