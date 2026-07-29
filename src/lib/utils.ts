export function formatCPF(v: string) {
  return v
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    .substring(0, 14);
}

export function formatWhats(v: string) {
  return v.replace(/\D/g, "").substring(0, 11);
}

export function isCpfValido(cpf: string) {
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
}

/** Converte um link normal do YouTube (watch, youtu.be, shorts) em URL de embed. */
export function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let id: string | null = null;

    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.slice(1);
    } else if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2];
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2];
    }

    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}
