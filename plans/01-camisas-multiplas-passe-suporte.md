# Plano: Camisas Múltiplas/Sem Inscrição, Liberação de Passe, Dashboard, Suporte

Repo: `/Users/thaislayla/Desktop/SITE CONGRESSO/congresso-app` (Next.js 16 App Router + TS + Tailwind v4 + Supabase). Deploy: Vercel, `https://docepresencaibm.vercel.app`. Evento: 28-30/08/2026.

Execute as fases, em ordem, uma de cada vez, validando (typecheck+lint+build) ao fim de cada fase antes de seguir pra próxima. Cada fase é independente o bastante pra ser retomada num contexto novo lendo só este arquivo.

---

## Decisão de arquitetura (ler antes de tudo)

### O problema
Hoje `inscricoes` tem as colunas de camisa embutidas na própria linha (`quer_camisa`, `modelo_camisa`, `tamanho_camisa`, `faixa_etaria_camisa`, `valor_camisa`, `status_pagamento_camisa`) — só permite **1 camisa por inscrição** e **camisa nunca existe sem inscrição**. Os requisitos 3 e 6 do pedido do usuário quebram as duas premissas.

### Alternativas avaliadas

**A — Tabela própria `pedidos_camisas`, com `inscricao_id` opcional (nullable FK). ESCOLHIDA.**
Cada linha = uma camisa, com seu próprio comprador (CPF/nome/whatsapp) e seu próprio `status_pagamento`. Quando vinculada a uma inscrição, `inscricao_id` aponta pra ela; quando é compra avulsa, fica `null`. A busca por CPF (já o modelo mental usado em "Meu Passe") funciona igual pros dois casos, sem precisar inventar um novo conceito de "número de pedido" pra agrupar itens.

**B — Colunas jsonb dentro de `inscricoes`.** Rejeitada: obrigaria criar uma inscrição "fantasma" pra venda de camisa avulsa, contaminando o dashboard da tesouraria (`/gestao`) com linhas que não são inscrições de verdade. Perde granularidade de RLS/atualização por item (Rayssa não consegue confirmar 1 camisa de cada vez dentro de um jsonb com a mesma facilidade que numa linha própria).

**C — Modelo genérico `pedido` + `itens_pedido` (estilo e-commerce).** Rejeitada por ora: mais "correta" a longo prazo, mas exige reescrever todas as páginas em torno de um conceito novo, para um catálogo fixo de 2 produtos, a ~24 dias do evento. Risco desnecessário.

### Decisões de produto assumidas (avise se algo aqui divergir do que você imaginou)

1. **Passe (QR code / check-in) é exclusivo de quem se inscreveu.** Quem compra só camisa, sem inscrição, não passa por check-in — só retira a camisa depois. "Meu Passe" mostra pra essa pessoa um card de status do(s) pedido(s) de camisa, sem QR.
2. **PIX da camisa continua único por CPF/pedido**, somando todos os itens de camisa daquele comprador — não vira 1 PIX por camisa. A confirmação em "Gestão de Camisas" continua podendo ser feita item a item.
3. **`cpf_comprador` é obrigatório** em cada linha de `pedidos_camisas` (é quem paga e quem busca no "Meu Passe"); **`nome_participante` pode ser outra pessoa** (mãe compra pra filha) e não exige CPF próprio da criança.
4. **Tamanho físico da camisa infantil não é escolhido no site** — só a idade (1 a 11 anos), conforme pedido explícito do usuário. A confecção a partir da idade é decisão de quem produz.
5. Preço da camisa continua só por faixa etária (`ate_11` / `12_mais`, mapa já existente em `MODELOS_CAMISA[].precos`) — a idade exata não muda o preço.

---

## Phase 0 — Arquitetura atual (já levantado, não precisa re-explorar)

### `src/components/ui.tsx` (113 linhas) — componentes a reaproveitar
- `SectionTitle({children, subtitle})` — título de página com sublinhado dourado.
- `Card({children, className})` — `rounded-[20px] border border-lilas bg-white p-8 shadow-[0_8px_40px_rgba(100,87,155,0.1)]`.
- `Alert({type: "info"|"warn"|"success"|"error", children})`.
- `BadgeStatus({status: "Pendente"|"Confirmado"})` — **tipo fechado**, se `pedidos_camisas.status_pagamento` usar os mesmos dois valores, reutiliza direto.
- `PrimaryButton`, `Spinner`, `InfoCard({status, id, nome, children})`.
- Cores via CSS vars em `src/app/globals.css` (`@theme inline`, Tailwind v4 — **não existe** `tailwind.config`): `roxo`, `roxo-escuro`, `lilas`, `azul`, `verde`, `creme`, `dourado`, `texto`, `muted`, pares `sucesso`/`sucesso-bg`, `perigo`/`perigo-bg`, `aviso`/`aviso-bg`.

