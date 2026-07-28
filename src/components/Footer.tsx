"use client";

import { EVENTO } from "@/lib/config";

export function Footer() {
  return (
    <footer className="bg-roxo-escuro px-6 py-8 text-center text-[0.8rem] text-lilas">
      <p>
        © 2026 {EVENTO.nomeLinha1} {EVENTO.nomeLinha2} · {EVENTO.organizacao}
      </p>
      <p className="mt-1 text-[0.75rem] text-lilas/50">
        {EVENTO.dataLinha} · &ldquo;{EVENTO.tema}&rdquo;
      </p>
    </footer>
  );
}
