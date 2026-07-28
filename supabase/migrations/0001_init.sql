-- Doce Presença — Congresso de Mulheres 2026
-- Schema inicial: estoque de camisas, inscrições, perfis de equipe e programação.

-- ─── TABELAS ──────────────────────────────────────────────────────────────

create table estoque_camisas (
  tamanho text primary key,
  quantidade_total int not null,
  quantidade_vendida int not null default 0
);

insert into estoque_camisas (tamanho, quantidade_total, quantidade_vendida) values
  ('P', 20, 0), ('M', 30, 0), ('G', 25, 0), ('GG', 15, 0);

create table inscricoes (
  id text primary key default ('HRD-' || upper(substr(md5(random()::text), 1, 5))),
  nome text not null,
  cpf text not null unique,
  whatsapp text not null,
  quer_camisa boolean not null default false,
  tamanho_camisa text references estoque_camisas(tamanho),
  valor numeric not null,
  status_pagamento text not null default 'Pendente' check (status_pagamento in ('Pendente','Confirmado')),
  status_presenca boolean not null default false,
  created_at timestamptz not null default now()
);

-- Perfis de equipe (tesouraria / recepção), ligados ao Supabase Auth.
-- As duas contas de equipe são criadas manualmente no painel do Supabase
-- (Authentication > Users) e depois vinculadas aqui com o role correspondente.
create table perfis_equipe (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  role text not null check (role in ('tesouraria','recepcao'))
);