### Padrão de KPI card (`src/app/gestao/page.tsx:66-71,90-101` e `src/app/gestao-camisas/page.tsx:66-71,90-101`, idênticos)
```tsx
const kpis = [{ label, value, icon, color }, ...];
<div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
  {kpis.map((k) => (
    <div key={k.label} className="rounded-2xl border border-lilas bg-white p-5 text-center shadow-[0_4px_20px_rgba(100,87,155,0.08)]">
      <div className="text-2xl">{k.icon}</div>
      <div className={`font-titulo text-2xl font-bold ${k.color}`}>{k.value}</div>
      <div className="mt-0.5 text-[0.78rem] text-muted">{k.label}</div>
    </div>
  ))}
</div>
```
Padrão de breakdown por categoria (`gestao-camisas/page.tsx:103-120`, "Pedidos por Modelo") — mesma estrutura, grid `sm:grid-cols-3 lg:grid-cols-6`, sem ícone, só número grande + label. **Copiar esse padrão** pros novos cards.

**Formatação de números — confirmado zero tratamento hoje.** `` `R$ ${totalArrecadado}` `` interpolação crua, sem `toLocaleString`, sem `tabular-nums`, sem proteção de quebra de layout. É o ponto exato a corrigir na Fase 7.

### `src/app/perguntas-frequentes/page.tsx` (31 linhas) — padrão a copiar pra página "Suporte"
Server Component (`async function`, `createClient` de `@/lib/supabase/server`), wrapper `fade-in mx-auto max-w-[720px] px-6 py-16`, `SectionTitle` com palavra em itálico lilás, card vazio `rounded-2xl border border-dashed border-lilas bg-white p-8 text-center`.

Botão WhatsApp — padrão real em `src/app/checkout/page.tsx:140-152`:
```tsx
<a href={whatsLink} target="_blank" rel="noreferrer">
  <button className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-[0.9rem] font-bold text-white transition hover:bg-[#1DA851]">
    📱 Texto do botão
  </button>
</a>
```
com `whatsLink = \`https://wa.me/${NUMERO}?text=${encodeURIComponent(msg)}\``.

**Sem precedente**: nenhum avatar circular de foto existe no código hoje. Fallback já usado quando não há foto (`conheca-o-evento/page.tsx`): `<div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 border-lilas bg-creme text-3xl text-lilas">✦</div>`. Usar esse fallback até haver uma foto real do João Artur (perguntar se ele quer mandar uma, como foi feito com a Alessandra Machado — se não mandar, ficar só com o fallback é aceitável).

### `src/app/checkin/page.tsx` (216 linhas) — check-in hoje NÃO valida pagamento
`confirmarPorId` chama só `supabase.rpc("confirmar_presenca", { p_id })` (linha 34). O `sucesso` retornado depende só de `status_presenca` ainda ser `false` — **nenhuma verificação de `status_pagamento` existe hoje, nem client nem server**. `status_pagamento_camisa` nunca é referenciado no arquivo. Isso é o requisito 1: hoje dá pra fazer check-in de gente que não pagou nada.

### `src/components/Header.tsx` (206 linhas) — nav
```ts
const TABS_PRINCIPAIS = [{ href, label }, ...]; // linhas 9-14
const TABS_SECUNDARIAS = [{ href, label }, ...]; // linhas 16-21, aparecem no dropdown "Mais ▾" (desktop) e no sidebar mobile
```
Sem campo de ícone. Adicionar Suporte como `{ href: "/suporte", label: "Suporte" }` em `TABS_SECUNDARIAS`.

### `src/middleware.ts` (65 linhas)
`PROTECTED_ROUTES` é allowlist exata de 3 rotas (`/gestao`, `/checkin`, `/gestao-camisas`), `matcher` também allowlist explícita — `/suporte` **não precisa de nenhuma mudança aqui**, já fica público por padrão.

### `src/lib/utils.ts` (14 linhas, arquivo inteiro)
`isCpfValido` no client é **só regex de formato** (`\d{3}.\d{3}.\d{3}-\d{2}`), não é checksum real. O checksum de verdade só existe no servidor: `cpf_valido(text)` em `supabase/migrations/0009_seguranca_rate_limit.sql:19-59`. **Reaproveitar esse `cpf_valido()`** nas novas RPCs, não reinventar.

### `src/components/QRCodeDisplay.tsx` (26 linhas, arquivo inteiro)
Só recebe `value: string` pronta e desenha; o valor vem de `meu-passe/page.tsx:145` como `` `${result.id}||${result.nome}||${result.cpf}` ``. Mudar a condição de quando o QR aparece não muda o que vai dentro do QR.

### Todo lugar em `.sql` que referencia `status_pagamento`/`status_presenca` (grep completo nas 9 migrations)
- `confirmar_presenca` (`0001_init.sql:216-250`) é a **única função que faz check-in**. Ela só olha `status_presenca`, nunca `status_pagamento`. É aqui que entra o gate do requisito 1.
- Trigger `inscricoes_bloquear_colunas_nao_permitidas` (`0001_init.sql:103-129`, sobrescrita em `0004_camisas_e_palestrantes.sql:46-73`) bloqueia UPDATE direto em qualquer coluna exceto `status_pagamento`/`status_pagamento_camisa`, a não ser que `app.bypass_column_guard` esteja ligado (só dentro de `confirmar_presenca`). **Replicar esse padrão de trigger** pra `pedidos_camisas`.

