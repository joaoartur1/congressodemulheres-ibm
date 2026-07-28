"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/ToastProvider";

export function LoginModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { show } = useToast();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error || !data.user) {
      show("Credenciais inválidas.", "error");
      setLoading(false);
      return;
    }

    const { data: perfil } = await supabase
      .from("perfis_equipe")
      .select("role, nome")
      .eq("id", data.user.id)
      .single();

    setLoading(false);
    onClose();

    if (!perfil) {
      show("Usuária sem perfil de equipe vinculado.", "error");
      await supabase.auth.signOut();
      return;
    }

    show(`Bem-vinda, ${perfil.nome}!`);
    router.push(perfil.role === "tesouraria" ? "/gestao" : "/checkin");
    router.refresh();
  }

  return (
    <Modal title="Acesso da Equipe" subtitle="Entre com seu e-mail e senha" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[0.82rem] font-semibold text-roxo">Senha</label>
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-[10px] border-2 border-lilas bg-creme px-4 py-3 text-sm text-texto outline-none transition focus:border-roxo focus:bg-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-br from-dourado to-[#f5e7c8] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-roxo-escuro shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </Modal>
  );
}
