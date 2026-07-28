export function SectionTitle({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mb-2 text-center">
      <h2 className="font-titulo text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-roxo">
        {children}
      </h2>
      {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
      <div className="mx-auto mt-3 mb-8 h-[3px] w-[60px] rounded-full bg-gradient-to-r from-roxo to-dourado" />
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[20px] border border-lilas bg-white p-8 shadow-[0_8px_40px_rgba(100,87,155,0.1)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Alert({
  type = "info",
  children,
}: {
  type?: "info" | "warn" | "success" | "error";
  children: React.ReactNode;
}) {
  const styles = {
    info: "bg-azul/15 text-roxo-escuro border-azul/40",
    warn: "bg-aviso-bg text-aviso border-aviso/30",
    success: "bg-sucesso-bg text-sucesso border-sucesso/30",
    error: "bg-perigo-bg text-perigo border-perigo/30",
  };
  return (
    <div className={`mb-4 rounded-[10px] border px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}

export function BadgeStatus({ status }: { status: "Pendente" | "Confirmado" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
        status === "Confirmado" ? "bg-sucesso-bg text-sucesso" : "bg-aviso-bg text-aviso"
      }`}
    >
      {status === "Confirmado" ? "✓ Confirmado" : "● Pendente"}
    </span>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`animate-glow rounded-full bg-gradient-to-br from-dourado to-[#f5e7c8] px-10 py-[0.9rem] text-base font-bold uppercase tracking-[0.06em] text-roxo-escuro shadow-[0_4px_20px_rgba(235,216,187,0.6)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-roxo-escuro focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:animate-none ${className}`}
    >
      {children}
    </button>
  );
}

export function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div
      className="animate-spin-slow mx-auto rounded-full border-[3px] border-lilas"
      style={{ width: size, height: size, borderTopColor: "var(--color-roxo)" }}
    />
  );
}

export function InfoCard({
  status,
  id,
  nome,
  children,
}: {
  status: "Pendente" | "Confirmado";
  id: string;
  nome: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-lilas bg-white p-6 text-center">
      <div className="text-xs uppercase tracking-[0.08em] text-muted">Inscrição</div>
      <div className="font-titulo text-2xl font-bold text-roxo">{id}</div>
      <div className="mt-0.5 text-sm text-texto">{nome}</div>
      <div className="mt-2 flex justify-center">
        <BadgeStatus status={status} />
      </div>
      {children}
    </div>
  );
}