### `src/app/meu-passe/page.tsx` (186 linhas, versão atual — já usa `/api/buscar-inscricao`)
Condição exata que libera o QR hoje (linha 138): `result.status_pagamento === "Confirmado"` — **não olha `status_pagamento_camisa` nem pra liberar nem pra bloquear**, só mostra como badge informativo. Ou seja: hoje alguém com inscrição paga e camisa pendente já vê e usa o QR. É exatamente o requisito 1.

### Schema atual completo (`src/lib/supabase/types.ts`, `src/lib/config.ts`)
`inscricoes` Row hoje: `id, nome, cpf, whatsapp, quer_camisa, tamanho_camisa, modelo_camisa, faixa_etaria_camisa, valor, valor_camisa, status_pagamento, status_pagamento_camisa, status_presenca, created_at`.

`estoque_camisas` (criada em `0001_init.sql`, nunca dropada) está **morta**: zero referência em código (`src/`) fora do próprio tipo TS, FK removida em `0004_camisas_e_palestrantes.sql:35`. Não precisa migrar dados dela — é lixo órfão de antes do modelo "por encomenda". Pode ser dropada na Fase 1 (opcional, não bloqueia nada).

`MODELOS_CAMISA` (`src/lib/config.ts:40-83`) — 6 modelos, preço só por faixa etária (`precos.ate_11` / `precos["12_mais"]`), igual em todos exceto o "oficial". `TAMANHOS_CAMISA = ["P","M","G","GG"]`, `CORTES_CAMISA = ["Normal","Babylook"]`, `FAIXAS_ETARIAS_CAMISA` com labels. `VALOR_BASE = 100` — **duplicado manualmente** com `v_valor_base := 100` dentro da RPC SQL (sem fonte única) — manter esse padrão de duplicação por ora (já existia antes desta mudança), só atualizar os dois lugares juntos se mexer no valor.

Call sites que usam essas constantes de camisa (todos precisam de rework nas fases 4-7): `src/app/inscricao/page.tsx` (todas as 4 constantes, maior superfície), `src/app/checkout/page.tsx` (`MODELOS_CAMISA`), `src/app/meu-passe/page.tsx` (`MODELOS_CAMISA`), `src/app/gestao-camisas/page.tsx` (`MODELOS_CAMISA`), `src/app/gestao/page.tsx` (`MODELOS_CAMISA`, linha 113, só exibição).

---

## Phase 1 — Schema: tabela `pedidos_camisas` + migração de dados existentes

Arquivo novo: `supabase/migrations/0010_pedidos_camisas.sql`.

```sql
-- SEMPRE PRIMEIRO: retrato exato da tabela antes de qualquer alteração.
-- Nenhuma coluna é removida antes de estar copiada aqui + na tabela nova
-- pedidos_camisas (backfill logo abaixo).
create table inscricoes_backup_pre_migracao as select * from inscricoes;

create table pedidos_camisas (
  id text primary key default ('CAM-' || upper(substr(md5(random()::text), 1, 5))),
  inscricao_id text references inscricoes(id) on delete set null,
  cpf_comprador text not null,
  nome_comprador text not null,
  whatsapp_comprador text not null,
  nome_participante text not null,
  modelo_camisa text not null,
  corte_camisa text,
  tamanho_camisa text,
  idade_crianca int,
  faixa_etaria_camisa text not null check (faixa_etaria_camisa in ('ate_11','12_mais')),
  valor numeric not null,
  status_pagamento text not null default 'Pendente' check (status_pagamento in ('Pendente','Confirmado')),
  created_at timestamptz not null default now(),
  check (
    (faixa_etaria_camisa = 'ate_11' and idade_crianca between 1 and 11 and corte_camisa is null and tamanho_camisa is null)
    or
    (faixa_etaria_camisa = '12_mais' and idade_crianca is null and corte_camisa is not null and tamanho_camisa is not null)
  )
);

create index pedidos_camisas_cpf_comprador_idx on pedidos_camisas (cpf_comprador);
create index pedidos_camisas_inscricao_id_idx on pedidos_camisas (inscricao_id);

-- Backfill: toda inscrição com quer_camisa=true vira 1 linha em pedidos_camisas
insert into pedidos_camisas (
  inscricao_id, cpf_comprador, nome_comprador, whatsapp_comprador, nome_participante,
  modelo_camisa, corte_camisa, tamanho_camisa, idade_crianca, faixa_etaria_camisa,
  valor, status_pagamento, created_at
)
select
  id, cpf, nome, whatsapp, nome,
  modelo_camisa,
  case when faixa_etaria_camisa = '12_mais' then
    -- tamanho_camisa hoje pode ser "M Babylook" etc; corte não existia como coluna própria,
    -- estava embutido no texto do tamanho. Extrai o corte do sufixo " Babylook" se presente.
    case when tamanho_camisa ilike '%babylook%' then 'Babylook' else 'Normal' end
  else null end,
  case when faixa_etaria_camisa = '12_mais' then regexp_replace(tamanho_camisa, '\s*Babylook', '', 'i') else null end,
  case when faixa_etaria_camisa = 'ate_11' then 11 else null end, -- idade exata não existia antes; usa 11 (limite superior da faixa) como valor conservador de migração
  faixa_etaria_camisa,
  valor_camisa,
  coalesce(status_pagamento_camisa, 'Pendente'),
  created_at
from inscricoes
where quer_camisa = true;

-- Remove as colunas de camisa de inscricoes — dados já preservados em pedidos_camisas acima.
alter table inscricoes
  drop column quer_camisa,
  drop column tamanho_camisa,
  drop column modelo_camisa,
  drop column faixa_etaria_camisa,
  drop column valor_camisa,
  drop column status_pagamento_camisa;

-- RLS
alter table pedidos_camisas enable row level security;

create policy "equipe_select_pedidos_camisas" on pedidos_camisas
  for select using (
    exists (select 1 from perfis_equipe pe where pe.id = auth.uid() and pe.role in ('tesouraria','camisas'))
  );

create policy "camisas_update_pedidos_camisas" on pedidos_camisas
  for update
  using (exists (select 1 from perfis_equipe pe where pe.id = auth.uid() and pe.role = 'camisas'))
  with check (exists (select 1 from perfis_equipe pe where pe.id = auth.uid() and pe.role = 'camisas'));

-- Trigger de coluna-guarda (mesmo padrão de inscricoes_bloquear_colunas_nao_permitidas)
create or replace function pedidos_camisas_bloquear_colunas_nao_permitidas()
returns trigger language plpgsql as $$
begin
  if new.id is distinct from old.id
    or new.inscricao_id is distinct from old.inscricao_id
    or new.cpf_comprador is distinct from old.cpf_comprador
    or new.nome_comprador is distinct from old.nome_comprador
    or new.whatsapp_comprador is distinct from old.whatsapp_comprador
    or new.nome_participante is distinct from old.nome_participante
    or new.modelo_camisa is distinct from old.modelo_camisa
    or new.corte_camisa is distinct from old.corte_camisa
    or new.tamanho_camisa is distinct from old.tamanho_camisa
    or new.idade_crianca is distinct from old.idade_crianca
    or new.faixa_etaria_camisa is distinct from old.faixa_etaria_camisa
    or new.valor is distinct from old.valor
  then
    raise exception 'Apenas status_pagamento pode ser alterado por este canal';
  end if;
  return new;
end;
$$;

create trigger pedidos_camisas_guarda_colunas
  before update on pedidos_camisas
  for each row execute function pedidos_camisas_bloquear_colunas_nao_permitidas();

-- estoque_camisas está morta desde a 0004 (zero referência em código/RPC) — remove de vez.
drop table if exists estoque_camisas;
```

