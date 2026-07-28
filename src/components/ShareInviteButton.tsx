"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { EVENTO } from "@/lib/config";

export function ShareInviteButton({ imageUrl }: { imageUrl: string }) {
  const { show } = useToast();
  const [loading, setLoading] = useState(false);

  async function compartilhar() {
    setLoading(true);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], "convite-doce-presenca.png", { type: blob.type });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: EVENTO.subtitulo,
          text: `Convite oficial — ${EVENTO.subtitulo}, ${EVENTO.dataLinha}.`,
        });
        return;
      }

      // Sem suporte a compartilhar arquivos (ex: desktop): baixa a imagem e abre o
      // WhatsApp Web com o link do convite pronto para colar.
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = "convite-doce-presenca.png";
      link.click();

      const msg = encodeURIComponent(
        `Convite oficial — ${EVENTO.subtitulo} (${EVENTO.dataLinha}): ${window.location.origin}${imageUrl}`
      );
      window.open(`https://wa.me/?text=${msg}`, "_blank");
      show("Imagem baixada — anexe ela na conversa do WhatsApp que abriu.");
    } catch {
      show("Não foi possível compartilhar. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={compartilhar}
      disabled={loading}
      className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-[0.85rem] font-bold text-white transition hover:bg-[#1DA851] disabled:opacity-60"
    >
      📤 {loading ? "Preparando..." : "Compartilhar no WhatsApp"}
    </button>
  );
}
