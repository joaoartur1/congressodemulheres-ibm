-- Doce Presença — Congresso de Mulheres 2026
-- Registra uma venda de camisa extra no estande: desconta 1 unidade do
-- estoque (atômico — UPDATE condicional evita vender além do que existe
-- mesmo com duas vendas simultâneas) e já cria o pedido como Confirmado,
-- porque o pagamento acontece na hora, presencialmente.
create or replace function vender_camisa_estande(
  p_modelo text,
  p_tamanho text,
  p_corte text,
  p_nome_participante text,
  p_nome_comprador text,
  p_cpf_comprador text,
  p_whatsapp_comprador text
) returns pedidos_camisas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
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
  select role into v_role from perfis_equipe where id = auth.uid();
  if v_role is null or v_role <> 'camisas' then
    raise exception 'Não autorizado';
  end if;

  if not cpf_valido(p_cpf_comprador) then
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
    regexp_replace(p_cpf_comprador, '[^0-9]', '', 'g'), p_nome_comprador, p_whatsapp_comprador, p_nome_participante,
    p_modelo, p_corte, p_tamanho, '12_mais',
    v_valor, 'Confirmado'
  ) returning * into v_novo;

  return v_novo;
end;
$$;

grant execute on function vender_camisa_estande(text, text, text, text, text, text, text) to authenticated;
