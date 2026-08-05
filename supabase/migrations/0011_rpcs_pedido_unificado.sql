-- Doce Presença — Congresso de Mulheres 2026
-- Unifica criação/busca de pedido (inscrição opcional + N camisas opcionais)
-- num RPC só, e adiciona gate de pagamento no check-in: só libera presença
-- se a inscrição E toda camisa vinculada a ela estiverem confirmadas.

drop function if exists criar_inscricao(text, text, text, boolean, text, text, text);
drop function if exists buscar_inscricao_por_cpf(text);

-- ─── criar_pedido ───────────────────────────────────────────────────────
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

grant execute on function criar_pedido(boolean, text, text, text, jsonb) to service_role;

-- ─── buscar_pedido_por_cpf ──────────────────────────────────────────────
create or replace function buscar_pedido_por_cpf(p_cpf text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cpf text := regexp_replace(p_cpf, '[^0-9]', '', 'g');
  v_inscricao inscricoes;
  v_camisas jsonb;
begin
  select * into v_inscricao from inscricoes where cpf = v_cpf;

  select coalesce(jsonb_agg(c order by c.created_at), '[]'::jsonb) into v_camisas
  from pedidos_camisas c
  where c.cpf_comprador = v_cpf
     or (v_inscricao.id is not null and c.inscricao_id = v_inscricao.id);

  return jsonb_build_object(
    'inscricao', case when v_inscricao.id is null then null else to_jsonb(v_inscricao) end,
    'camisas', v_camisas
  );
end;
$$;

grant execute on function buscar_pedido_por_cpf(text) to service_role;

-- ─── confirmar_presenca: agora com gate de pagamento ───────────────────
-- Antes só travava check-in duplicado (status_presenca). Passa a também
-- exigir status_pagamento = Confirmado na inscrição E em toda camisa
-- vinculada a ela antes de liberar entrada.
create or replace function confirmar_presenca(p_id text)
returns table (sucesso boolean, motivo text, inscricao inscricoes)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_row inscricoes;
  v_camisas_pendentes int;
begin
  select role into v_role from perfis_equipe where id = auth.uid();
  if v_role is null or v_role not in ('recepcao', 'tesouraria') then
    raise exception 'Não autorizado';
  end if;

  select * into v_row from inscricoes where id = p_id;
  if v_row.id is null then
    return query select false, 'nao_encontrada'::text, v_row;
    return;
  end if;

  if v_row.status_presenca then
    return query select false, 'ja_utilizado'::text, v_row;
    return;
  end if;

  select count(*) into v_camisas_pendentes
  from pedidos_camisas
  where inscricao_id = p_id and status_pagamento <> 'Confirmado';

  if v_row.status_pagamento <> 'Confirmado' or v_camisas_pendentes > 0 then
    return query select false, 'pagamento_pendente'::text, v_row;
    return;
  end if;

  perform set_config('app.bypass_column_guard', 'on', true);

  update inscricoes
  set status_presenca = true
  where id = p_id and status_presenca = false
  returning * into v_row;

  return query select true, 'ok'::text, v_row;
end;
$$;
