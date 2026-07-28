# Evidence — Meu Passe

## Structural Evidence

1. **Interactive-element count: 2**
   - CPF `<input type="text">` — `page.tsx:42`
   - `<PrimaryButton type="submit">` (renders `<button>`) — `page.tsx:54` (button def `ui.tsx:72`)

2. **Max nesting depth: 8 levels** (root `div` → `div` → `Card` → `div` → `div` → `div` → `div` →
   `BadgeStatus`, e.g. `page.tsx:30→35→36→93→94→99→102→103`)

3. **Repeated patterns:**
   - `BadgeStatus` used twice for the same purpose (status badge) — `page.tsx:82`, `page.tsx:103`
   - `Alert` used twice (instruction block) — `page.tsx:61`, `page.tsx:69`
   - "ID + nome + status" info sub-block duplicated with different markup between the
     Pendente branch (`page.tsx:79-83`) and the Confirmado branch (`page.tsx:100-104`) — same
     data, different DOM structure (plain div vs centered card)
   - Bordered white card wrapper duplicated with different radii/padding — `page.tsx:75`
     (`rounded-xl border p-4`) vs `page.tsx:94` (`rounded-2xl border-2 p-8`)

4. **Dead props / unused imports: none found** in `page.tsx`.

## Visual Evidence (INFERRED — source-read only, no live browser)

1. **Spacing scale**: `[2, 4, 6, 8, 12, 14.4, 16, 20, 24, 32, 40, 64]` px — 12 distinct values on
   one small page (evidence: `01-evidence` subagent report, citations `page.tsx:39-112`,
   `ui.tsx:9-74`).

2. **Type scale**: 11 distinct fixed sizes clustered `11.52–15.2px` plus a fluid clamp heading
   (`28.8–44.8px`) — `page.tsx:39-106`, `ui.tsx:10`.

3. **Distinct color count: 14** unique token values referenced by this page's render path,
   including two that are defined in `ui.tsx` but never reachable from this page (`Alert
   type="info"`/`type="success"` variants, `Spinner`) — dead branches inflating the surface's
   apparent palette.

4. **Lowest contrast (visual subagent estimate): `text-aviso` #a17a3a on `bg-aviso-bg` #f6eeda ≈
   3.39:1** — below the 4.5:1 AA threshold for the normal-weight body text it's used for
   (`ui.tsx:44`, rendered `page.tsx:61,69`). Confirmed independently by the Accessibility
   subagent (see below) with a full pairwise sweep.

5. **States checklist:**
   - Empty (pre-search): **MISSING** — no explicit empty-state copy/illustration before first
     search.
   - Not-found: PRESENT — `page.tsx:59-65`.
   - Loading (button disabled): PRESENT — `page.tsx:54`.
   - Loading (spinner): **MISSING** — `Spinner` exists in `ui.tsx:81-88` but is never imported
     into `page.tsx`; only the disabled button communicates in-flight state.
   - Error (RPC/network failure): **MISSING** — `buscar()` (`page.tsx:20-27`) destructures only
     `{ data }` from the RPC call, discards `error`, has no try/catch, no error UI branch exists
     anywhere in the file.
   - Success (confirmed): PRESENT — `page.tsx:92-120`.
   - Focus (input): PRESENT but non-standard — `outline-none` removed, replaced only by
     border-color/background shift (`page.tsx:51`), no visible focus ring/shadow.
   - Focus (button): **MISSING** — `PrimaryButton` (`ui.tsx:74`) has no `focus:` classes at all.
   - Disabled: PRESENT — `page.tsx:54`, `ui.tsx:74`.

## Copy & Honesty Evidence

1. Full string inventory captured — see subagent report; no `.env`/secret leakage, no lorem
   ipsum, PIX_CHAVE placeholder ("CHAVE_PIX_A_DEFINIR" if unset) would render literally to real
   users if left unconfigured (`config.ts:23`, `page.tsx:85`) — **operational honesty risk**, not
   a copy-design flaw per se, but noted.

2. **Inflations: none found.**

3. **Dark patterns: none found.**