**Verificação desta fase:**
- Rodar no SQL Editor do Supabase.
- `select count(*) from pedidos_camisas` deve bater com `select count(*) from inscricoes_backup_pre_migracao where quer_camisa` — **antes de rodar, tirar um `select * from inscricoes` e guardar o resultado** (ou `create table inscricoes_backup_pre_migracao as select * from inscricoes` como primeira linha da migração, pra conferência) — dado real de produção sendo alterado, conferir antes de seguir pra Fase 2.
- Confirmar `\d inscricoes` não tem mais as 6 colunas de camisa.
- Confirmar `\d pedidos_camisas` tem a constraint de check.

---

## Phase 2 — RPCs: `criar_pedido`, `buscar_pedido_por_cpf`, `confirmar_presenca` com gate de pagamento

Arquivo novo: `supabase/migrations/0011_rpcs_pedido_unificado.sql`.

### `criar_pedido` (substitui `criar_inscricao`)
Aceita inscrição opcional + array de camisas (0 a N), numa transação só — cobre os 3 cenários (só inscrição, só camisa(s), os dois juntos).

```sql
drop function if exists criar_inscricao(text, text, text, boolean, text, text, text);

create or replace function criar_pedido(
  p_quer_inscricao boolean,
  p_nome text,
  p_cpf text,
  p_whatsapp text,
  p_camisas jsonb default '[]'::jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_inscricao inscricoes;
  v_inscricao_id text := null;
  v_camisas_criadas jsonb := '[]'::jsonb;
  v_item jsonb;
  v_valor_camisa numeric;
  v_faixa text;
  v_modelo text;
  v_nova_camisa pedidos_camisas;
  v_cpf_limpo text := regexp_replace(p_cpf, '[^0-9]', '', 'g');
  v_valor_base numeric := 100; -- manter sincronizado com VALOR_BASE em src/lib/config.ts
  v_precos_camisa jsonb := '{
    "oficial":   {"ate_11": 65, "12_mais": 70},
    "escolhida": {"ate_11": 60, "12_mais": 65},
    "virtuosa":  {"ate_11": 60, "12_mais": 65},
    "abencoada": {"ate_11": 60, "12_mais": 65},
    "amada":     {"ate_11": 60, "12_mais": 65},
    "protegida": {"ate_11": 60, "12_mais": 65}
  }'::jsonb;
begin
  if not cpf_valido(p_cpf) then
    raise exception 'CPF inválido';
  end if;

  if not p_quer_inscricao and jsonb_array_length(p_camisas) = 0 then
    raise exception 'Escolha ao menos a inscrição ou uma camisa';
  end if;

  if p_quer_inscricao then
    insert into inscricoes (nome, cpf, whatsapp, valor)
    values (p_nome, v_cpf_limpo, p_whatsapp, v_valor_base)
    returning * into v_inscricao;
    v_inscricao_id := v_inscricao.id;
  end if;

  for v_item in select * from jsonb_array_elements(p_camisas) loop
    v_modelo := v_item->>'modelo_camisa';
    v_faixa := v_item->>'faixa_etaria_camisa';
    v_valor_camisa := (v_precos_camisa -> v_modelo ->> v_faixa)::numeric;

    if v_valor_camisa is null then
      raise exception 'Modelo ou faixa etária de camisa inválidos';
    end if;

    if v_faixa = 'ate_11' then
      if (v_item->>'idade_crianca') is null then
        raise exception 'Informe a idade da criança';
      end if;
    else
      if (v_item->>'corte_camisa') is null or (v_item->>'tamanho_camisa') is null then
        raise exception 'Escolha o corte e o tamanho da camisa';
      end if;
    end if;

    insert into pedidos_camisas (
      inscricao_id, cpf_comprador, nome_comprador, whatsapp_comprador, nome_participante,
      modelo_camisa, corte_camisa, tamanho_camisa, idade_crianca, faixa_etaria_camisa, valor
    ) values (
      v_inscricao_id, v_cpf_limpo, p_nome, p_whatsapp,
      coalesce(v_item->>'nome_participante', p_nome),
      v_modelo, v_item->>'corte_camisa', v_item->>'tamanho_camisa',
      nullif(v_item->>'idade_crianca', '')::int, v_faixa, v_valor_camisa
    ) returning * into v_nova_camisa;

    v_camisas_criadas := v_camisas_criadas || jsonb_build_array(to_jsonb(v_nova_camisa));
  end loop;

  return jsonb_build_object(
    'inscricao', case when v_inscricao.id is null then null else to_jsonb(v_inscricao) end,
    'camisas', v_camisas_criadas
  );
end;
$$;

grant execute on function criar_pedido(boolean, text, text, text, jsonb) to service_role;
```

