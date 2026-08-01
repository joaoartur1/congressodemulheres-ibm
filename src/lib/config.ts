// Dados do evento — identidade visual real (docs/ID VISUAL CONGRESSO DE MULHERES 2026.pdf)
export const EVENTO = {
  nomeLinha1: "Doce",
  nomeLinha2: "Presença",
  subtitulo: "Congresso de Mulheres 2026",
  organizacao: "Igreja Batista Missionária",
  tema: "Ela à Imagem Dele",
  temaVersiculo:
    '"E todos nós, com o rosto descoberto, contemplando a glória do Senhor, somos transformados de glória em glória na sua própria imagem..." — 2 Coríntios 3:18',
  dataLinha: "28, 29 e 30 de Agosto de 2026",
  local: "Lions Clube",
  cidade: "Santa Inês - MA",
} as const;

// TODO: confirmar com a tesouraria (Fabrícia) antes de lançar. Valor da inscrição
// confirmado em R$100; valor da camisa ainda não foi definido (mencionado como
// pendente de confirmação numa segunda-feira).
export const VALOR_BASE = 100;
export const VALOR_CAMISA = 0; // TODO: preencher valor real da camisa

// TODO: preencher com a chave PIX real antes de lançar (ou mover para
// NEXT_PUBLIC_PIX_CHAVE em variável de ambiente, se preferir não deixar no código).
export const PIX_CHAVE = process.env.NEXT_PUBLIC_PIX_CHAVE || "CHAVE_PIX_A_DEFINIR";
export const PIX_TITULAR = "Igreja Batista Missionária";

export const TAMANHOS_CAMISA = ["P", "M", "G", "GG"] as const;

// Usado para montar o mapa e os links de busca no Google Maps na aba "Local e
// Hospedagem" — texto livre, o Google resolve a geolocalização (não temos o
// endereço exato/coordenadas do Lions Clube cadastrado ainda).
export const ENDERECO_BUSCA = `${EVENTO.local}, ${EVENTO.cidade}`;

// Paleta oficial — docs/ID VISUAL CONGRESSO DE MULHERES 2026.pdf
export const PALETA_CORES = [
  { nome: "Roxo Profundo", hex: "#64579B" },
  { nome: "Lilás", hex: "#B2A0D2" },
  { nome: "Azul Suave", hex: "#9FBDDC" },
  { nome: "Verde Sálvia", hex: "#B4C8B1" },
  { nome: "Creme", hex: "#F8EEE2" },
  { nome: "Dourado", hex: "#EBD8BB" },
] as const;
