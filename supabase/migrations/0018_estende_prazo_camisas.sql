-- Doce Presença — Congresso de Mulheres 2026
-- Estende o prazo de pedidos de camisa: 13/08/2026 23:59, não mais 12/08 14:00.
create or replace function criar_pedido(
  p_quer_inscricao boolean,
  p_nome text,
  p_cpf text,
  p_whatsapp text,
  p_camisas jsonb default '[]'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
  v_prazo_camisas timestamptz := '2026-08-13 23:59:59-03'; -- manter sincronizado com PRAZO_CAMISAS
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

  if jsonb_array_length(p_camisas) > 0 and now() > v_prazo_camisas then
    raise exception 'As vendas de camisa encerraram no dia 13/08 às 23h59';
  end if;

  if p_quer_inscricao then
    insert into inscricoes (nome, cpf, whatsapp, valor)
    values (p_nome, v_cpf_limpo, p_whatsapp, v_valor_base)
    returning * into v_inscricao;
    v_inscricao_id := v_inscricao.id;
  end if;

  for v_item in select * from jsonb_array_elements(p_camisas) loop
    v_modelo := v_item ->> 'modelo_camisa';
    v_faixa := v_item ->> 'faixa_etaria_camisa';
    v_valor_camisa := (v_precos_camisa -> v_modelo ->> v_faixa)::numeric;

    if v_valor_camisa is null then
      raise exception 'Modelo ou faixa etária de camisa inválidos';
    end if;

    if v_faixa = 'ate_11' then
      if (v_item ->> 'idade_crianca') is null then
        raise exception 'Informe a idade da criança';
      end if;
    else
      if (v_item ->> 'corte_camisa') is null or (v_item ->> 'tamanho_camisa') is null then
        raise exception 'Escolha o corte e o tamanho da camisa';
      end if;
    end if;

    insert into pedidos_camisas (
      inscricao_id, cpf_comprador, nome_comprador, whatsapp_comprador, nome_participante,
      modelo_camisa, corte_camisa, tamanho_camisa, idade_crianca, faixa_etaria_camisa, valor
    ) values (
      v_inscricao_id, v_cpf_limpo, p_nome, p_whatsapp,
      coalesce(v_item ->> 'nome_participante', p_nome),
      v_modelo, v_item ->> 'corte_camisa', v_item ->> 'tamanho_camisa',
      nullif(v_item ->> 'idade_crianca', '')::int, v_faixa, v_valor_camisa
    ) returning * into v_nova_camisa;

    v_camisas_criadas := v_camisas_criadas || jsonb_build_array(to_jsonb(v_nova_camisa));
  end loop;

  return jsonb_build_object(
    'inscricao', case when v_inscricao.id is null then null else to_jsonb(v_inscricao) end,
    'camisas', v_camisas_criadas
  );
end;
$$;
