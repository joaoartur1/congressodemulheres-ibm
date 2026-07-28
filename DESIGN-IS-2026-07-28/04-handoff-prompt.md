/make-plan Redesign the "Meu Passe" page of the Doce Presença Congresso de Mulheres 2026 app (`/Users/thaislayla/Desktop/SITE CONGRESSO/congresso-app/src/app/meu-passe/page.tsx`). Current design failed a Dieter Rams audit at 13/30 with critical gaps in principles #8 (Thorough) and #9 (Environmentally friendly), both scoring 0, plus #1 (Innovative), #3 (Aesthetic), and #4 (Understandable) all scoring 1.

Verdict paragraph (quoted from 03-verdict.md):
> REDESIGN. Total score is 13/30, well under the 20-point REFINE threshold, driven by two 0-scores (#8 Thorough, #9 Environmentally friendly) and three 1-scores (#1 Innovative, #3 Aesthetic, #4 Understandable) — the bones need real rework, not a touch-up pass. None of the classic load-bearing 0s (#2 Useful, #4 Understandable, #6 Honest) hit zero outright, but #2 and #6 both carry the same root defect (the swallowed RPC error miscategorizing real failures as "not found"), and #4 is dragged down by an unlabeled QR code and missing usage copy — so the "REDESIGN because a load-bearing principle failed" trigger is present in spirit even before counting the raw total.

Why redesign and not refine: total score (13/30) is well below the 20-point REFINE threshold, with two principles at 0/3 — a touch-up pass cannot fix "4+ states missing" (#8) or "dark mode ignored + motion always on" (#9); both require structural rework of how state and motion are handled, not a style pass.

Preserve from current design:
- Brand tokens as-is — do not introduce new colors/fonts. `--color-roxo #64579B`, `--color-lilas #B2A0D2`, `--color-azul #9FBDDC`, `--color-verde #B4C8B1`, `--color-creme #F8EEE2`, `--color-dourado #EBD8BB` plus derived `roxo-escuro`/`texto`/`muted`/`sucesso(-bg)`/`perigo(-bg)`/`aviso(-bg)` tokens, defined in `src/app/globals.css`. Fonts: Cormorant Garamond (`--font-titulo`) for headings, Open Sans (`--font-corpo`) for body — `src/app/layout.tsx`.
- The core interaction model: type CPF → submit → see status. This is the right primary task and the right minimal input (`page.tsx:37-56`) — do not add extra fields or steps to the happy path.
- The QR code library choice (`qrcode.react` via `src/components/QRCodeDisplay.tsx`) and the backend contract: Supabase RPC `buscar_inscricao_por_cpf(p_cpf text)` (`supabase/migrations/0001_init.sql`) — backend/RLS is out of scope for this redesign, treat its response shape as fixed.
- The three-outcome result model (not-found / pending / confirmed) — the redesign should express these more thoroughly, not replace them with something else.

Discard:
- Silent error handling. `buscar()` (`page.tsx:20-27`) destructures only `{ data }` from the RPC call, discards `error`, has no try/catch — any network/RPC failure renders the same "CPF não encontrado" message as a genuine not-found. Caused failure on principles #2, #6, #8.
- The disabled-button-only loading indicator. `Spinner` is fully built (`ui.tsx:81-88`) but never imported into `page.tsx` — loading state is currently invisible beyond a slightly faded button. Caused failure on principle #8.
- Zero motion/color-scheme accommodation. `animate-glow` applies unconditionally to the submit button (`ui.tsx:74`) with no `prefers-reduced-motion` gate anywhere in `globals.css` (zero grep matches), and there is no `prefers-color-scheme` handling anywhere in the app (zero grep matches). Caused failure on principle #9.
- Unlabeled QR code. `QRCodeSVG` renders with only `value/size/fgColor/bgColor/level` (`QRCodeDisplay.tsx:8`), no `aria-label`/`title` — the entire point of the confirmed-state screen is inaccessible to screen-reader users. Caused failure on principle #4.
- Ad-hoc type scale. 11 distinct font-size values on one page, 8 of them arbitrary rem values clustered 11.52–15.2px with no apparent scale logic (`page.tsx:39-112`, `ui.tsx:9-74`). Caused failure on principle #3.
- Divergent "info card" styling for equivalent content: `page.tsx:75` (`rounded-xl border p-4`) vs. `page.tsx:94` (`rounded-2xl border-2 p-8`) style the same "id + nome + status" concept two different ways depending on payment status. Caused failure on principles #3, #10.

Top 5 moves from the audit (verbatim):
1. #8 Thorough / #6 Honest: Surface real states instead of collapsing everything into found/not-found: catch the RPC `error` in `buscar()` and show a distinct "algo deu errado, tente de novo" state; wire up the already-built (but unused) `Spinner` (`ui.tsx:81-88`) during the request instead of just disabling the button; add a pre-search empty state. Evidence: `page.tsx:20-27` destructures only `{ data }`, no try/catch, no error branch anywhere in the file.
2. #9 Environmentally friendly / #5 Unobtrusive: Gate all CSS animation (`animate-glow`, `fade-in`, `spin`) behind `@media (prefers-reduced-motion: reduce)`, and stop the submit button's glow animating continuously at rest. Add real dark-mode support via `prefers-color-scheme` (currently fully ignored app-wide). Evidence: `globals.css` has zero matches for `prefers-reduced-motion` or `prefers-color-scheme`; `ui.tsx:74` applies `animate-glow` unconditionally.
3. #4 Understandable / Accessibility: Give the QR code an accessible name (`aria-label="Código de entrada — mostre esta tela na recepção"` or similar) and add one line of instruction copy next to "PASSE DE ENTRADA" telling the user what to actually do with it. Evidence: `QRCodeDisplay.tsx:8` passes no `aria-label`/`title`; `page.tsx:96` has a label with no accompanying instruction.
4. #8 Thorough / Accessibility: Fix the 5 of 14 color pairs failing WCAG AA (`text-aviso` on `bg-aviso-bg` 3.39:1, `text-sucesso` on `bg-sucesso-bg` 4.16:1, `text-muted` on white 4.37:1, `text-muted` on `bg-creme` 3.81:1, `text-lilas` on `bg-creme` 2.07:1) and add a visible focus ring to `PrimaryButton` (currently zero `focus:` classes). Evidence: 01-evidence.md Accessibility section, full pairwise contrast sweep; `ui.tsx:44,57-61,74`.
5. #3 Aesthetic / #10 As little design as possible: Collapse the 8 near-duplicate type sizes clustered in 11.52–15.2px into a disciplined 3–4-step type scale, and unify the two divergently-styled "info card" blocks (pending vs. confirmed) into one reusable pattern. Evidence: 01-evidence.md Visual section; `page.tsx:75` (`rounded-xl border p-4`) vs. `page.tsx:94` (`rounded-2xl border-2 p-8`) for structurally equivalent content.

Redesign principles in priority order:
1. #8 Thorough — success looks like: every one of empty / loading / error / not-found / pending / confirmed is an intentional, distinct, tested screen state, with the existing `Spinner` component actually wired in.
2. #4 Understandable — success looks like: a first-time churchgoer, never having seen the app before, knows without asking what the QR code is for and what to do with it, and a screen-reader user gets an equivalent experience via a labeled QR region.
3. #9 Environmentally friendly — success looks like: no animation loops indefinitely without a `prefers-reduced-motion` escape hatch, and the app respects the visitor's OS-level light/dark preference.

Deliverables for the plan:
- New information architecture for the six states of this page (empty, loading, error, not-found, pending, confirmed) as one annotated screen map — not derived from the current found/not-found binary.
- New primary flow wireframe (low-fi, labeled), shown side-by-side against the current implementation for each of the six states.
- One consolidated type-scale + spacing-scale decision (replacing the current 11 ad-hoc sizes / 12 ad-hoc spacing values) applied consistently to both the pending and confirmed info-card patterns so they become one reusable component.
- Accessibility pass: QR code `aria-label`, button focus ring, and the 5 failing WCAG AA pairs re-picked from the existing token set (no new colors) or justified as large/bold text exceptions.
- `prefers-reduced-motion` and `prefers-color-scheme` handling added at the `globals.css` level (project-wide, not just this page), verified against every `animate-*` class currently defined (`fade-in`, `animate-shimmer`, `animate-glow`, `animate-spin-slow`).
- Migration path: none needed (internal redesign of an existing route, no user-facing URL or data-shape change).
- Cutover criteria: old implementation retired the moment the new `page.tsx` passes the same manual QA (search happy path, not-found, pending, confirmed, simulated RPC failure, keyboard-only pass, `prefers-reduced-motion` toggle, OS dark-mode toggle).

Anti-patterns to guard against (specific to REDESIGN):
- Porting the current found/not-found binary under new styling without actually adding the error and empty states.
- Treating the QR-code accessibility fix as optional polish — it's the entire payload of the confirmed-state screen.
- Redesigning the visual style (colors/fonts) when the audit's aesthetic complaint is about scale discipline, not the palette itself — brand tokens are fixed, do not replace them.
- Gating `prefers-reduced-motion` only on this page instead of at the shared `globals.css` keyframe level, leaving every other page's animations still ungated.
- Treating the Preserve list as optional.
