-- Doce Presença — Congresso de Mulheres 2026
-- Permite que o papel "camisas" (Rayssa) exclua um pedido de camisa —
-- usado pra remover pedidos duplicados. Não existia nenhuma policy de
-- delete em pedidos_camisas até agora (RLS nega por padrão sem policy).
create policy "camisas_delete_pedidos_camisas" on pedidos_camisas
  for delete
  using (
    exists (select 1 from perfis_equipe pe where pe.id = auth.uid() and pe.role = 'camisas')
  );
