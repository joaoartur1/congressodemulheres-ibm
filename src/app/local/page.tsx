import { SectionTitle } from "@/components/ui";
import { EVENTO, ENDERECO_BUSCA } from "@/lib/config";

const CATEGORIAS = [
  { icon: "🏨", label: "Hotéis e Pousadas", termo: "hotéis e pousadas" },
  { icon: "🍽️", label: "Restaurantes", termo: "restaurantes" },
  { icon: "💊", label: "Farmácias", termo: "farmácias" },
  { icon: "🏦", label: "Bancos e Caixas Eletrônicos", termo: "bancos" },
  { icon: "🛒", label: "Supermercados", termo: "supermercados" },
];

function linkBusca(termo: string) {
  return `https://www.google.com/maps/search/${encodeURIComponent(`${termo} perto de ${ENDERECO_BUSCA}`)}`;
}

const linkRota = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ENDERECO_BUSCA)}`;
const mapaEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(ENDERECO_BUSCA)}&output=embed`;

export default function LocalPage() {
  return (
    <div className="fade-in mx-auto max-w-[1100px] px-6 py-16">
      <SectionTitle subtitle="Como chegar e onde ficar durante os três dias do congresso">
        Local e <em className="italic text-lilas">Hospedagem</em>
      </SectionTitle>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="rounded-2xl border border-lilas bg-white p-6 shadow-[0_4px_20px_rgba(100,87,155,0.08)]">
            <div className="text-[0.72rem] uppercase tracking-[0.1em] text-muted">
              Endereço do Congresso
            </div>
            <div className="mt-1 font-titulo text-2xl font-bold text-roxo">{EVENTO.local}</div>
            <div className="text-[0.9rem] text-texto">{EVENTO.cidade}</div>
            <a
              href={linkRota}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-roxo px-5 py-2.5 text-[0.82rem] font-semibold text-white transition hover:bg-roxo-escuro"
            >
              🧭 Traçar Rota no Google Maps
            </a>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-lilas shadow-[0_4px_20px_rgba(100,87,155,0.08)]">
            <iframe
              src={mapaEmbedSrc}
              loading="lazy"
              className="h-[320px] w-full border-0"
              title={`Mapa — ${EVENTO.local}, ${EVENTO.cidade}`}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-1 font-titulo text-xl font-bold text-roxo">Está vindo de fora?</h3>
          <p className="mb-5 text-[0.85rem] leading-relaxed text-muted">
            Se você vai em caravana ou vem de outra cidade, aqui estão buscas rápidas no Google
            Maps para o que estiver mais perto do local do congresso — hospedagem, alimentação e
            outros serviços.
          </p>

          <div className="space-y-3">
            {CATEGORIAS.map((c) => (
              <a
                key={c.label}
                href={linkBusca(c.termo)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl border border-lilas bg-white px-5 py-4 shadow-[0_2px_10px_rgba(100,87,155,0.07)] transition hover:border-roxo hover:shadow-[0_4px_20px_rgba(100,87,155,0.12)]"
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">{c.icon}</span>
                  <span className="text-[0.9rem] font-semibold text-texto">{c.label}</span>
                </span>
                <span className="text-lilas">↗</span>
              </a>
            ))}
          </div>

          <p className="mt-5 text-[0.75rem] leading-relaxed text-muted">
            As buscas abrem direto no Google Maps, sempre com os locais mais próximos e
            atualizados — nenhum nome fica cravado aqui, então funciona bem mesmo se um lugar
            fechar ou abrir um novo depois.
          </p>
        </div>
      </div>
    </div>
  );
}
