"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/supabase/types";

const TABS_PRINCIPAIS: { href: string; label: string }[] = [
  { href: "/", label: "Início" },
  { href: "/programacao", label: "Cronograma" },
  { href: "/inscricao", label: "Inscrição" },
  { href: "/meu-passe", label: "Meu Passe" },
];

const TABS_SECUNDARIAS: { href: string; label: string }[] = [
  { href: "/conheca-o-evento", label: "Conheça o Evento" },
  { href: "/paleta-e-estilo", label: "Paleta e Estilo" },
  { href: "/local", label: "Local e Hospedagem" },
  { href: "/perguntas-frequentes", label: "Perguntas Frequentes" },
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
  const [menuAberto, setMenuAberto] = useState(false);
  const [maisAberto, setMaisAberto] = useState(false);
  const maisRef = useRef<HTMLDivElement>(null);

  const tabsEquipe: { href: string; label: string }[] = [];
  if (role === "tesouraria") tabsEquipe.push({ href: "/gestao", label: "Gestão e Financeiro" });
  if (role === "recepcao") tabsEquipe.push({ href: "/checkin", label: "Check-in de Entrada" });
  if (role === "camisas") tabsEquipe.push({ href: "/gestao-camisas", label: "Gestão de Camisas" });

  const tabsSecundarias = [...TABS_SECUNDARIAS, ...tabsEquipe];
  const todasAsTabs = [...TABS_PRINCIPAIS, ...tabsSecundarias];

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (maisRef.current && !maisRef.current.contains(e.target as Node)) {
        setMaisAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const linkClasse = (href: string) =>
    `whitespace-nowrap rounded-full px-3 py-[0.45rem] text-[0.78rem] font-medium tracking-wide transition ${
      pathname === href
        ? "bg-white/15 text-white"
        : "text-lilas hover:bg-white/15 hover:text-white"
    }`;

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

        {/* Desktop: itens principais sempre visíveis + menu "Mais" pros secundários */}
        <nav className="ml-auto hidden items-center gap-1 sm:flex">
          {TABS_PRINCIPAIS.map((t) => (
            <Link key={t.href} href={t.href} className={linkClasse(t.href)}>
              {t.label}
            </Link>
          ))}

          <div ref={maisRef} className="relative">
            <button
              onClick={() => setMaisAberto((v) => !v)}
              className={`whitespace-nowrap rounded-full px-3 py-[0.45rem] text-[0.78rem] font-medium tracking-wide transition ${
                tabsSecundarias.some((t) => t.href === pathname) || maisAberto
                  ? "bg-white/15 text-white"
                  : "text-lilas hover:bg-white/15 hover:text-white"
              }`}
            >
              Mais {maisAberto ? "▴" : "▾"}
            </button>
            {maisAberto && (
              <div className="fade-in absolute right-0 top-[calc(100%+0.5rem)] w-56 rounded-2xl border border-lilas bg-white p-2 shadow-2xl">
                {tabsSecundarias.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    onClick={() => setMaisAberto(false)}
                    className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      pathname === t.href ? "bg-lilas/25 text-roxo" : "text-texto hover:bg-creme"
                    }`}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {role ? (
            <button
              onClick={onLogout}
              className="whitespace-nowrap rounded-full px-3 py-[0.45rem] text-[0.78rem] font-medium text-[#f3c9cc] transition hover:bg-perigo/20"
            >
              Sair
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="whitespace-nowrap rounded-full px-3 py-[0.45rem] text-[0.78rem] font-medium text-lilas transition hover:bg-white/15 hover:text-white"
            >
              Acesso da Equipe
            </button>
          )}
        </nav>

        {/* Mobile: botão de menu */}
        <button
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-white transition hover:bg-white/15 sm:hidden"
        >
          ⋯
        </button>
      </div>

      {/* Mobile: sidebar com todos os itens */}
      {menuAberto && (
        <div className="fixed inset-0 z-[200] sm:hidden">
          <div
            className="fade-in absolute inset-0 bg-roxo-escuro/70 backdrop-blur-sm"
            onClick={() => setMenuAberto(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[78%] max-w-[300px] flex-col bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-titulo text-lg font-bold text-roxo">Menu</span>
              <button
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-creme text-muted transition hover:bg-lilas hover:text-roxo"
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-col gap-1 overflow-y-auto">
              {todasAsTabs.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={() => setMenuAberto(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition ${
                    pathname === t.href
                      ? "bg-lilas/25 text-roxo"
                      : "text-texto hover:bg-creme"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-lilas/40" />
              {role ? (
                <button
                  onClick={() => {
                    setMenuAberto(false);
                    onLogout();
                  }}
                  className="rounded-lg px-4 py-3 text-left text-sm font-medium text-perigo transition hover:bg-perigo-bg"
                >
                  Sair
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMenuAberto(false);
                    onOpenLogin();
                  }}
                  className="rounded-lg px-4 py-3 text-left text-sm font-medium text-roxo transition hover:bg-creme"
                >
                  Acesso da Equipe
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
