import { createClient } from "@/lib/supabase/server";
import { SectionTitle } from "@/components/ui";
import { EVENTO } from "@/lib/config";

export default async function ProgramacaoPage() {
  const supabase = await createClient();
  const { data: programacao } = await supabase
    .from("programacao")
    .select("*")
    .order("ordem", { ascending: true });

  const dias = [...new Set((programacao ?? []).map((p) => p.dia))];

  return (
    <div className="fade-in mx-auto max-w-[1100px] px-6 py-16">
      <SectionTitle subtitle="Três dias de comunhão, adoração e palavra">
        Cronograma <em className="italic text-lilas">Completo</em>
      </SectionTitle>

      {dias.length === 0 ? (
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-lilas bg-white p-8 text-center">
          <div className="mb-2 text-3xl">🗓️</div>
          <p className="font-titulo text-lg font-semibold text-roxo">Programação em breve</p>
          <p className="mt-2 text-sm text-muted">
            A agenda detalhada de {EVENTO.dataLinha} ainda está sendo definida. Assim que os
            horários e ministrações forem confirmados, esta página é atualizada automaticamente.
          </p>
        </div>
      ) : (
        <div className="relative pl-8 before:absolute before:left-[0.6rem] before:top-0 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-roxo before:to-lilas">
          {dias.map((dia) => (
            <div key={dia} className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-roxo px-3 py-1 font-titulo text-sm font-bold text-white">
                  {dia}
                </span>
              </div>
              {(programacao ?? [])
                .filter((p) => p.dia === dia)
                .map((p) => (
                  <div
                    key={p.id}
                    className="relative mb-4 rounded-xl border-l-[3px] border-roxo bg-white p-4 shadow-[0_2px_12px_rgba(100,87,155,0.08)] transition hover:translate-x-1 before:absolute before:-left-[2.35rem] before:top-4 before:h-3 before:w-3 before:rounded-full before:border-2 before:border-lilas before:bg-roxo"
                  >
                    <div className="text-[0.72rem] font-semibold tracking-wide text-roxo">
                      {p.horario}
                    </div>
                    <div className="my-0.5 text-[0.95rem] font-semibold text-texto">
                      {p.titulo}
                    </div>
                    {p.preletora && (
                      <div className="text-[0.8rem] text-muted">✦ {p.preletora}</div>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
