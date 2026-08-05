-- Doce Presença — Congresso de Mulheres 2026
-- Camisa deixa de ser 1-pra-1 com inscrição: vira tabela própria
-- (pedidos_camisas), com inscricao_id opcional. Permite N camisas por
-- pedido e compra de camisa sem inscrição.

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
  faixa_etaria_camisa text not null check (faixa_etaria_camisa in ('ate_11', '12_mais')),
  valor numeric not null,
  status_pagamento text not null default 'Pendente' check (status_pagamento in ('Pendente', 'Confirmado')),
  created_at timestamptz not null default now(),
  check (
    (faixa_etaria_camisa = 'ate_11' and idade_crianca between 1 and 11 and corte_camisa is null and tamanho_camisa is null)
    or
    (faixa_etaria_camisa = '12_mais' and idade_crianca is null and corte_camisa is not null and tamanho_camisa is not null)
  )
);

create index pedidos_camisas_cpf_comprador_idx on pedidos_camisas (cpf_comprador);
create index pedidos_camisas_inscricao_id_idx on pedidos_camisas (inscricao_id);

-- Backfill: toda inscrição com quer_camisa=true vira 1 linha em pedidos_camisas.
-- tamanho_camisa hoje pode vir como "M Babylook" (corte embutido no texto,
-- não era coluna própria) — extrai o corte do sufixo. idade_crianca não
-- existia antes; usa 11 (topo da faixa "ate_11") como valor conservador,
-- só pra satisfazer a constraint — dado real de idade não existia pra migrar.
insert into pedidos_camisas (
  inscricao_id, cpf_comprador, nome_comprador, whatsapp_comprador, nome_participante,
  modelo_camisa, corte_camisa, tamanho_camisa, idade_crianca, faixa_etaria_camisa,
  valor, status_pagamento, created_at
)
select
  id, cpf, nome, whatsapp, nome,
  modelo_camisa,
  case when faixa_etaria_camisa = '12_mais' then
    case when tamanho_camisa ilike '%babylook%' then 'Babylook' else 'Normal' end
  else null end,
  case when faixa_etaria_camisa = '12_mais' then trim(regexp_replace(tamanho_camisa, '(?i)\s*babylook', '', 'g')) else null end,
  case when faixa_etaria_camisa = 'ate_11' then 11 else null end,
  faixa_etaria_camisa,
  valor_camisa,
  coalesce(status_pagamento_camisa, 'Pendente'),
  created_at
from inscricoes
where quer_camisa = true;

-- Remove as colunas de camisa de inscricoes — dados já preservados acima
-- (pedidos_camisas + inscricoes_backup_pre_migracao).
alter table inscricoes
  drop column quer_camisa,
  drop column tamanho_camisa,
  drop column modelo_camisa,
  drop column faixa_etaria_camisa,
  drop column valor_camisa,
  drop column status_pagamento_camisa;

-- ─── RLS ────────────────────────────────────────────────────────────────
alter table pedidos_camisas enable row level security;

create policy "equipe_select_pedidos_camisas" on pedidos_camisas
  for select using (
    exists (select 1 from perfis_equipe pe where pe.id = auth.uid() and pe.role in ('tesouraria', 'camisas'))
  );

create policy "camisas_update_pedidos_camisas" on pedidos_camisas
  for update
  using (exists (select 1 from perfis_equipe pe where pe.id = auth.uid() and pe.role = 'camisas'))
  with check (exists (select 1 from perfis_equipe pe where pe.id = auth.uid() and pe.role = 'camisas'));

-- Trava de coluna: via UPDATE direto (RLS acima), só status_pagamento pode mudar.
create or replace function pedidos_camisas_bloquear_colunas_nao_permitidas()
returns trigger
language plpgsql
as $$
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

-- estoque_camisas está morta desde a 0004 (zero referência em código/RPC,
-- FK removida) — resquício do modelo antigo com limite de estoque.
drop table if exists estoque_camisas;
