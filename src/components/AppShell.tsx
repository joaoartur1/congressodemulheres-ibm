"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LoginModal } from "@/components/LoginModal";
import { ToastProvider } from "@/components/ToastProvider";
import type { Role } from "@/lib/supabase/types";

function LoginParamWatcher({ onDetected }: { onDetected: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("login") === "1") onDetected();
  }, [searchParams, onDetected]);
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [role, setRole] = useState<Role | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function loadPerfil() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) setRole(null);
        return;
      }

      const { data: perfil } = await supabase
        .from("perfis_equipe")
        .select("role")
        .eq("id", user.id)
        .single();

      if (active) setRole(perfil?.role ?? null);
    }

    loadPerfil();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => loadPerfil());

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setRole(null);
    router.push("/");
    router.refresh();
  }

  return (
    <ToastProvider>
      <Suspense fallback={null}>
        <LoginParamWatcher onDetected={() => setShowLogin(true)} />
      </Suspense>
      <Header role={role} onLogout={handleLogout} onOpenLogin={() => setShowLogin(true)} />
      <main className="flex-1">{children}</main>
      <Footer />
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </ToastProvider>
  );
}
