-- Doce Presença — Congresso de Mulheres 2026
-- Endurece dois pontos identificados numa auditoria de segurança:
--
-- 1) criar_inscricao não validava o CPF no servidor (só no formulário do
--    site, trivial de contornar chamando a função direto). Alguém podia
--    inundar a tabela com inscrições-lixo.
-- 2) buscar_inscricao_por_cpf (usada em "Meu Passe") devolvia a linha
--    inteira — nome, WhatsApp, status de pagamento — pra qualquer CPF
--    tentado, sem limite de tentativas. Um script podia tentar CPFs em
--    sequência pra puxar dados de outras pessoas.
--
-- A correção: valida CPF (dígito verificador) dentro da própria função, e
-- move as duas RPCs pra trás de rotas do Next.js que aplicam rate limit por
-- IP (algo que o Postgres sozinho não sabe fazer, pois RPCs via anon key
-- não carregam o IP de quem chamou). As funções deixam de ser executáveis
-- por anon/authenticated — só o backend (service_role) chama agora.

-- ─── Validação de CPF (dígito verificador) ─────────────────────────────────
create or replace function cpf_valido(p_cpf text)
returns boolean
language plpgsql
immutable
as $$
declare
  v_cpf text := regexp_replace(p_cpf, '[^0-9]', '', 'g');
  v_soma int;
  v_resto int;
  i int;
begin
  if length(v_cpf) != 11 then
    return false;
  end if;
  if v_cpf ~ '^(\d)\1{10}$' then
    return false;
  end if;

  v_soma := 0;
  for i in 1..9 loop
    v_soma := v_soma + substring(v_cpf, i, 1)::int * (11 - i);
  end loop;
  v_resto := (v_soma * 10) % 11;
  if v_resto = 10 then v_resto := 0; end if;
  if v_resto != substring(v_cpf, 10, 1)::int then
    return false;
  end if;

  v_soma := 0;
  for i in 1..10 loop
    v_soma := v_soma + substring(v_cpf, i, 1)::int * (12 - i);
  end loop;
  v_resto := (v_soma * 10) % 11;
  if v_resto = 10 then v_resto := 0; end if;
  if v_resto != substring(v_cpf, 11, 1)::int then
    return false;
  end if;

  return true;
end;
$$;

create or replace function criar_inscricao(
  p_nome text,
  p_cpf text,
  p_whatsapp text,
  p_quer_camisa boolean,
  p_modelo_camisa text,
  p_tamanho_camisa text,
  p_faixa_etaria_camisa text
) returns inscricoes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_valor numeric;
  v_valor_camisa numeric;
  v_nova inscricoes;
  v_valor_base numeric := 100;
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

  v_valor := v_valor_base;
  v_valor_camisa := null;

  if p_quer_camisa then
    if p_modelo_camisa is null or p_tamanho_camisa is null or p_faixa_etaria_camisa is null then
      raise exception 'Selecione o modelo, o tamanho e a faixa etária da camisa';
    end if;

    v_valor_camisa := (v_precos_camisa -> p_modelo_camisa ->> p_faixa_etaria_camisa)::numeric;

    if v_valor_camisa is null then
      raise exception 'Modelo de camisa inválido';
    end if;
  end if;

  insert into inscricoes (
    nome, cpf, whatsapp, valor,
    quer_camisa, modelo_camisa, tamanho_camisa, faixa_etaria_camisa,
    valor_camisa, status_pagamento_camisa
  )
  values (
    p_nome, regexp_replace(p_cpf, '[^0-9]', '', 'g'), p_whatsapp, v_valor,
    p_quer_camisa, p_modelo_camisa, p_tamanho_camisa, p_faixa_etaria_camisa,
    v_valor_camisa, case when p_quer_camisa then 'Pendente' else null end
  )
  returning * into v_nova;

  return v_nova;
end;
$$;

-- ─── Rate limiting por IP (aplicado pelas rotas do Next.js) ────────────────
create table rate_limit_log (
  id bigint generated always as identity primary key,
  chave text not null,
  criado_em timestamptz not null default now()
);

create index rate_limit_log_chave_criado_em_idx on rate_limit_log (chave, criado_em);

alter table rate_limit_log enable row level security;
-- Sem nenhuma policy: só service_role (que ignora RLS) lê/escreve aqui.

create or replace function checar_rate_limit(p_chave text, p_limite int, p_janela_minutos int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contagem int;
begin
  delete from rate_limit_log where criado_em < now() - (p_janela_minutos || ' minutes')::interval;

  select count(*) into v_contagem from rate_limit_log
  where chave = p_chave and criado_em > now() - (p_janela_minutos || ' minutes')::interval;

  if v_contagem >= p_limite then
    return false;
  end if;

  insert into rate_limit_log (chave) values (p_chave);
  return true;
end;
$$;

-- ─── Fecha o acesso direto via anon key — só o backend chama agora ─────────
revoke execute on function criar_inscricao(text, text, text, boolean, text, text, text) from anon, authenticated;
revoke execute on function buscar_inscricao_por_cpf(text) from anon, authenticated;

grant execute on function criar_inscricao(text, text, text, boolean, text, text, text) to service_role;
grant execute on function buscar_inscricao_por_cpf(text) to service_role;
grant execute on function checar_rate_limit(text, int, int) to service_role;
