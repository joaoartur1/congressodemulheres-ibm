-- Doce Presença — Congresso de Mulheres 2026
-- Segundo caminho pra vender a mesma camisa extra do estande: a própria
-- pessoa pede pelo celular dela (sem precisar de ninguém da equipe do
-- lado). Desconta do MESMO estoque que /venda-estande usa — quem descontar
-- primeiro (equipe ou pessoa pelo site) "ganha" a unidade, sem risco de
-- vender a mesma peça duas vezes (UPDATE condicional atômico).
--
-- Diferença pro vender_camisa_estande: aqui não tem pagamento em mãos, então
-- o pedido nasce Pendente — a pessoa paga por PIX depois, como qualquer
-- outro pedido. Sem checagem de role (é público), mas com validação de CPF
-- e rate limit (aplicado na rota /api/comprar-camisa-extra, não aqui).

-- Estoque passa a ser visível publicamente — a pessoa precisa ver quanto
-- resta de cada tamanho antes de escolher. Não é dado sensível.
create policy "publico_select_estoque_extra" on estoque_extra_camisas
  for select using (true);

create or replace function criar_pedido_extra(
  p_nome text,
  p_cpf text,
  p_whatsapp text,
  p_modelo text,
  p_tamanho text,
  p_corte text
) returns pedidos_camisas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estoque estoque_extra_camisas;
  v_valor numeric;
  v_novo pedidos_camisas;
  v_precos_camisa jsonb := '{
    "oficial":   70,
    "escolhida": 65,
    "virtuosa":  65,
    "abencoada": 65,
    "amada":     65,
    "protegida": 65
  }'::jsonb;
begin
  if not cpf_valido(p_cpf) then
    raise exception 'CPF inválido';
  end if;

  update estoque_extra_camisas
  set quantidade_vendida = quantidade_vendida + 1
  where modelo_camisa = p_modelo and tamanho_camisa = p_tamanho and corte_camisa = p_corte
    and quantidade_vendida < quantidade_total
  returning * into v_estoque;

  if v_estoque.id is null then
    raise exception 'Estoque esgotado para esse modelo e tamanho';
  end if;

  v_valor := (v_precos_camisa ->> p_modelo)::numeric;
  if v_valor is null then
    raise exception 'Modelo inválido';
  end if;

  insert into pedidos_camisas (
    cpf_comprador, nome_comprador, whatsapp_comprador, nome_participante,
    modelo_camisa, corte_camisa, tamanho_camisa, faixa_etaria_camisa,
    valor, status_pagamento
  ) values (
    regexp_replace(p_cpf, '[^0-9]', '', 'g'), p_nome, p_whatsapp, p_nome,
    p_modelo, p_corte, p_tamanho, '12_mais',
    v_valor, 'Pendente'
  ) returning * into v_novo;

  return v_novo;
end;
$$;

grant execute on function criar_pedido_extra(text, text, text, text, text, text) to service_role;