-- Programação dos 3 dias. Fica vazia por enquanto (a agenda real ainda não foi
-- definida) — edite direto pela Table Editor do Supabase quando tiver os dados,
-- sem precisar de redeploy.
create table programacao (
  id bigint generated always as identity primary key,
  dia text not null,
  horario text not null,
  titulo text not null,
  preletora text,
  ordem int not null default 0
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────

alter table estoque_camisas enable row level security;
alter table inscricoes enable row level security;
alter table perfis_equipe enable row level security;
alter table programacao enable row level security;

-- estoque_camisas: leitura pública. Escrita só acontece via a função
-- criar_inscricao (SECURITY DEFINER) abaixo — não há policy de insert/update
-- para anon/authenticated, então a única forma de alterar o estoque é pela RPC.
create policy "estoque_select_publico" on estoque_camisas
  for select using (true);

-- programacao: leitura pública. Edição feita direto no painel do Supabase
-- (Table Editor usa a service role e não passa pelas policies).
create policy "programacao_select_publico" on programacao
  for select using (true);

-- perfis_equipe: cada pessoa da equipe só enxerga o próprio perfil.
create policy "perfil_select_proprio" on perfis_equipe
  for select using (auth.uid() = id);

-- inscricoes: NÃO existe policy de select para anon nem para authenticated em
-- geral — isso evita que qualquer um baixe a lista inteira de inscritas. A
-- busca pública por CPF ("Meu Passe") e a criação de inscrição acontecem via
-- funções SECURITY DEFINER (buscar_inscricao_por_cpf / criar_inscricao), que
-- fazem a filtragem no servidor antes de devolver qualquer linha.
create policy "equipe_select_inscricoes" on inscricoes
  for select using (
    exists (
      select 1 from perfis_equipe pe
      where pe.id = auth.uid() and pe.role in ('tesouraria','recepcao')
    )
  );

-- Apenas tesouraria pode atualizar inscrições (usado para confirmar
-- pagamento). Um trigger abaixo garante que, por este caminho, só a coluna
-- status_pagamento pode mudar — status_presenca só muda pela RPC
-- confirmar_presenca, que trata a corrida de check-in simultâneo.
create policy "tesouraria_update_inscricoes" on inscricoes
  for update
  using (
    exists (
      select 1 from perfis_equipe pe
      where pe.id = auth.uid() and pe.role = 'tesouraria'
    )
  )
  with check (
    exists (
      select 1 from perfis_equipe pe
      where pe.id = auth.uid() and pe.role = 'tesouraria'
    )
  );

create or replace function inscricoes_bloquear_colunas_nao_permitidas()
returns trigger
language plpgsql
as $$
begin
  -- A RPC confirmar_presenca liga essa flag (só dentro da própria transação)
  -- para poder alterar status_presenca sem cair nesta trava.
  if current_setting('app.bypass_column_guard', true) = 'on' then
    return new;
  end if;

  if new.status_presenca is distinct from old.status_presenca
     or new.id is distinct from old.id
     or new.nome is distinct from old.nome
     or new.cpf is distinct from old.cpf
     or new.whatsapp is distinct from old.whatsapp
     or new.quer_camisa is distinct from old.quer_camisa
     or new.tamanho_camisa is distinct from old.tamanho_camisa
     or new.valor is distinct from old.valor
     or new.created_at is distinct from old.created_at
  then
    raise exception 'Apenas status_pagamento pode ser alterado por este canal';
  end if;

  return new;
end;
$$;

create trigger trg_inscricoes_bloquear_colunas
  before update on inscricoes
  for each row
  execute function inscricoes_bloquear_colunas_nao_permitidas();

-- ─── FUNÇÕES RPC ──────────────────────────────────────────────────────────

-- Cria a inscrição e decrementa o estoque de camisa (se aplicável) numa única
-- transação, travando a linha do tamanho escolhido (FOR UPDATE) para evitar
-- overselling quando duas pessoas tentam comprar o último tamanho ao mesmo
-- tempo. O valor é sempre calculado no servidor (nunca confiado do client).
create or replace function criar_inscricao(
  p_nome text,
  p_cpf text,
  p_whatsapp text,
  p_quer_camisa boolean,
  p_tamanho_camisa text
) returns inscricoes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_valor numeric;
  v_disponivel int;
  v_nova inscricoes;
  -- TODO: manter sincronizado com VALOR_BASE / VALOR_CAMISA em src/lib/config.ts.
  -- Valor da camisa ainda não confirmado pela tesouraria (0 = a definir).
  v_valor_base numeric := 100;
  v_valor_camisa numeric := 0;
begin
  if p_quer_camisa then
    if p_tamanho_camisa is null then
      raise exception 'Selecione o tamanho da camisa';
    end if;

    select (quantidade_total - quantidade_vendida) into v_disponivel
    from estoque_camisas
    where tamanho = p_tamanho_camisa
    for update;

    if v_disponivel is null then
      raise exception 'Tamanho de camisa inválido';
    end if;

    if v_disponivel <= 0 then
      raise exception 'Tamanho % esgotado', p_tamanho_camisa;
    end if;

    update estoque_camisas
    set quantidade_vendida = quantidade_vendida + 1
    where tamanho = p_tamanho_camisa;

    v_valor := v_valor_base + v_valor_camisa;
  else
    v_valor := v_valor_base;
  end if;

  insert into inscricoes (nome, cpf, whatsapp, quer_camisa, tamanho_camisa, valor)
  values (p_nome, p_cpf, p_whatsapp, p_quer_camisa, p_tamanho_camisa, v_valor)
  returning * into v_nova;

  return v_nova;
end;
$$;

grant execute on function criar_inscricao(text, text, text, boolean, text) to anon, authenticated;

-- Busca pública por CPF (tela "Meu Passe"). Devolve no máximo uma linha
-- (cpf é unique) sem expor a lista completa de inscrições.
create or replace function buscar_inscricao_por_cpf(p_cpf text)
returns setof inscricoes
language sql
security definer
set search_path = public
as $$
  select * from inscricoes where cpf = p_cpf;
$$;

grant execute on function buscar_inscricao_por_cpf(text) to anon, authenticated;

-- Confirma entrada (check-in) de forma atômica: só marca status_presenca se
-- ainda estava false. Se duas leituras do mesmo QR Code chegarem quase juntas,
-- só a primeira consegue confirmar — a segunda recebe sucesso = false e a
-- inscrição já com status_presenca = true, para a tela mostrar "já utilizado".
create or replace function confirmar_presenca(p_id text)
returns table (sucesso boolean, inscricao inscricoes)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_row inscricoes;
begin
  select role into v_role from perfis_equipe where id = auth.uid();
  if v_role is null or v_role not in ('recepcao','tesouraria') then
    raise exception 'Não autorizado';
  end if;

  perform set_config('app.bypass_column_guard', 'on', true);

  update inscricoes
  set status_presenca = true
  where id = p_id and status_presenca = false
  returning * into v_row;

  if v_row.id is not null then
    return query select true, v_row;
    return;
  end if;

  select * into v_row from inscricoes where id = p_id;
  if v_row.id is null then
    raise exception 'Inscrição não encontrada';
  end if;

  return query select false, v_row;
end;
$$;

grant execute on function confirmar_presenca(text) to authenticated;
