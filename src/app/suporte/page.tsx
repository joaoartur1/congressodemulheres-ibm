import { SectionTitle, Card } from "@/components/ui";
import { WHATSAPP_JOAO, NOME_DEV } from "@/lib/config";

export default function SuportePage() {
  const msg = encodeURIComponent(
    "Olá! Tenho uma dúvida sobre o funcionamento do site do Congresso de Mulheres 2026."
  );
  const whatsLink = `https://wa.me/${WHATSAPP_JOAO}?text=${msg}`;

  return (
    <div className="fade-in mx-auto max-w-[720px] px-6 py-16">
      <SectionTitle subtitle="Dúvidas sobre o funcionamento do site (não sobre inscrição ou pagamento)">
        <em className="italic text-lilas">Suporte</em>
      </SectionTitle>

      <Card className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 border-lilas bg-creme text-4xl">
          👨‍💻
        </div>
        <div className="mt-4 font-titulo text-xl font-bold text-roxo">{NOME_DEV}</div>
        <p className="mt-1 text-sm text-muted">Desenvolvedor do site</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Encontrou algum problema técnico, link quebrado ou dúvida sobre como usar o site? Fale
          direto comigo pelo WhatsApp — esse contato é só pra questões de funcionamento do
          sistema, não pra dúvidas de inscrição ou pagamento (essas ficam com a Fabrícia/Rayssa).
        </p>
        <a href={whatsLink} target="_blank" rel="noreferrer">
          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-[0.9rem] font-bold text-white transition hover:bg-[#1DA851]">
            📱 Falar com {NOME_DEV.split(" ")[0]} no WhatsApp
          </button>
        </a>
      </Card>
    </div>
  );
}
