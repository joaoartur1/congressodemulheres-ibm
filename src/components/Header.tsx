"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/supabase/types";

const TABS: { href: string; label: string }[] = [
  { href: "/", label: "Início" },
  { href: "/programacao", label: "Cronograma" },
  { href: "/local", label: "Local e Hospedagem" },
  { href: "/inscricao", label: "Inscrição" },
  { href: "/meu-passe", label: "Meu Passe" },
];

export function Header({
  role,
  onLogout,
  onOpenLogin,
}: {
  role: Role | null;
  onLogout: () => void;
  onOpenLogin: () => void;
}) {
  const pathname = usePathname();

  const tabs = [...TABS];
  if (role === "tesouraria") tabs.push({ href: "/gestao", label: "Gestão e Financeiro" });
  if (role === "recepcao") tabs.push({ href: "/checkin", label: "Check-in de Entrada" });

  return (
    <header className="sticky top-0 z-[100] bg-gradient-to-br from-roxo-escuro via-roxo to-lilas px-6 shadow-lg">
      <div className="mx-auto flex max-w-[1100px] items-center gap-2 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/brand/logo_monograma_oval.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0"
          />
          <span className="font-titulo text-lg font-bold leading-tight text-dourado">
            Doce Presença
            <span className="block text-[0.65rem] font-light uppercase tracking-[0.15em] text-lilas">
              Congresso de Mulheres 2026
            </span>
          </span>
        </Link>
        <nav className="scrollbar-hide flex flex-1 items-center gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-[0.45rem] text-[0.78rem] font-medium tracking-wide transition ${
                pathname === t.href
                  ? "bg-white/15 text-white"
                  : "text-lilas hover:bg-white/15 hover:text-white"
              }`}
            >
              {t.label}
            </Link>
          ))}
          {role ? (
            <button
              onClick={onLogout}
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-[0.45rem] text-[0.78rem] font-medium text-[#f3c9cc] transition hover:bg-perigo/20"
            >
              Sair
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-[0.45rem] text-[0.78rem] font-medium text-lilas transition hover:bg-white/15 hover:text-white"
            >
              Acesso da Equipe
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
