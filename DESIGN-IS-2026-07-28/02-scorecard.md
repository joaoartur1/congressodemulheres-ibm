# Scorecard — Meu Passe

1. Good design is innovative — Score: 1/3
   Evidence: standard CPF-lookup → status/QR ticketing pattern (01-evidence.md Structural + Copy).
   Justification: imitates the well-known "check my ticket by ID" pattern with a minor
   Brazil-specific variation (CPF instead of order number/email) — no refinement beyond the norm.

2. Good design is useful — Score: 2/3
   Evidence: 2-element happy path (`page.tsx:42,54`) but `buscar()` discards `error` from the RPC
   call (`page.tsx:20-27`), so a genuine network/RPC failure renders the same "CPF não
   encontrado" message as a real not-found — actively misinforms the user about her own
   registration in a failure case.
   Justification: primary task completes in minimal steps for the happy path, but the swallowed
   error means the page can tell a real registrant "you're not registered" when it actually just
   failed to check — a detraction the design disregards rather than handles.

3. Good design is aesthetic — Score: 1/3
   Evidence: 12 spacing values and 11 type sizes on one small page, 8 of them clustered
   11.52–15.2px with no apparent scale logic (01-evidence.md Visual); two structurally-equivalent
   "info card" blocks styled differently (`page.tsx:75` `rounded-xl border p-4` vs `page.tsx:94`
   `rounded-2xl border-2 p-8`).
   Justification: color system is real and consistently applied, but type scale shows no visible
   discipline — this is systemic drift, not 3–5 isolated inconsistencies.

4. Good design is understandable — Score: 1/3
   Evidence: QR code has no usage instruction anywhere near "PASSE DE ENTRADA" (`page.tsx:96`),
   the QR graphic itself has no accessible name for screen readers (`QRCodeDisplay.tsx:8`), and
   the miscategorized error (see #2/#6) means "não encontrado" can mean two different things with
   no way for the user to tell which.
   Justification: more than one control/element is ambiguous — QR usage, QR accessible name, and
   the overloaded not-found message all require the user (or their assistive tech) to guess.

5. Good design is unobtrusive — Score: 2/3
   Evidence: minimal chrome, single white card, no ads/upsells; but `PrimaryButton` carries an
   unconditional, continuously-looping `animate-glow` (`ui.tsx:74`) that is actively animating on
   an otherwise-idle screen (01-evidence.md Weight & Friction, item 4).
   Justification: chrome is quiet overall; the one persistent decorative animation on a
   functional control is the sole thing competing for attention.

6. Good design is honest — Score: 2/3
   Evidence: no marketing inflation, no dark patterns found (Copy & Honesty subagent); but the
   same swallowed-error bug from #2 means the app can present a false claim ("CPF não
   encontrado") when the true state is "we couldn't check."
   Justification: not manipulative or exploitative by design, but there is one concrete scenario
   where the UI states something false about the user's own registration status.

7. Good design is long-lasting — Score: 2/3
   Evidence: serif/pastel editorial visual language with no glassmorphism/neumorphism/brutalist
   trend markers (orchestrator judgment over full page + `ui.tsx`); heavy reliance on emoji
   (🔍⏳👕✓●) as the only iconography throughout `page.tsx`.
   Justification: one dated-ish marker (emoji-as-UI-icon system, which renders inconsistently
   across platforms and reads as informal) keeps this off a clean 3.

8. Good design is thorough down to the last detail — Score: 0/3
   Evidence (01-evidence.md Visual, States checklist): empty/pre-search state MISSING, loading
   spinner MISSING (component exists at `ui.tsx:81-88`, never imported into `page.tsx`), error
   state MISSING entirely (`page.tsx:20-27`), button focus style MISSING (`ui.tsx:74` has no
   `focus:` classes).
   Justification: four states are missing outright, meeting the 0-tier threshold ("4+ states
   missing") exactly.

9. Good design is environmentally friendly — Score: 0/3
   Evidence: raw JS referenced by this route ≈904KB uncompressed (Weight & Friction subagent,
   measured via `npm run build`), continuous idle animation with no
   `prefers-reduced-motion` gating anywhere in `globals.css` (grep returned zero matches), and no
   dark-mode support anywhere in the app (grep for `prefers-color-scheme`/`dark` in
   `globals.css` returned zero matches).
   Justification: per the anchor, "dark mode ignored" alone is sufficient for a 0, independent of
   the 500KB–2MB bundle band and always-on motion, both of which independently corroborate the
   low score.

10. Good design is as little design as possible — Score: 2/3
    Evidence: page itself is lean (2 interactive elements, no nav/upsell clutter — Structural
    subagent); the removable items are the decorative `animate-glow` flourish (#5) and the
    divergent styling between the two equivalent info-card patterns (#3).
    Justification: content-to-chrome ratio is good; two identifiable non-essential design
    choices keep it from a 3.

**Total: 1+2+1+1+2+2+2+0+0+2 = 13/30**
