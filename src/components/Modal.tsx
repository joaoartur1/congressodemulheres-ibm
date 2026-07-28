"use client";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fade-in fixed inset-0 z-[200] flex items-center justify-center bg-roxo-escuro/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] rounded-[20px] bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-creme text-muted transition hover:bg-lilas hover:text-roxo"
        >
          ✕
        </button>
        <h3 className="font-titulo text-2xl font-bold text-roxo">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