### `buscar_pedido_por_cpf` (substitui `buscar_inscricao_por_cpf`)
```sql
drop function if exists buscar_inscricao_por_cpf(text);

create or replace function buscar_pedido_por_cpf(p_cpf text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_cpf text := regexp_replace(p_cpf, '[^0-9]', '', 'g');
  v_inscricao inscricoes;
  v_camisas jsonb;
begin
  select * into v_inscricao from inscricoes where cpf = v_cpf;

  select coalesce(jsonb_agg(c order by c.created_at), '[]'::jsonb) into v_camisas
  from pedidos_camisas c
  where c.cpf_comprador = v_cpf
     or (v_inscricao.id is not null and c.inscricao_id = v_inscricao.id);

  return jsonb_build_object(
    'inscricao', case when v_inscricao.id is null then null else to_jsonb(v_inscricao) end,
    'camisas', v_camisas
  );
end;
$$;

grant execute on function buscar_pedido_por_cpf(text) to service_role;
```

### `confirmar_presenca` — adiciona gate de pagamento (requisito 1)
```sql
create or replace function confirmar_presenca(p_id text)
returns table (sucesso boolean, motivo text, inscricao inscricoes)
language plpgsql security definer set search_path = public as $$
declare
  v_role text;
  v_row inscricoes;
  v_camisas_pendentes int;
begin
  select role into v_role from perfis_equipe where id = auth.uid();
  if v_role is null or v_role not in ('recepcao','tesouraria') then
    raise exception 'Não autorizado';
  end if;

  select * into v_row from inscricoes where id = p_id;
  if v_row.id is null then
    return query select false, 'nao_encontrada', v_row;
    return;
  end if;

  if v_row.status_presenca then
    return query select false, 'ja_utilizado', v_row;
    return;
  end if;

  select count(*) into v_camisas_pendentes
  from pedidos_camisas where inscricao_id = p_id and status_pagamento <> 'Confirmado';

  if v_row.status_pagamento <> 'Confirmado' or v_camisas_pendentes > 0 then
    return query select false, 'pagamento_pendente', v_row;
    return;
  end if;

  perform set_config('app.bypass_column_guard', 'on', true);

  update inscricoes set status_presenca = true
  where id = p_id and status_presenca = false
  returning * into v_row;

  return query select true, 'ok', v_row;
end;
$$;
```
`sucesso`/`motivo` novos — front-end da Fase 6 usa `motivo` pra escolher a mensagem exibida ("já utilizado" vs "pagamento pendente" vs "não encontrada").

**Verificação:** `select criar_pedido(...)` manual no SQL editor com um CPF de teste, cobrindo os 3 cenários; `select buscar_pedido_por_cpf('...')`; `select confirmar_presenca('ID-QUE-NAO-PAGOU-CAMISA')` deve voltar `sucesso=false, motivo='pagamento_pendente'`.

---

## Phase 3 — Types, config e rotas de API

