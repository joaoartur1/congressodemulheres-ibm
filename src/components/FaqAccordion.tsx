"use client";

import { useState } from "react";

export function FaqAccordion({
  itens,
}: {
  itens: { id: number; pergunta: string; resposta: string }[];
}) {
  const [abertoId, setAbertoId] = useState<number | null>(itens[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {itens.map((item) => {
        const aberto = abertoId === item.id;
        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-2xl border border-lilas bg-white shadow-[0_2px_10px_rgba(100,87,155,0.06)]"
          >
            <button
              onClick={() => setAbertoId(aberto ? null : item.id)}
              aria-expanded={aberto}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-roxo-escuro focus-visible:ring-offset-2"
            >
              <span className="font-titulo text-base font-bold text-roxo">
                {item.pergunta}
              </span>
              <span
                className={`shrink-0 text-lilas transition-transform ${aberto ? "rotate-45" : ""}`}
              >
                ✦
              </span>
            </button>
            {aberto && (
              <div className="px-5 pb-5 text-sm leading-relaxed text-muted">{item.resposta}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
