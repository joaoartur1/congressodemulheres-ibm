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

export function formatMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

export function formatNumero(v: number) {
  return v.toLocaleString("pt-BR");
}

export function descricaoTamanhoCamisa(c: {
  faixa_etaria_camisa: string;
  idade_crianca: number | null;
  tamanho_camisa: string | null;
  corte_camisa: string | null;
}) {
  if (c.faixa_etaria_camisa === "ate_11") return `${c.idade_crianca} anos`;
  return c.corte_camisa === "Babylook" ? `${c.tamanho_camisa} Babylook` : (c.tamanho_camisa ?? "");
}
