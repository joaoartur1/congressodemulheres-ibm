"use client";

import { useEffect, useState } from "react";

const DATA_EVENTO = new Date("2026-08-28T08:00:00-03:00").getTime();

function calcularRestante() {
  const diff = Math.max(0, DATA_EVENTO - Date.now());
  return {
    acabou: diff <= 0,
    dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutos: Math.floor((diff / (1000 * 60)) % 60),
    segundos: Math.floor((diff / 1000) % 60),
  };
}

export function Countdown() {
  const [tempo, setTempo] = useState<ReturnType<typeof calcularRestante> | null>(null);

  useEffect(() => {
    function tick() {
      setTempo(calcularRestante());
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!tempo) {
    return <div className="h-[92px] sm:h-[108px]" />;
  }

  if (tempo.acabou) {
    return (
      <div className="relative z-20 -mt-10 flex justify-center px-6 sm:-mt-12">
        <div className="rounded-2xl bg-gradient-to-br from-dourado to-[#f5e7c8] px-8 py-4 text-center shadow-[0_10px_40px_rgba(45,0,87,0.25)]">
          <p className="font-titulo text-lg font-bold text-roxo-escuro">
            O Congresso já começou — te esperamos lá! 🎉
          </p>
        </div>
      </div>
    );
  }

  const itens = [
    { valor: tempo.dias, label: tempo.dias === 1 ? "dia" : "dias" },
    { valor: tempo.horas, label: "horas" },
    { valor: tempo.minutos, label: "min" },
    { valor: tempo.segundos, label: "seg" },
  ];

  return (
    <div className="relative z-20 -mt-10 flex justify-center px-4 sm:-mt-12 sm:px-6">
      <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-[0_10px_40px_rgba(45,0,87,0.2)] sm:gap-6 sm:px-10 sm:py-5">
        <span className="hidden text-2xl sm:inline">✦</span>
        {itens.map((it, i) => (
          <div key={it.label} className="flex items-center gap-2 sm:gap-6">
            {i > 0 && <div className="h-7 w-px bg-lilas sm:h-8" />}
            <div className="text-center">
              <div className="font-titulo text-xl font-bold leading-none text-roxo tabular-nums sm:text-4xl">
                {it.valor}
              </div>
              <div className="mt-1 text-[0.55rem] uppercase tracking-[0.08em] text-muted sm:text-[0.65rem]">
                {it.label}
              </div>
            </div>
          </div>
        ))}
        <span className="hidden text-2xl sm:inline">✦</span>
      </div>
    </div>
  );
}
