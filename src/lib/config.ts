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

// Inscrição — TODO: confirmar valor com a tesouraria (Fabrícia) antes de lançar.
export const VALOR_BASE = 100;

// Nome/telefone reais da equipe ficam em variável de ambiente, não
// hardcoded — o repositório é público, e esses dados já aparecem no site
// (checkout/suporte) por natureza, mas não precisam estar escritos no
// código-fonte versionado. Configurar em .env.local (dev) e nas env vars
// do projeto na Vercel (produção/preview).
export const PIX_CHAVE = process.env.NEXT_PUBLIC_PIX_CHAVE!;
export const PIX_TITULAR = process.env.NEXT_PUBLIC_PIX_TITULAR!;
export const PIX_BANCO = "Banco do Brasil";
// WhatsApp da Fabrícia (tesouraria) — recebe a confirmação do PIX da inscrição.
export const WHATSAPP_FABRICIA = process.env.NEXT_PUBLIC_WHATSAPP_FABRICIA!;

// Camisas — por encomenda (sem estoque limitado), pagamento próprio via PIX
// da Rayssa, separado do PIX da inscrição.
export const PIX_CAMISA_CHAVE = process.env.NEXT_PUBLIC_PIX_CAMISA_CHAVE!;
export const PIX_CAMISA_TITULAR = process.env.NEXT_PUBLIC_PIX_CAMISA_TITULAR!;
export const PIX_CAMISA_BANCO = "Banco Inter";
// WhatsApp da Rayssa — recebe a confirmação do PIX da camisa.
export const WHATSAPP_RAYSSA = process.env.NEXT_PUBLIC_WHATSAPP_RAYSSA!;

// Pedidos de camisa só são aceitos até essa data/hora (horário de Brasília,
// mesmo fuso de Santa Inês - MA). Depois disso o formulário esconde a opção
// de comprar camisa — e o servidor (criar_pedido) também recusa o pedido,
// mesmo que alguém chame a API direto.
export const PRAZO_CAMISAS = "2026-08-13T23:59:59-03:00";

export const TAMANHOS_CAMISA = ["PP", "P", "M", "G", "GG", "XG"] as const;
export const CORTES_CAMISA = ["Normal", "Babylook"] as const;

export const FAIXAS_ETARIAS_CAMISA = [
  { valor: "ate_11", label: "11 anos ou menos" },
  { valor: "12_mais", label: "12 anos ou mais" },
] as const;

// Camisa infantil (11 anos ou menos) não escolhe tamanho BR — só a idade.
export const IDADES_CAMISA_INFANTIL = Array.from({ length: 11 }, (_, i) => i + 1);

export const MODELOS_CAMISA = [
  {
    id: "oficial",
    nome: "Camisa Oficial",
    tipo: "Oficial",
    imagem: "/camisas/modelo-01-oficial.jpg",
    precos: { ate_11: 65, "12_mais": 70 },
  },
  {
    id: "escolhida",
    nome: "Escolhida",
    tipo: "Opcional",
    imagem: "/camisas/modelo-02-escolhida.jpg",
    precos: { ate_11: 60, "12_mais": 65 },
  },
  {
    id: "virtuosa",
    nome: "Virtuosa",
    tipo: "Opcional",
    imagem: "/camisas/modelo-03-virtuosa.jpg",
    precos: { ate_11: 60, "12_mais": 65 },
  },
  {
    id: "abencoada",
    nome: "Abençoada",
    tipo: "Opcional",
    imagem: "/camisas/modelo-04-abencoada.jpg",
    precos: { ate_11: 60, "12_mais": 65 },
  },
  {
    id: "amada",
    nome: "Amada",
    tipo: "Opcional",
    imagem: "/camisas/modelo-05-amada.jpg",
    precos: { ate_11: 60, "12_mais": 65 },
  },
  {
    id: "protegida",
    nome: "Protegida",
    tipo: "Opcional",
    imagem: "/camisas/modelo-06-protegida.jpg",
    precos: { ate_11: 60, "12_mais": 65 },
  },
] as const;

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

// Playlist "Doce Presença - Ela à imagem dEle" no Spotify.
export const SPOTIFY_PLAYLIST_URL = "https://open.spotify.com/playlist/0qmkG9oOoiZqFCzTc8dS0U";

// Suporte — dúvidas sobre o funcionamento do site (não inscrição/pagamento).
export const NOME_DEV = "João Artur";
export const WHATSAPP_JOAO = process.env.NEXT_PUBLIC_WHATSAPP_JOAO!;
