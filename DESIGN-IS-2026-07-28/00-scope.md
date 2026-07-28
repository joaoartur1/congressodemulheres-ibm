# Scope — Meu Passe (Doce Presença Congresso de Mulheres 2026)

**Audited surface**: `src/app/meu-passe/page.tsx` (client component), plus its direct
dependencies: `src/components/ui.tsx` (Card, SectionTitle, Alert, PrimaryButton, BadgeStatus),
`src/components/QRCodeDisplay.tsx`, `src/lib/utils.ts` (formatCPF), `src/lib/config.ts`
(PIX_CHAVE), `src/app/globals.css` (design tokens), Supabase RPC `buscar_inscricao_por_cpf`.

Reachable locally at `http://localhost:3000/meu-passe` (dev server running).

**Primary user**: a woman who already registered for the congress (or is checking on behalf of
someone), on her phone, likely away from a desk, possibly after making a PIX payment and wanting
to confirm it went through / retrieve her entry QR code.

**Primary task**: type her CPF, submit, and see one of three outcomes — not found, payment
pending, or payment confirmed (with QR code for entry).

**Constraints**:
- Stack: Next.js 16 App Router + TypeScript + Tailwind CSS v4 + Supabase (client-side query via
  RPC, no server component).
- Brand tokens already fixed project-wide (from `docs/ID VISUAL CONGRESSO DE MULHERES 2026.pdf`):
  colors `--color-roxo #64579B`, `--color-lilas #B2A0D2`, `--color-azul #9FBDDC`,
  `--color-verde #B4C8B1`, `--color-creme #F8EEE2`, `--color-dourado #EBD8BB`, plus derived
  `--color-roxo-escuro`, `--color-texto`, `--color-muted`, `--color-sucesso(-bg)`,
  `--color-perigo(-bg)`, `--color-aviso(-bg)`. Fonts: Cormorant Garamond (`--font-titulo`), Open
  Sans (`--font-corpo`). These tokens are out of scope to change — brand is fixed.
- No deadline given beyond "before launch"; event is 28–30 Aug 2026.
- No dedicated design system doc beyond the token file; consistency is judged against how these
  same primitives (`Card`, `Alert`, `BadgeStatus`, `PrimaryButton`) are used elsewhere in the app
  (inscrição, checkout, gestão, check-in pages).

**Reference designs / competitors**: none supplied. Judge against the rest of this app's own
pages for internal consistency, and against generic "check my ticket status" flows (event
ticketing, e.g. airline check-in, concert will-call) for the class of interaction.

**Out of scope for this audit**: Supabase RPC security/RLS (already audited separately), the
other six pages of the app, backend logic correctness.
