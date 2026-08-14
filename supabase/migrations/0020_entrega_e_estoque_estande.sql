-- Doce Presença — Congresso de Mulheres 2026
-- Duas ferramentas pro estande físico do congresso:
-- 1) Confirmar entrega de uma camisa já paga (baixa de retirada).
-- 2) Vender camisa extra no estande, com estoque exato e finito por
--    modelo + tamanho + corte — sem estoque pra faixa infantil, só adulto.

alter table pedidos_camisas add column entregue boolean not null default false;

create table estoque_extra_camisas (
  id bigint generated always as identity primary key,
  modelo_camisa text not null,
  tamanho_camisa text not null,
  corte_camisa text not null,
  quantidade_total int not null,
  quantidade_vendida int not null default 0,
  unique (modelo_camisa, tamanho_camisa, corte_camisa)
);

alter table estoque_extra_camisas enable row level security;

create policy "equipe_select_estoque_extra" on estoque_extra_camisas
  for select using (
    exists (select 1 from perfis_equipe pe where pe.id = auth.uid() and pe.role in ('tesouraria', 'camisas'))
  );

-- Quantidades reais informadas para venda no estande (105 unidades no total).
insert into estoque_extra_camisas (modelo_camisa, tamanho_camisa, corte_camisa, quantidade_total) values
  ('oficial', 'P', 'Normal', 3),
  ('oficial', 'M', 'Normal', 7),
  ('oficial', 'M', 'Babylook', 7),
  ('oficial', 'G', 'Normal', 6),
  ('oficial', 'G', 'Babylook', 4),
  ('oficial', 'GG', 'Normal', 3),

  ('escolhida', 'P', 'Normal', 3),
  ('escolhida', 'M', 'Normal', 3),
  ('escolhida', 'M', 'Babylook', 4),
  ('escolhida', 'G', 'Normal', 2),
  ('escolhida', 'G', 'Babylook', 3),

  ('virtuosa', 'P', 'Normal', 3),
  ('virtuosa', 'M', 'Normal', 2),
  ('virtuosa', 'M', 'Babylook', 7),
  ('virtuosa', 'G', 'Normal', 3),

  ('abencoada', 'P', 'Normal', 3),
  ('abencoada', 'M', 'Normal', 3),
  ('abencoada', 'M', 'Babylook', 4),
  ('abencoada', 'G', 'Normal', 2),
  ('abencoada', 'G', 'Babylook', 3),

  ('amada', 'P', 'Normal', 3),
  ('amada', 'M', 'Normal', 3),
  ('amada', 'M', 'Babylook', 4),
  ('amada', 'G', 'Normal', 5),

  ('protegida', 'P', 'Normal', 3),
  ('protegida', 'M', 'Normal', 3),
  ('protegida', 'M', 'Babylook', 4),
  ('protegida', 'G', 'Normal', 2),
  ('protegida', 'G', 'Babylook', 3);
