# Doce Presença — Congresso de Mulheres 2026

App do congresso da Igreja Batista Missionária: inscrições, pagamento via PIX (confirmação
manual pela tesouraria) e check-in por QR Code, com dados reais compartilhados entre todos os
dispositivos via Supabase.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Supabase (Postgres + Auth + Realtime)
- `qrcode.react` (geração de QR Code) e `jsqr` (leitura via câmera)

## Identidade visual

Cores, tipografia e tema seguem `docs/ID VISUAL CONGRESSO DE MULHERES 2026.pdf`. O título usa
Cormorant Garamond como aproximação livre da fonte "The Youngest Serif" do material de marca
(que é paga e não está disponível via Google Fonts) — se vocês comprarem a fonte original, é só
trocar a importação em `src/app/layout.tsx`. Os elementos florais/arquitetônicos do PDF (glicínias,
arco dourado) ainda não foram aplicados como imagens reais — hoje a UI usa apenas gradientes e
formas em CSS na mesma paleta. Se vocês exportarem os PNGs/SVGs transparentes desses elementos
(do Canva ou onde o material foi criado), eu troco pelos assets reais depois.

## TODO antes de lançar

- **Chave PIX**: preencher `NEXT_PUBLIC_PIX_CHAVE` (env) ou `PIX_CHAVE` em `src/lib/config.ts`.
- **Valor da camisa**: preencher `VALOR_CAMISA` em `src/lib/config.ts` **e** `v_valor_camisa` na
  função `criar_inscricao` em `supabase/migrations/0001_init.sql` (os dois precisam bater).
- **Estoque real de camisas**: os números atuais (P:20, M:30, G:25, GG:15) são os do protótipo
  antigo — edite os `insert into estoque_camisas` na migration antes de rodar, ou ajuste depois
  direto pela Table Editor do Supabase.
- **Programação**: a tabela `programacao` está vazia de propósito — preencha pela Table Editor
  do Supabase quando a agenda for confirmada (não precisa de redeploy).

## 1. Criar o projeto no Supabase e rodar a migration

1. Crie um projeto em [supabase.com](https://supabase.com) (conta pessoal).
2. No painel do projeto, vá em **SQL Editor** → **New query**, cole o conteúdo de
   `supabase/migrations/0001_init.sql` e rode.
3. Em **Project Settings → API**, copie:
   - `Project URL` → vai virar `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → vai virar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → vai virar `SUPABASE_SERVICE_ROLE_KEY` (fica só no servidor, nunca no
     client; não é usada hoje pelo app, mas fica disponível para rotas server-side futuras)

## 2. Criar os dois usuários de equipe

1. No painel do Supabase, vá em **Authentication → Users → Add user** e crie:
   - um usuário para a **tesouraria** (ex: `tesouraria@igreja.org`)
   - um usuário para a **recepção** (ex: `recepcao@igreja.org`)
   - defina uma senha para cada uma (compartilhe com a pessoa responsável por um canal seguro).
2. Copie o **User UID** de cada um (aparece na lista de usuários).
3. No **SQL Editor**, rode para cada uma (trocando o UID e o nome):

   ```sql
   insert into perfis_equipe (id, nome, role) values
     ('UID-DA-TESOURARIA', 'Tesouraria', 'tesouraria'),
     ('UID-DA-RECEPCAO', 'Recepção', 'recepcao');
   ```

## 3. Rodar localmente

```bash
cp .env.local.example .env.local
# preencha as três variáveis do Supabase no .env.local
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## 4. Configurar env vars na Vercel e fazer deploy

1. Crie um projeto na [Vercel](https://vercel.com) (conta pessoal) — pode ser via
   `vercel` (CLI) ou conectando o repositório Git ao projeto pelo dashboard.
2. Em **Project Settings → Environment Variables**, adicione as mesmas três variáveis do
   `.env.local` (Production e Preview).
3. Deploy:
   - Via CLI: `vercel deploy --prod`
   - Ou: conecte o repositório Git ao projeto na Vercel para deploy automático a cada push.

A leitura de QR Code via câmera (`getUserMedia`) só funciona em contexto seguro (HTTPS) — em
produção na Vercel funciona normalmente; em `localhost` também funciona (exceção do navegador).
