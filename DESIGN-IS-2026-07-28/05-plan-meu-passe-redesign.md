# Plan — Redesign "Meu Passe"

Input: `04-handoff-prompt.md` (Dieter Rams audit, 13/30, verdict REDESIGN).

## Phase 0: Documentation Discovery

**Sources consulted:**
- `01-evidence.md` (this same audit's evidence file — already carries file:line citations for
  every finding, meets the subagent reporting contract, reused instead of re-querying identical
  facts).
- Direct re-read of `src/app/meu-passe/page.tsx`, `src/components/ui.tsx`,
  `src/components/QRCodeDisplay.tsx`, `src/app/globals.css` (current, post-audit state).
- `src/app/inscricao/page.tsx` — checked for an existing Supabase-error-handling convention to
  reuse rather than invent a new one. Finding: `inscricao/page.tsx` already destructures
  `{ data, error }` from its `.rpc()` call and branches on `error.code`/`error.message` (Postgres
  `23505` unique-violation vs. generic), showing a toast via `useToast()`. **Convention to
  reuse**: check `error` explicitly, never assume `data` absence means "not found."
- Computed (not assumed) WCAG-safe replacement values for the failing derived tokens using the
  standard WCAG relative-luminance formula, verified in all reuse contexts:
  - `--color-aviso`: `#a17a3a` → `#876630` (4.57:1 on `--color-aviso-bg` #f6eeda, was 3.39:1)
  - `--color-sucesso`: `#4f7a5c` → `#4a7256` (4.63:1 on `--color-sucesso-bg` #e4efe3, was 4.16:1)
  - `--color-muted`: `#7d7495` → `#706886` (4.56:1 on `--color-creme`, 5.23:1 on white; was
    3.81:1 / 4.37:1)
  - `--color-lilas` (#B2A0D2, official brand hex) is **not** altered — it fails 3:1 as bold
    heading text on creme (2.07:1) but this is a *usage* problem (using a brand accent as text
    color where the palette doesn't support it), not a token problem. Fix: stop using `lilas` as
    the `<em>` text color in headings; reuse `roxo` (already 5.42:1 on creme) for that emphasis
    instead. `lilas` keeps its existing legitimate uses (borders, backgrounds, decorative
    dividers) untouched.

**Allowed APIs / patterns (confirmed present in this codebase, nothing invented):**
- `useToast()` from `src/components/ToastProvider.tsx` — existing project convention for
  transient feedback, already used in `inscricao/page.tsx`.
- `Spinner` component, already built at `src/components/ui.tsx:81-88`, currently unused —
  import and render it, do not build a new one.
- Tailwind v4 `focus-visible:` variant — no plugin needed, ships in core; use
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-roxo
  focus-visible:ring-offset-2` (matches existing token names already in `@theme`).
- `@media (prefers-reduced-motion: reduce)` and `@media (prefers-color-scheme: dark)` — plain
  CSS, no dependency needed.

**Anti-patterns to avoid:**
- Do not invent a new toast/error-banner component — `Alert` (`ui.tsx`) already supports a
  `type` prop; add `type="error"` mapped to the existing `perigo`/`perigo-bg` tokens (already
  defined in `globals.css`, currently unused by `Alert`) rather than a new component.
- Do not add a CSS/JS animation library for `prefers-reduced-motion` — plain media query wrapping
  the existing `@keyframes` blocks is sufficient and is the standard approach.
- Do not introduce a new color outside the existing token set for any fix in this plan.

## Phase 1 — `globals.css`: reduced-motion, dark-mode-aware contrast fixes, error tokens wiring

**What to implement:**
1. Update `--color-aviso`, `--color-sucesso`, `--color-muted` to the computed values above (three
   one-line value changes in the `:root` block).
2. Wrap `.fade-in`, `.animate-shimmer`, `.animate-glow`, `.animate-spin-slow` animation
   declarations so they're neutralized under `@media (prefers-reduced-motion: reduce)` — set
   `animation: none !important` for all four classes inside that query block.
3. Add a `@media (prefers-color-scheme: dark)` block that remaps the existing semantic
   CSS custom properties (`--background`, `--foreground`, and the light/dark-sensitive ones:
   `--color-texto`, `--color-muted`, card/background surfaces used via `bg-white`/`bg-creme`) to
   darker equivalents, reusing the SAME brand hues (roxo/lilas/azul/verde/dourado stay the same
   hex — only the neutral background/text/surface tokens shift for dark mode, matching how the
   6 official brand colors are typically kept constant across light/dark in this kind of pastel
   editorial brand). Concretely: introduce `--color-creme-dark` / `--color-texto-dark` etc. as a
   dark-surface pair and swap `--background`/`--foreground`/`--color-texto`/`--color-muted` inside
   the dark media query only — do not touch the six official brand tokens.

**Documentation references:** `globals.css:1-121` (current file, full content already read in
Phase 0); values computed and verified in Phase 0 discovery.

**Verification checklist:**
- `grep -n "aviso:\|sucesso:\|muted:" src/app/globals.css` shows the new hex values.
- `grep -n "prefers-reduced-motion\|prefers-color-scheme" src/app/globals.css` returns non-empty
  (currently returns nothing — this is the regression check for principle #9).
- Toggle OS dark mode + "reduce motion" in a browser dev tools emulation and confirm the glow
  animation stops and background/text remap without breaking contrast.

**Anti-pattern guards:** do not touch `--color-roxo`, `--color-lilas`, `--color-azul`,
`--color-verde`, `--color-dourado` hex values anywhere in this phase — those are the fixed brand
palette from the PDF.

## Phase 2 — `ui.tsx`: Alert error variant, Spinner already available, focus ring on PrimaryButton, unify info-card pattern

**What to implement:**
1. `Alert`: add `type="error"` to the existing `type` union, mapped to
   `bg-perigo-bg text-perigo border-perigo/30` (mirrors the existing `warn`/`success`/`info`
   variants already in the component — copy that pattern, don't restructure the component).
2. `PrimaryButton`: append
   `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-roxo-escuro focus-visible:ring-offset-2`
   to its className string.
3. New shared component `InfoCard` (or extend `Card` with a variant prop) in `ui.tsx` that
   renders the "ID + nome + status" block with ONE consistent style
   (`rounded-2xl border border-lilas bg-white p-6`, replacing both the ad-hoc
   `rounded-xl border p-4` and `rounded-2xl border-2 p-8` variants currently duplicated in
   `meu-passe/page.tsx:75` and `page.tsx:94`), accepting children so both the pending and
   confirmed states in Phase 3 reuse it.
4. Consolidate the type scale used by this page's components down to 4 steps reusing Tailwind's
   built-in scale instead of arbitrary rem values: `text-xs` (12px, labels/eyebrow),
   `text-sm` (14px, body), `text-base` (16px, emphasized body/badges), plus the existing
   `font-titulo` fluid clamp for headings. Replace the arbitrary `text-[0.72rem]`,
   `text-[0.78rem]`, `text-[0.82rem]`, `text-[0.85rem]`, `text-[0.88rem]`, `text-[0.9rem]` instances
   inside `ui.tsx` components consumed by this page with the nearest of the 4 steps above.

**Documentation references:** `ui.tsx:1-88` (current file). `Alert`'s existing `type` switch
pattern is the copy-source for the new `error` branch — same file, same component, one more
case.

**Verification checklist:**
- `grep -n 'type="error"' src/components/ui.tsx` and `src/app/meu-passe/page.tsx` after Phase 3
  shows the new variant wired end-to-end.
- Tab to the submit button in a browser and confirm a visible ring appears (regression check for
  principle #8's missing button-focus state).
- `grep -c 'text-\[0\.' src/components/ui.tsx` count decreases from its Phase-0 baseline.

**Anti-pattern guards:** do not create a second, parallel card component — extend/reuse `Card`
and the new `InfoCard` so `meu-passe/page.tsx` has exactly one "info block" pattern, not two.

## Phase 3 — `meu-passe/page.tsx`: six real states, error handling, accessible QR

**What to implement:**
1. Change `buscar()` to destructure `{ data, error }` (matching the `inscricao/page.tsx`
   convention from Phase 0) and branch:
   - `error` truthy → set a new `erro` state string, do NOT touch `searched`/`result`.
   - success → existing `setResult`/`setSearched` logic, and explicitly `setErro(null)` first.
2. Add `loading` UI: while `loading` is true, render the imported `Spinner` (from `ui.tsx`)
   inside/beside the button area instead of relying on the disabled state alone (the disabled
   state stays too, for keyboard/AT users).
3. Add an explicit **empty/pre-search** state: when `!searched && !erro && !loading`, render one
   short line of guidance under the form (e.g. "Digite o CPF usado na inscrição para consultar
   seu passe.") instead of blank space.
4. Add the **error** state: when `erro` is set, render `<Alert type="error">` with a retry-worthy
   message (e.g. "Não conseguimos consultar agora. Verifique sua internet e tente de novo.") —
   distinct from the "CPF não encontrado" not-found message, which stays only for the genuine
   `searched && !result && !erro` case.
5. Replace both the pending-state and confirmed-state "ID + nome + status" blocks
   (`page.tsx:75-88`, `page.tsx:99-117`) with the new shared `InfoCard` from Phase 2, so they
   share one visual pattern.
6. Add usage instruction copy next to "PASSE DE ENTRADA" (`page.tsx:96`), e.g. "Mostre esta tela
   na recepção para o check-in."
7. Give the QR code an accessible name: pass `aria-label="Código de entrada de {result.nome} —
   mostre esta tela na recepção"` through `QRCodeDisplay` → `QRCodeSVG` (`QRCodeDisplay.tsx:8`
   needs a new optional `ariaLabel` prop threaded to the underlying `QRCodeSVG`'s own
   `aria-label`/`role="img"` support — `qrcode.react`'s `QRCodeSVG` accepts standard SVG props
   including `aria-label`; verify by checking `node_modules/qrcode.react`'s type defs before
   relying on this, per the "verify > assume" rule).
8. Replace the `lilas` heading emphasis (`page.tsx:32`, the `<em>` around "Passe") with `roxo`
   per the Phase 0 contrast finding.

**Documentation references:** `inscricao/page.tsx` (error-handling convention to copy),
`ui.tsx` Phase-2 output (`Alert type="error"`, `Spinner`, `InfoCard`, focus-ring
`PrimaryButton`), `QRCodeDisplay.tsx` (current props to extend).

**Verification checklist:**
- Manual QA matrix (from `04-handoff-prompt.md` cutover criteria): pre-search empty state,
  loading spinner visible, simulated RPC error (temporarily throw inside `buscar()` or disconnect
  network) shows the new error Alert and NOT "CPF não encontrado", not-found, pending, confirmed
  — all six visually distinct.
  own labeled region via `aria-label`.
- `npx tsc --noEmit` and `npm run lint` both clean (project standard from prior work in this
  session).

**Anti-pattern guards:** do not let the error state fall through to the not-found message under
any code path — `erro` and `result === null && searched` must be mutually exclusive branches.

## Final Phase: Verification

1. `cd congresso-app && npx tsc --noEmit && npm run lint` — must be clean, matching this
   session's established standard for every prior change.
2. `npm run build` — confirm `/meu-passe` still builds and route size hasn't regressed
   unreasonably (Phase-0 baseline: page-unique chunk ≈22KB).
3. Re-run the six-state manual QA matrix from Phase 3 in the running dev server
   (`http://localhost:3000/meu-passe`).
4. Grep-based regression checks:
   - `grep -n "prefers-reduced-motion\|prefers-color-scheme" src/app/globals.css` non-empty.
   - `grep -n 'type="error"' src/app/meu-passe/page.tsx` present.
   - `grep -n "aria-label" src/components/QRCodeDisplay.tsx` present.
   - `grep -n "focus-visible" src/components/ui.tsx` present.
5. Confirm no brand hex values (`#64579B #B2A0D2 #9FBDDC #B4C8B1 #EBD8BB`) were altered anywhere
   in the diff — only derived/functional tokens and usage sites changed.