4. **Jargon:**
   - "acesse seu QR Code" (`page.tsx:31`) assumes the visitor already understands what a QR
     Code is and what to do with it.
   - "PASSE DE ENTRADA" heading (`page.tsx:96`) sits directly above the QR code with zero
     instruction copy ("mostre isso na entrada", "tire um print") anywhere in the file.

5. **Label→behavior mismatches: none found** — the one button does exactly what its label says.

## Weight & Friction Evidence

1. **Initial JS (MEASURED via `npm run build`):** page-unique chunk ≈ 22 KB (raw) containing
   `QRCodeDisplay` + `qrcode.react`. Shared-but-real cost: full `@supabase/supabase-js` client
   (~244 KB raw shared chunk, used via `page.tsx:4,14,23`) ships app-wide because the root
   layout/header already needs auth — not incremental to this page, but confirms the full SDK
   (not a lean query-only client) is what every page pays for. Framework baseline ≈ 640 KB raw.
   Total referenced by `meu-passe.html` ≈ 904 KB raw (uncompressed; real transfer will be
   smaller via gzip/brotli — not measured).

2. **Network requests, primary flow: 1** — `supabase.rpc("buscar_inscricao_por_cpf", ...)`
   (`page.tsx:23`). Client construction itself fires nothing.

3. **Time-to-interactive: N/A** — not measurable in this environment, not estimated.

4. **Idle-screen animation count: 3** — `fade-in` on root div (`page.tsx:30`, plays once),
   `transition` on CPF input (`page.tsx:51`, hover/focus-gated, inert at rest), **`animate-glow`
   continuously looping on the always-visible submit button** (`ui.tsx:74`, unconditional
   className — this is the only *actively animating at rest* element).

5. **Notifications/badges/modals on initial load: none** — all conditional on `result`/`searched`
   state, both `null`/`false` on mount (`page.tsx:16-17`).

## Accessibility Evidence

1. **WCAG AA contrast — 5 of 14 token pairs used on this page FAIL:**
   - `text-aviso` #a17a3a on `bg-aviso-bg` #f6eeda — 3.39:1 FAIL (Alert warn body, `ui.tsx:44`,
     used `page.tsx:61,69`)
   - `text-aviso` on `bg-aviso-bg` — 3.39:1 FAIL (BadgeStatus "Pendente", `ui.tsx:57-61`, used
     `page.tsx:82`)
   - `text-sucesso` #4f7a5c on `bg-sucesso-bg` #e4efe3 — 4.16:1 FAIL (BadgeStatus "Confirmado" /
     check-in badge, `ui.tsx:57-61`, used `page.tsx:103,112`)
   - `text-muted` #7d7495 on white — 4.37:1 FAIL ("Inscrição" label / pendente body text,
     `page.tsx:76,84`)
   - `text-muted` on `bg-creme` — 3.81:1 FAIL (SectionTitle subtitle, `ui.tsx:13`)
   - `text-lilas` #b2a0d2 on `bg-creme` — 2.07:1 FAIL (the italic "Passe" in the `<h2>`,
     `page.tsx:32` — large bold text, still fails the relaxed 3:1 threshold)
   - Everything else (roxo/texto on white/creme, button text on dourado) PASSES comfortably
     (5.4–13:1).

2. **Focus order:** CPF input → submit button. No further focusables exist in any result state
   (`page.tsx:42`, `page.tsx:54`).

3. **Keyboard reachability:** both controls are native `<input>`/`<button>` — YES for both.

4. **ARIA landmarks: 4**, all supplied by the parent layout (`header`, `nav`, `main`, `footer` —
   `Header.tsx`, `AppShell.tsx`, `Footer.tsx`), none authored by the page itself. Zero
   `aria-label`/`role` attributes anywhere in `page.tsx`/`ui.tsx`/`QRCodeDisplay.tsx`.

5. **Skip link: absent** — grepped the whole `src` tree, zero matches, confirmed absent from
   root layout and AppShell.

6. **QR code accessible name: none.** `QRCodeSVG` rendered with only
   `value/size/fgColor/bgColor/level` — no `aria-label`/`title`/`role`
   (`QRCodeDisplay.tsx:8`). A screen-reader user lands on an unlabeled graphic that is, for a
   sighted user, the entire point of the page.
