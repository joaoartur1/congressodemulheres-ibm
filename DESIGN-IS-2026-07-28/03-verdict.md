# Verdict — Meu Passe

**REDESIGN.** Total score is 13/30, well under the 20-point REFINE threshold, driven by two
0-scores (#8 Thorough, #9 Environmentally friendly) and three 1-scores (#1 Innovative, #3
Aesthetic, #4 Understandable) — the bones need real rework, not a touch-up pass.

None of the classic load-bearing 0s (#2 Useful, #4 Understandable, #6 Honest) hit zero
outright, but #2 and #6 both carry the same root defect (the swallowed RPC error miscategorizing
real failures as "not found"), and #4 is dragged down by an unlabeled QR code and missing usage
copy — so the "REDESIGN because a load-bearing principle failed" trigger is present in spirit
even before counting the raw total.

## Top 5 highest-leverage moves

1. **#8 Thorough / #6 Honest** — Surface real states instead of collapsing everything into
   found/not-found: catch the RPC `error` in `buscar()` and show a distinct "algo deu errado,
   tente de novo" state; wire up the already-built (but unused) `Spinner` (`ui.tsx:81-88`) during
   the request instead of just disabling the button; add a pre-search empty state.
   Evidence: `page.tsx:20-27` destructures only `{ data }`, no try/catch, no error branch
   anywhere in the file.

2. **#9 Environmentally friendly / #5 Unobtrusive** — Gate all CSS animation (`animate-glow`,
   `fade-in`, `spin`) behind `@media (prefers-reduced-motion: reduce)`, and stop the submit
   button's glow animating continuously at rest. Add real dark-mode support via
   `prefers-color-scheme` (currently fully ignored app-wide).
   Evidence: `globals.css` has zero matches for `prefers-reduced-motion` or
   `prefers-color-scheme`; `ui.tsx:74` applies `animate-glow` unconditionally.

3. **#4 Understandable / Accessibility** — Give the QR code an accessible name
   (`aria-label="Código de entrada — mostre esta tela na recepção"` or similar) and add one line
   of instruction copy next to "PASSE DE ENTRADA" telling the user what to actually do with it.
   Evidence: `QRCodeDisplay.tsx:8` passes no `aria-label`/`title`; `page.tsx:96` has a label with
   no accompanying instruction.

4. **#8 Thorough / Accessibility** — Fix the 5 of 14 color pairs failing WCAG AA
   (`text-aviso` on `bg-aviso-bg` 3.39:1, `text-sucesso` on `bg-sucesso-bg` 4.16:1, `text-muted`
   on white 4.37:1, `text-muted` on `bg-creme` 3.81:1, `text-lilas` on `bg-creme` 2.07:1) and add
   a visible focus ring to `PrimaryButton` (currently zero `focus:` classes).
   Evidence: 01-evidence.md Accessibility section, full pairwise contrast sweep; `ui.tsx:44,57-61,74`.

5. **#3 Aesthetic / #10 As little design as possible** — Collapse the 8 near-duplicate type
   sizes clustered in 11.52–15.2px into a disciplined 3–4-step type scale, and unify the two
   divergently-styled "info card" blocks (pending vs. confirmed) into one reusable pattern.
   Evidence: 01-evidence.md Visual section; `page.tsx:75` (`rounded-xl border p-4`) vs.
   `page.tsx:94` (`rounded-2xl border-2 p-8`) for structurally equivalent content.
