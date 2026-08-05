-- Doce Presença — Congresso de Mulheres 2026
-- Bug no formulário (corrigido em código) colava "Babylook" dentro do
-- próprio tamanho_camisa (ex: "M Babylook") em vez de usar só a coluna
-- corte_camisa que já existia pra isso. Limpa os pedidos afetados,
-- criados entre a migração 0010 e essa correção.
update pedidos_camisas
set tamanho_camisa = trim(regexp_replace(tamanho_camisa, '(?i)\s*babylook', '', 'g'))
where tamanho_camisa ilike '%babylook%';
