"use client";

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
  return (
    <div
      className="fade-in fixed inset-0 z-[300] flex items-center justify-center bg-roxo-escuro/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl text-white transition hover:bg-white/25"
      >
        ✕
      </button>
      <div className="relative h-[85vh] w-full max-w-[500px]" onClick={(e) => e.stopPropagation()}>
        <Image src={src} alt={alt} fill className="object-contain" />
      </div>
    </div>
  );
}