### `src/lib/supabase/types.ts`
- Remover as 6 colunas de camisa de `inscricoes.Row`/`Insert`.
- Adicionar tabela `pedidos_camisas` (Row/Insert/Update) espelhando o schema da Fase 1.
- Atualizar `Functions`: remover `criar_inscricao`/`buscar_inscricao_por_cpf`, adicionar `criar_pedido` (Args conforme RPC, Returns `Json`), `buscar_pedido_por_cpf` (Args `{p_cpf: string}`, Returns `Json`). Atualizar `confirmar_presenca` Returns pra incluir `motivo: string`.
- Adicionar tipo auxiliar `type StatusPagamento = "Pendente" | "Confirmado"` se ainda não centralizado (já existe, reaproveitar).

### `src/lib/config.ts`
Sem mudança estrutural nos preços/modelos (mantêm-se). Adicionar:
```ts
export const IDADES_CAMISA_INFANTIL = Array.from({ length: 11 }, (_, i) => i + 1); // 1..11
export const WHATSAPP_JOAO = "5598985497906";
export const NOME_DEV = "João Artur";
```

### Rotas — renomear pra refletir o novo conceito
- `src/app/api/criar-inscricao/route.ts` → **`src/app/api/criar-pedido/route.ts`**, chama `supabase.rpc("criar_pedido", {...})`, mesmo rate limit (30/hora por IP, chave `criar_pedido:${ip}`).
- `src/app/api/buscar-inscricao/route.ts` → **`src/app/api/buscar-pedido/route.ts`**, chama `buscar_pedido_por_cpf`, mesmo rate limit (20/15min, chave `buscar_pedido:${ip}`).
- Deletar os dois arquivos antigos (não deixar rota morta pra trás).

**Verificação:** `npx tsc --noEmit`, `npx eslint`, `npx next build` sem erro antes de tocar em nenhuma página.

---

## Phase 4 — Página de Inscrição: múltiplas camisas, fluxo por idade, camisa sem inscrição

Reescrever `src/app/inscricao/page.tsx`. Pontos-chave:

1. **Toggle inicial**: "Quero me inscrever" (checkbox/switch, `true` por padrão pra não mudar o caminho comum) + "Quero comprar camisa" (checkbox, como já existe). Validação: pelo menos um dos dois marcado.
2. **Se "Quero comprar camisa" marcado**: em vez de um único formulário de camisa, uma lista (`camisas: ItemCamisa[]`) com botão "+ Adicionar outra camisa". Cada item do array tem seu próprio: `nome_participante` (input texto, pré-preenchido com o nome da inscrita se for a primeira camisa e ela estiver se inscrevendo), `modelo_camisa` (grid como hoje, com lupa), `faixa_etaria_camisa`.
3. **Fluxo condicional por faixa etária (requisito 4)**, dentro de cada item:
   - `ate_11`: mostrar só `<select>` "Idade da criança" com `IDADES_CAMISA_INFANTIL` (1 a 11), sem corte, sem tamanho.
   - `12_mais`: manter exatamente como hoje — `CORTES_CAMISA` + `TAMANHOS_CAMISA`.
4. Resumo de valores no fim do form: linha "Inscrição" (se marcada) + uma linha por camisa do array (nome do participante + modelo + valor), com total somado.
5. Submit: `POST /api/criar-pedido` com `{ p_quer_inscricao, p_nome, p_cpf, p_whatsapp, p_camisas: [...] }` — os campos `nome`/`cpf`/`whatsapp` de topo são sempre da pessoa que está preenchendo o formulário (a compradora/responsável), mesmo se ela não estiver se inscrevendo.
6. `sessionStorage.setItem("checkout", JSON.stringify(json.data))` — `json.data` agora é `{ inscricao: Row|null, camisas: Row[] }`, não mais uma linha de inscrição solta. Checkout (Fase 5) precisa lidar com esse formato novo.

**Reaproveitar**: `Lightbox` (lupa nas fotos), `formatCPF`/`formatWhats` de `utils.ts`, `Card`/`SectionTitle`/`Alert`/`PrimaryButton`/`Spinner` de `ui.tsx`, grid de modelo com sibling-buttons (não aninhar botões — bug já corrigido antes, não reintroduzir).

**Verificação**: testar manualmente os 3 cenários (só inscrição; só camisa avulsa pra uma pessoa; inscrição + camisa própria + camisa de outra pessoa) no formulário local (`npm run dev`) antes de seguir.

---

## Phase 5 — Checkout: PIX combinado de camisas + WhatsApp por item

Reescrever `src/app/checkout/page.tsx`. `data` agora é `{ inscricao: Row|null, camisas: Row[] }` vindo do `sessionStorage`.

- `PixBlock` de inscrição: só renderiza se `data.inscricao` existir (hoje sempre existia; agora é condicional).
- `PixBlock` de camisas: **um bloco só**, valor = soma de `data.camisas.reduce((acc,c) => acc + c.valor, 0)` — mantém a decisão de produto #2 (1 PIX cobrindo todas as camisas daquele pedido), só renderiza se `data.camisas.length > 0`.
- Abaixo do PIX de camisa, listar os itens (nome do participante + modelo + tamanho/idade + valor) pra quem está pagando conferir o que está sendo cobrado.
- Botões WhatsApp: "Confirmar Inscrição (Fabrícia)" só se `data.inscricao`; "Confirmar Camisa(s) (Rayssa)" só se `data.camisas.length > 0` — mensagem lista cada item.
- ID de pedido exibido no topo: `data.inscricao?.id` se existir; senão, usar o `id` da primeira camisa (`data.camisas[0].id`) como referência de busca — deixar claro no texto que é o "código do pedido de camisa" quando não há inscrição.

