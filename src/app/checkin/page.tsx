"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import { createClient } from "@/lib/supabase/client";
import { PrimaryButton } from "@/components/ui";
import type { Database } from "@/lib/supabase/types";

type Inscricao = Database["public"]["Tables"]["inscricoes"]["Row"];
type Motivo = "ok" | "ja_utilizado" | "pagamento_pendente" | "nao_encontrada";
type Resultado = { ok: boolean; motivo: Motivo; inscricao: Inscricao };

const MENSAGEM_MOTIVO: Record<Motivo, string> = {
  ok: "Entrada Confirmada!",
  ja_utilizado: "QR Code já utilizado",
  pagamento_pendente: "Pagamento pendente — não libera entrada",
  nao_encontrada: "Inscrição não encontrada",
};

export default function CheckinPage() {
  const [supabase] = useState(() => createClient());
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const buscandoRef = useRef(false);

  const [cameraErro, setCameraErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [manualId, setManualId] = useState("");
  const [recentes, setRecentes] = useState<Inscricao[]>([]);
  const resultadoRef = useRef<Resultado | null>(null);

  useEffect(() => {
    resultadoRef.current = resultado;
  }, [resultado]);

  const confirmarPorId = useCallback(
    async (id: string) => {
      if (buscandoRef.current) return;
      buscandoRef.current = true;

      const { data, error } = await supabase.rpc("confirmar_presenca", { p_id: id.trim() });

      if (error || !data?.[0]) {
        buscandoRef.current = false;
        setResultado(null);
        return;
      }

      // Fica travado até a usuária clicar "Escanear Próxima" — se destravasse
      // aqui, a câmera podia ler o mesmo QR Code de novo antes da tela de
      // resultado aparecer, mandando uma segunda confirmação e mostrando
      // "já utilizado" mesmo sendo a primeira leitura de verdade.
      setResultado({ ok: data[0].sucesso, motivo: data[0].motivo, inscricao: data[0].inscricao });
    },
    [supabase]
  );

  // Leitura por câmera
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function iniciarCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          tick();
        }
      } catch {
        setCameraErro("Não foi possível acessar a câmera. Use a busca manual abaixo.");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && !resultadoRef.current) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code?.data) {
            const [id] = code.data.split("||");
            if (id) confirmarPorId(id);
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    iniciarCamera();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [confirmarPorId]);

  // Realtime — outros operadores veem os check-ins em tempo real
  useEffect(() => {
    const channel = supabase
      .channel("checkin-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "inscricoes" },
        (payload) => {
          const row = payload.new as Inscricao;
          if (row.status_presenca) {
            setRecentes((prev) => [row, ...prev.filter((r) => r.id !== row.id)].slice(0, 8));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="fade-in mx-auto max-w-[600px] px-6 py-16">
      <div className="mb-8 text-center">
        <h2 className="font-titulo text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-roxo">
          Check-in de <em className="italic text-lilas">Entrada</em>
        </h2>
        <div className="mx-auto mt-3 h-[3px] w-[60px] rounded-full bg-gradient-to-r from-roxo to-dourado" />
      </div>

      <div
        className={`overflow-hidden rounded-2xl border border-lilas bg-black shadow-lg ${
          resultado ? "hidden" : ""
        }`}
      >
        {cameraErro && (
          <div className="p-6 text-center text-sm text-white">{cameraErro}</div>
        )}
        <video
          ref={videoRef}
          className={`w-full ${cameraErro ? "hidden" : ""}`}
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {resultado && (
        <div
          className={`rounded-2xl border-[3px] p-6 text-center ${
            resultado.ok ? "border-sucesso bg-sucesso-bg/40" : "border-perigo bg-perigo-bg/40"
          }`}
        >
          <div className="text-4xl">{resultado.ok ? "✅" : "🚫"}</div>
          <h3 className="mt-2 font-titulo text-xl font-bold text-roxo">
            {MENSAGEM_MOTIVO[resultado.motivo]}
          </h3>
          <div className="mt-2 font-titulo text-2xl font-bold text-roxo">
            {resultado.inscricao.id}
          </div>
          <div className="text-[0.9rem] text-texto">{resultado.inscricao.nome}</div>
          <button
            onClick={() => {
              setResultado(null);
              buscandoRef.current = false;
            }}
            className="mt-4 w-full rounded-full bg-roxo py-3 text-sm font-bold text-white transition hover:bg-roxo-escuro"
          >
            Escanear Próxima
          </button>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-lilas bg-white p-5">
        <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">
          Busca manual por ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="HRD-XXXXX"
            value={manualId}
            onChange={(e) => setManualId(e.target.value.toUpperCase())}
            className="flex-1 rounded-[10px] border-2 border-lilas bg-creme px-4 py-2.5 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
          />
          <PrimaryButton
            type="button"
            onClick={() => confirmarPorId(manualId)}
            className="px-6 py-2.5 text-[0.8rem]"
          >
            Confirmar
          </PrimaryButton>
        </div>
      </div>

      {recentes.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-2 text-[0.8rem] font-semibold uppercase tracking-wide text-muted">
            Check-ins recentes (equipe)
          </h4>
          <div className="space-y-2">
            {recentes.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-lilas bg-white px-3 py-2 text-[0.82rem]"
              >
                <span className="font-semibold text-roxo">{r.id}</span>
                <span className="text-muted">{r.nome}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
