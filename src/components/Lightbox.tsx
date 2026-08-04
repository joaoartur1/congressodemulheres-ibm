"use client";

import { useEffect } from "react";
import Image from "next/image";

export function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function aoApertarTecla(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", aoApertarTecla);
    return () => document.removeEventListener("keydown", aoApertarTecla);
  }, [onClose]);

  return (
    <div
      className="fade-in fixed inset-0 z-[300] flex flex-col items-center justify-center gap-4 bg-roxo-escuro/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="fixed right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl text-roxo-escuro shadow-lg transition hover:bg-white/90"
      >
        ✕
      </button>

      <div className="relative h-[70vh] w-full max-w-[500px]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <p className="text-center text-xs text-white/70">Toque em qualquer lugar pra fechar</p>

      <button
        onClick={onClose}
        className="w-full max-w-[280px] rounded-full bg-white py-3 text-sm font-bold text-roxo-escuro shadow-lg transition hover:bg-white/90"
      >
        Fechar
      </button>
    </div>
  );
}
