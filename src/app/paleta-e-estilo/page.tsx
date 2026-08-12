import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { SectionTitle } from "@/components/ui";
import { PALETA_CORES, EVENTO } from "@/lib/config";

const DICAS_DE_LOOK = [
  "Escolha uma peça principal (vestido, conjunto ou blusa) numa das cores da paleta — roxo, lilás e azul suave são ótimas bases.",
  "Use o dourado com moderação: em acessórios, sapatos ou uma bolsa, para dar um toque de brilho sem exagerar.",
  "Creme e verde sálvia combinam bem como cor neutra de apoio, equilibrando tons mais fortes como o roxo profundo.",
  "Vale misturar duas ou três cores da paleta no mesmo look — elas foram pensadas para combinar entre si.",
];

export default async function PaletaEEstiloPage() {
  const supabase = await createClient();
  const { data: looks } = await supabase
    .from("looks")
    .select("*")
    .order("ordem", { ascending: true });

  return (
    <div className="fade-in mx-auto max-w-[1100px] px-6 py-16">
      <SectionTitle
        subtitle={`Inspire seu look para o ${EVENTO.subtitulo} com as cores oficiais do evento`}
      >
        Paleta e <em className="italic text-lilas">Estilo</em>
      </SectionTitle>

      <div className="relative mx-auto mb-14 aspect-[4/5] w-full max-w-[360px] overflow-hidden rounded-2xl border border-lilas shadow-[0_8px_40px_rgba(100,87,155,0.15)]">
        <Image
          src="/looks/capa-paleta.jpg"
          alt="Paleta de Cores — Doce Presença, Ela à Imagem Dele"
          fill
          sizes="360px"
          className="object-cover"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {PALETA_CORES.map((c) => (
          <div
            key={c.hex}
            className="overflow-hidden rounded-2xl border border-lilas bg-white shadow-[0_2px_10px_rgba(100,87,155,0.08)]"
          >
            <div className="h-20 w-full" style={{ backgroundColor: c.hex }} />
            <div className="p-3 text-center">
              <div className="text-sm font-semibold text-roxo">{c.nome}</div>
              <div className="mt-0.5 font-mono text-xs text-muted">{c.hex}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-14 max-w-[640px]">
        <h2 className="text-center font-titulo text-2xl font-bold text-roxo">
          Como Compor Seu Look
        </h2>
        <div className="mx-auto mt-2 mb-8 h-[3px] w-[60px] rounded-full bg-gradient-to-r from-roxo to-dourado" />
        <ul className="space-y-3">
          {DICAS_DE_LOOK.map((dica) => (
            <li
              key={dica}
              className="flex gap-3 rounded-xl border border-lilas bg-white p-4 text-sm leading-relaxed text-texto shadow-[0_2px_10px_rgba(100,87,155,0.06)]"
            >
              <span className="shrink-0 text-lilas">✦</span>
              {dica}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-16">
        <h2 className="text-center font-titulo text-2xl font-bold text-roxo">
          Looks de Inspiração
        </h2>
        <div className="mx-auto mt-2 mb-10 h-[3px] w-[60px] rounded-full bg-gradient-to-r from-roxo to-dourado" />

        {!looks || looks.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-lilas bg-white p-8 text-center">
            <div className="mb-2 text-3xl">👗</div>
            <p className="font-titulo text-lg font-semibold text-roxo">Looks em breve</p>
            <p className="mt-2 text-sm text-muted">
              Fotos de inspiração de looks nas cores do congresso aparecerão aqui em breve.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {looks.map((look) => (
              <div
                key={look.id}
                className="overflow-hidden rounded-xl border border-lilas shadow-[0_2px_10px_rgba(100,87,155,0.08)]"
              >
                <div className="relative aspect-[3/4]">
                  {/* Foto vem de URL cadastrada livremente no Supabase — domínio não é
                      conhecido de antemão para configurar em next.config.ts. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={look.foto_url}
                    alt={look.legenda ?? "Look de inspiração"}
                    className="h-full w-full object-cover"
                  />
                </div>
                {look.legenda && (
                  <p className="p-2 text-center text-xs text-muted">{look.legenda}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
