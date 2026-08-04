import Link from "next/link";
import Image from "next/image";
import { EVENTO } from "@/lib/config";
import { ShareInviteButton } from "@/components/ShareInviteButton";
import { Countdown } from "@/components/Countdown";

const ACESSO_RAPIDO = [
  {
    icon: "🗓️",
    titulo: "Cronograma",
    texto: "Veja a programação dos três dias.",
    href: "/programacao",
  },
  {
    icon: "📍",
    titulo: "Local e Hospedagem",
    texto: "Endereço, mapa e hotéis próximos.",
    href: "/local",
  },
  {
    icon: "🎫",
    titulo: "Meu Passe",
    texto: "Consulte sua inscrição e QR Code.",
    href: "/meu-passe",
  },
];

const DESTAQUES = [
  {
    icon: "🌸",
    titulo: "Ela à Imagem Dele",
    texto: '"Somos transformadas de glória em glória, na sua própria imagem" — 2 Coríntios 3:18.',
  },
  {
    icon: "💜",
    titulo: "Comunhão",
    texto: "Três dias de convivência, adoração e palavra ao lado de mulheres da nossa igreja e visitantes.",
  },
  {
    icon: "📖",
    titulo: "Palavra",
    texto: "Momentos de ensino e ministração voltados ao propósito e identidade da mulher em Cristo.",
  },
  {
    icon: "✨",
    titulo: "Presença",
    texto: "Um tempo separado para contemplar e refletir a glória do Senhor.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-gradient-to-br from-roxo-escuro via-roxo to-lilas px-6 py-16 text-center">
        <Image
          src="/brand/logo_arco.png"
          alt=""
          fill
          priority
          className="pointer-events-none object-contain opacity-15"
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-[300px] w-[300px] rounded-full border border-dourado/20" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-[200px] w-[200px] rounded-full border border-white/15" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(235,216,187,0.10) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(178,160,210,0.18) 0%, transparent 50%)",
          }}
        />
        <div className="fade-in relative z-10 max-w-[700px]">
          <span className="animate-shimmer mb-6 inline-block rounded-full border border-dourado/30 bg-dourado/10 px-4 py-1.5 text-[0.72rem] font-medium uppercase tracking-[0.25em] text-dourado">
            ✦ {EVENTO.organizacao}
          </span>
          <h1 className="font-titulo text-[clamp(2.4rem,7vw,4.2rem)] font-bold leading-[1.1] text-white [text-shadow:0_2px_20px_rgba(45,0,87,0.5)]">
            {EVENTO.nomeLinha1} <em className="italic text-dourado">{EVENTO.nomeLinha2}</em>
          </h1>
          <p className="mb-1 mt-3 text-base font-light text-lilas">{EVENTO.subtitulo}</p>
          <p className="mb-2 font-titulo text-lg font-semibold tracking-wide text-dourado">
            {EVENTO.dataLinha}
          </p>
          <p className="mb-10 text-sm italic text-lilas/90">&ldquo;{EVENTO.tema}&rdquo;</p>

          <Link
            href="/inscricao"
            className="animate-glow inline-block rounded-full bg-gradient-to-br from-dourado to-[#f5e7c8] px-10 py-[0.9rem] text-[0.95rem] font-bold uppercase tracking-[0.06em] text-roxo-escuro shadow-[0_4px_20px_rgba(235,216,187,0.6)] transition hover:-translate-y-0.5"
          >
            Quero me Inscrever ✦
          </Link>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <span className="rounded-full border border-white/25 bg-roxo-escuro/50 px-4 py-1.5 text-sm text-white backdrop-blur">
              📍 {EVENTO.local}, {EVENTO.cidade}
            </span>
            <span className="rounded-full border border-white/25 bg-roxo-escuro/50 px-4 py-1.5 text-sm text-white backdrop-blur">
              🗓️ {EVENTO.dataLinha}
            </span>
          </div>
        </div>
      </section>

      <Countdown />

      <div className="fade-in mx-auto max-w-[1100px] px-6 py-16">
        <h2 className="text-center font-titulo text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-roxo">
          Ela à <em className="italic text-lilas">Imagem</em> Dele
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-muted">
          {EVENTO.temaVersiculo}
        </p>
        <div className="mx-auto mt-4 mb-10 h-[3px] w-[60px] rounded-full bg-gradient-to-r from-roxo to-dourado" />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {DESTAQUES.map((d) => (
            <div
              key={d.titulo}
              className="rounded-2xl border border-lilas bg-white p-5 shadow-[0_4px_20px_rgba(100,87,155,0.08)]"
            >
              <div className="mb-2 text-3xl">{d.icon}</div>
              <div className="mb-1 font-titulo text-xl font-bold text-roxo">{d.titulo}</div>
              <p className="text-[0.85rem] leading-relaxed text-muted">{d.texto}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="fade-in bg-lilas/15 px-6 py-16">
        <div className="mx-auto flex max-w-[600px] flex-col items-center text-center">
          <div className="mb-3 text-4xl">🎬</div>
          <h2 className="font-titulo text-2xl font-bold text-roxo">Conheça o Evento</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Reviva os melhores momentos do congresso do ano passado e conheça as palestrantes
            confirmadas para {EVENTO.subtitulo}.
          </p>
          <Link
            href="/conheca-o-evento"
            className="mt-5 inline-block rounded-full border-2 border-roxo px-6 py-2.5 text-sm font-semibold text-roxo transition hover:bg-roxo hover:text-white"
          >
            Ver vídeo e palestrantes ✦
          </Link>
        </div>
      </div>

      <div className="fade-in bg-white px-6 py-16">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="text-center font-titulo text-2xl font-bold text-roxo">Acesso Rápido</h2>
          <div className="mx-auto mt-2 mb-10 h-[3px] w-[60px] rounded-full bg-gradient-to-r from-roxo to-dourado" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {ACESSO_RAPIDO.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="rounded-2xl border border-lilas bg-creme p-5 text-center shadow-[0_4px_20px_rgba(100,87,155,0.06)] transition hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(100,87,155,0.15)]"
              >
                <div className="mb-2 text-3xl">{a.icon}</div>
                <div className="mb-1 font-titulo text-lg font-bold text-roxo">{a.titulo}</div>
                <p className="text-[0.8rem] leading-relaxed text-muted">{a.texto}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="fade-in px-6 py-16">
        <div className="mx-auto flex max-w-[600px] flex-col items-center text-center">
          <div className="mb-3 text-4xl">❓</div>
          <h2 className="font-titulo text-2xl font-bold text-roxo">Perguntas Frequentes</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Dúvidas sobre inscrição, pagamento via PIX ou check-in no dia do evento? A gente já
            respondeu as mais comuns.
          </p>
          <Link
            href="/perguntas-frequentes"
            className="mt-5 inline-block rounded-full border-2 border-roxo px-6 py-2.5 text-sm font-semibold text-roxo transition hover:bg-roxo hover:text-white"
          >
            Ver perguntas frequentes ✦
          </Link>
        </div>
      </div>

      <div className="fade-in bg-lilas/15 px-6 py-16">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-6 sm:flex-row sm:justify-center">
          <Image
            src="/brand/flyer_versao2.png"
            alt={`Convite oficial — ${EVENTO.subtitulo}`}
            width={615}
            height={922}
            className="w-[240px] rounded-2xl shadow-[0_8px_40px_rgba(100,87,155,0.25)] sm:w-[280px]"
          />
          <div className="max-w-sm text-center sm:text-left">
            <h3 className="font-titulo text-2xl font-bold text-roxo">Convite Oficial</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Compartilhe este convite com quem você quer levar ao {EVENTO.subtitulo}.
            </p>
            <ShareInviteButton imageUrl="/brand/flyer_versao2.png" />
          </div>
        </div>
      </div>
    </>
  );
}
