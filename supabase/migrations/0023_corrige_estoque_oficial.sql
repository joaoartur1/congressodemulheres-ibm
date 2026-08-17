-- Doce Presença — Congresso de Mulheres 2026
-- Correção de soma: Camisa Oficial tinha 1 unidade a mais em M, G e GG
-- (esqueceram de somar pedidos já feitos antes). Novo total: 3 P, 6 M,
-- 7 M Babylook, 5 G, 4 G Babylook, 2 GG.
--
-- Trava de segurança: se alguma dessas já vendeu mais do que o novo total
-- permite, a migração falha com uma mensagem clara em vez de deixar
-- "restante" negativo no site.
do $$
declare
  v_vendida int;
begin
  select quantidade_vendida into v_vendida from estoque_extra_camisas
  where modelo_camisa = 'oficial' and tamanho_camisa = 'M' and corte_camisa = 'Normal';
  if v_vendida > 6 then
    raise exception 'Oficial M Normal já vendeu % unidades — não dá pra reduzir o total pra 6', v_vendida;
  end if;

  select quantidade_vendida into v_vendida from estoque_extra_camisas
  where modelo_camisa = 'oficial' and tamanho_camisa = 'G' and corte_camisa = 'Normal';
  if v_vendida > 5 then
    raise exception 'Oficial G Normal já vendeu % unidades — não dá pra reduzir o total pra 5', v_vendida;
  end if;

  select quantidade_vendida into v_vendida from estoque_extra_camisas
  where modelo_camisa = 'oficial' and tamanho_camisa = 'GG' and corte_camisa = 'Normal';
  if v_vendida > 2 then
    raise exception 'Oficial GG Normal já vendeu % unidades — não dá pra reduzir o total pra 2', v_vendida;
  end if;
end $$;

update estoque_extra_camisas set quantidade_total = 6
  where modelo_camisa = 'oficial' and tamanho_camisa = 'M' and corte_camisa = 'Normal';
update estoque_extra_camisas set quantidade_total = 5
  where modelo_camisa = 'oficial' and tamanho_camisa = 'G' and corte_camisa = 'Normal';
update estoque_extra_camisas set quantidade_total = 2
  where modelo_camisa = 'oficial' and tamanho_camisa = 'GG' and corte_camisa = 'Normal';