**Verificação**: os 3 cenários da Fase 4 chegando corretamente formatados no checkout, PIX certo mostrado/escondido conforme o caso.

---

## Phase 6 — Meu Passe + Check-in: gate de pagamento completo (requisito 1)

### `src/app/meu-passe/page.tsx`
- Trocar chamada pra `/api/buscar-pedido`, resultado agora `{ inscricao, camisas }`.
- **3 estados de exibição**:
  1. Nada encontrado (nem inscrição nem camisa pro CPF) — mensagem atual de "CPF não encontrado".
  2. Só camisa(s), sem inscrição — card de status por item (`BadgeStatus` por camisa, PIX da Rayssa se pendente), **sem QR code** (decisão de produto #1).
  3. Com inscrição — QR libera só quando `inscricao.status_pagamento === "Confirmado"` **E** todo item de `camisas.filter(c => c.inscricao_id === inscricao.id)` tem `status_pagamento === "Confirmado"` (requisito 1). Se a inscrição está paga mas alguma camisa vinculada não, mostrar mensagem clara tipo "Inscrição confirmada, aguardando pagamento da(s) camisa(s) pra liberar o passe" em vez do QR.

### `src/app/checkin/page.tsx`
- Ler o novo campo `motivo` do retorno de `confirmar_presenca` (Fase 2) e mostrar mensagem específica: `pagamento_pendente` → "Pagamento pendente (inscrição ou camisa) — não libera entrada", distinto de `ja_utilizado` → "QR Code já utilizado". Hoje só existe um estado binário sucesso/falha; passa a ter 4 (`ok`/`ja_utilizado`/`pagamento_pendente`/`nao_encontrada`).
- **Não alterar** a lógica de trava de race condition já corrigida (`buscandoRef.current` só reseta no clique de "Escanear Próxima") — só o que é exibido no resultado.

**Verificação**: criar inscrição de teste com camisa pendente, confirmar só a inscrição na Gestão, tentar check-in → deve bloquear com `pagamento_pendente`. Confirmar a camisa também → check-in libera.

---

## Phase 7 — Gestão de Camisas: nova fonte de dados + 2 cards + formatação de números (requisitos 2 e 5)

Reescrever `src/app/gestao-camisas/page.tsx` pra consultar `pedidos_camisas` direto (não mais `inscricoes` filtrado por `quer_camisa`, que nem existe mais).

- Query: `supabase.from("pedidos_camisas").select("*").order("created_at", {ascending:false})`.
- KPIs existentes recalculados em cima de `pedidos_camisas` (Total de Pedidos = `.length`, Pagos, Pendentes, Arrecadado).
- **Novo card "Tamanhos de Camisas Pedidas"**: mesmo padrão visual do "Pedidos por Modelo" (`gestao-camisas/page.tsx:103-120`), mapeando `TAMANHOS_CAMISA` e contando `pedidos.filter(p => p.tamanho_camisa === tam).length`; adicionar uma célula extra "Infantil" no mesmo grid contando quem tem `idade_crianca is not null` (já que infantil não tem `tamanho_camisa`).
- **Novo card "Camisas Infantis"**: `pedidos.filter(p => p.faixa_etaria_camisa === "ate_11").length`, no grid principal de KPIs (entre "Pendentes" e "Arrecadado") ou como card extra ao lado — seguir o `grid-cols-2 sm:grid-cols-4` existente, virando `sm:grid-cols-5` se entrar no grid principal (ok visualmente, mas testar responsividade — se ficar apertado no mobile, preferir `sm:grid-cols-3 lg:grid-cols-5`).
- Lista de pedidos individual: adicionar `nome_comprador` quando `nome_participante !== nome_comprador` (ex: "Camisa pra: Maria (comprado por João)"), mostrar idade quando infantil em vez de tamanho.

### Formatação de números (requisito 5, aplicar em `gestao-camisas` e `gestao`)
Criar util em `src/lib/utils.ts`:
```ts
export function formatMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}
export function formatNumero(v: number) {
  return v.toLocaleString("pt-BR");
}
```
Trocar `` `R$ ${totalArrecadado}` `` por `formatMoeda(totalArrecadado)` nos dois dashboards. Nas células de valor do KPI, adicionar `tabular-nums` e um teto de tamanho de fonte responsivo pra número grande não quebrar o card — ex: trocar `text-2xl` fixo por `text-xl sm:text-2xl` + `truncate` na célula, testando com um valor de 5 dígitos pra garantir que não estoura o `p-5` do card.

**Verificação**: build + inspeção visual em `npm run dev` com dados de teste (inserir algumas linhas em `pedidos_camisas` manualmente pelo SQL editor com valores grandes tipo R$ 12.345 pra testar quebra de layout).

---

## Phase 8 — Página "Suporte" (requisito 7)

Novo arquivo `src/app/suporte/page.tsx`, copiando a estrutura de `perguntas-frequentes/page.tsx` (Server Component, mesmo wrapper `max-w-[720px]`).

```tsx
import Image from "next/image";
import { SectionTitle, Card } from "@/components/ui";
import { WHATSAPP_JOAO, NOME_DEV } from "@/lib/config";

export default function SuportePage() {
  const msg = encodeURIComponent("Olá! Tenho uma dúvida sobre o funcionamento do site do Congresso de Mulheres 2026.");
  const whatsLink = `https://wa.me/${WHATSAPP_JOAO}?text=${msg}`;

  return (
    <div className="fade-in mx-auto max-w-[720px] px-6 py-16">
      <SectionTitle subtitle="Dúvidas sobre o funcionamento do site (não sobre inscrição ou pagamento)">
        <em className="italic text-lilas">Suporte</em>
      </SectionTitle>
      <Card className="mx-auto max-w-md text-center">
        {/* foto: usar next/image com rounded-full h-28 w-28 se houver asset; senão fallback do círculo ✦ como em conheca-o-evento */}
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 border-lilas bg-creme text-3xl text-lilas">
          👨‍💻
        </div>
        <div className="mt-4 font-titulo text-xl font-bold text-roxo">{NOME_DEV}</div>
        <p className="mt-1 text-sm text-muted">Desenvolvedor do site</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Encontrou algum problema técnico, link quebrado ou dúvida sobre como usar o site?
          Fale direto comigo pelo WhatsApp — esse contato é só pra questões de funcionamento
          do sistema, não pra dúvidas de inscrição ou pagamento (essas ficam com a Fabrícia/Rayssa).
        </p>
        <a href={whatsLink} target="_blank" rel="noreferrer">
          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-[0.9rem] font-bold text-white transition hover:bg-[#1DA851]">
            📱 Falar com {NOME_DEV.split(" ")[0]} no WhatsApp
          </button>
        </a>
      </Card>
    </div>
  );
}
```

`src/components/Header.tsx`: adicionar `{ href: "/suporte", label: "Suporte" }` a `TABS_SECUNDARIAS` (linha ~16-21).

Se o usuário mandar uma foto real do João Artur, trocar o emoji `👨‍💻` por `<Image src="/suporte/joao-artur.jpg" ... className="... rounded-full object-cover" fill />` dentro de um container `relative h-28 w-28`, seguindo a técnica de `conheca-o-evento/page.tsx:150-164`.

**Verificação**: nav mostra "Suporte" no dropdown desktop e no sidebar mobile; botão abre WhatsApp com número certo.

---

## Phase 9 — Verificação final

1. `npx tsc --noEmit` limpo.
2. `npx eslint src/` limpo.
3. `npx next build` sem erro, conferir rota `/suporte` aparece na listagem de rotas geradas.
4. Fluxo manual completo em `npm run dev`, cobrindo:
   - Inscrição sozinha (sem camisa).
   - Camisa avulsa, adulto, sem inscrição.
   - Camisa avulsa, infantil (idade), sem inscrição.
   - Inscrição + camisa própria (adulto) + camisa de outra pessoa (infantil), tudo num pedido.
   - Checkout mostrando PIX certo pra cada cenário, botões WhatsApp corretos.
   - Meu Passe: os 3 estados (nada encontrado / só camisa sem QR / inscrição com QR condicionado ao pagamento de tudo).
   - Check-in: bloqueia com `pagamento_pendente` até tudo confirmado; libera depois.
   - Gestão de Camisas: 2 novos cards aparecendo com números corretos e sem quebrar layout.
   - Suporte: nav + botão WhatsApp.
5. Deploy: commit + push, conferir build na Vercel, rodar as migrações 0010/0011 no Supabase **antes** do deploy do código novo ir pro ar (mesma ordem de risco da migração de rate limit — código novo depende do schema novo; se o deploy do código subir antes da migração rodar, tudo quebra por alguns minutos, avisar o usuário disso como já foi feito da última vez).

---

## Notas de risco / o que avisar ao usuário antes de rodar a Fase 1

- A Fase 1 **remove colunas de uma tabela de produção com inscrições reais já cadastradas**, 24 dias antes do evento. Fazer backup (`create table inscricoes_backup_pre_migracao as select * from inscricoes;`) como primeiro passo real da migração, não só como sugestão — incluir isso no arquivo `0010_pedidos_camisas.sql` de verdade.
- A migração de tamanho/corte no backfill (extrair "Babylook" do sufixo do texto de `tamanho_camisa`) é uma heurística sobre dados existentes — vale conferir manualmente as poucas linhas reais existentes depois de rodar, comparando com o texto original salvo no backup.
- Renomear as rotas de API (`/api/criar-inscricao` → `/api/criar-pedido`, `/api/buscar-inscricao` → `/api/buscar-pedido`) é uma mudança que só funciona depois do deploy do código novo E da migração — mesmo cuidado de sequência que already aconteceu com a chave de serviço vazia da vez passada.
