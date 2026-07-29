import { createClient } from "@/lib/supabase/server";
import { SectionTitle } from "@/components/ui";
import { VIDEO_RESUMO_URL, EVENTO } from "@/lib/config";
import { youtubeEmbedUrl } from "@/lib/utils";

export default async function ConhecaOEventoPage() {
  const supabase = await createClient();
  const { data: palestrantes } = await supabase
    .from("palestrantes")
    .select("*")
    .order("ordem", { ascending: true });

  const embedUrl = VIDEO_RESUMO_URL ? youtubeEmbedUrl(VIDEO_RESUMO_URL) : null;

  return (
    <div className="fade-in mx-auto max-w-[1100px] px-6 py-16">
      <SectionTitle subtitle={`Reviva os melhores momentos e conheça quem vai ministrar no ${EVENTO.subtitulo}`}>
        Conheça o <em className="italic text-lilas">Evento</em>
      </SectionTitle>

      <div className="mx-auto max-w-[720px]">
        {embedUrl ? (
          <div className="aspect-video overflow-hidden rounded-2xl border border-lilas shadow-[0_8px_40px_rgba(100,87,155,0.15)]">
            <iframe
              src={embedUrl}
              title={`Vídeo resumo — ${EVENTO.subtitulo}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center rounded-2xl border-2 border-dashed border-lilas bg-white text-center">
            <div className="mb-2 text-4xl">🎬</div>
            <p className="font-titulo text-lg font-semibold text-roxo">Vídeo em breve</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              O resumo do congresso do ano passado estará disponível aqui em breve.
            </p>
          </div>
        )}
      </div>

      <div className="mt-16">
        <h2 className="text-center font-titulo text-2xl font-bold text-roxo">Palestrantes</h2>
        <div className="mx-auto mt-2 mb-10 h-[3px] w-[60px] rounded-full bg-gradient-to-r from-roxo to-dourado" />

        {!palestrantes || palestrantes.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-lilas bg-white p-8 text-center">
            <div className="mb-2 text-3xl">👑</div>
            <p className="font-titulo text-lg font-semibold text-roxo">
              Palestrantes em breve
            </p>
            <p className="mt-2 text-sm text-muted">
              Assim que confirmadas, as palestrantes deste ano aparecem aqui, com foto e um
              resumo de cada uma.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {palestrantes.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-lilas bg-white p-6 text-center shadow-[0_4px_20px_rgba(100,87,155,0.08)]"
              >
                {p.foto_url ? (
                  // Foto vem de URL cadastrada livremente no Supabase — domínio não é
                  // conhecido de antemão para configurar em next.config.ts.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.foto_url}
                    alt={p.nome}
                    className="mx-auto h-28 w-28 rounded-full border-2 border-lilas object-cover"
                  />
                ) : (
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 border-lilas bg-creme text-3xl text-lilas">
                    ✦
                  </div>
                )}
                <div className="mt-4 font-titulo text-xl font-bold text-roxo">{p.nome}</div>
                <p className="mt-1 text-sm leading-relaxed text-muted">{p.resumo}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
