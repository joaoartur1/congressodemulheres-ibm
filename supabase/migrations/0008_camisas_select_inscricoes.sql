-- Doce Presença — Congresso de Mulheres 2026
-- A policy de select em inscricoes (0001_init.sql) nunca foi atualizada
-- quando o papel "camisas" foi criado (0004_camisas_e_palestrantes.sql):
-- Rayssa conseguia atualizar status_pagamento_camisa mas não enxergava
-- nenhum pedido na página /gestao-camisas.
drop policy "equipe_select_inscricoes" on inscricoes;

create policy "equipe_select_inscricoes" on inscricoes
  for select using (
    exists (
      select 1 from perfis_equipe pe
      where pe.id = auth.uid() and pe.role in ('tesouraria', 'recepcao', 'camisas')
    )
  );
