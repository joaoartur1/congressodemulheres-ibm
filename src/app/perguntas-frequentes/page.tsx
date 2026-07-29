import { createClient } from "@/lib/supabase/server";
import { SectionTitle } from "@/components/ui";
import { FaqAccordion } from "@/components/FaqAccordion";

export default async function PerguntasFrequentesPage() {
  const supabase = await createClient();
  const { data: perguntas } = await supabase
    .from("perguntas_frequentes")
    .select("*")
    .order("ordem", { ascending: true });

  return (
    <div className="fade-in mx-auto max-w-[720px] px-6 py-16">
      <SectionTitle subtitle="Tire suas dúvidas sobre inscrição, pagamento e check-in">
        Perguntas <em className="italic text-lilas">Frequentes</em>
      </SectionTitle>

      {!perguntas || perguntas.length === 0 ? (
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-lilas bg-white p-8 text-center">
          <div className="mb-2 text-3xl">❓</div>
          <p className="font-titulo text-lg font-semibold text-roxo">Nenhuma pergunta ainda</p>
          <p className="mt-2 text-sm text-muted">
            As perguntas frequentes aparecerão aqui assim que forem cadastradas.
          </p>
        </div>
      ) : (
        <FaqAccordion itens={perguntas} />
      )}
    </div>
  );
}
