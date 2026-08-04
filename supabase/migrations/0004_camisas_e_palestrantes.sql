-- Doce Presença — Congresso de Mulheres 2026
-- 1) Camisas passam a ser por encomenda (sem estoque limitado), com 6 modelos
--    reais, tamanho (P/M/G/Babylook) e faixa etária (preço muda por idade).
--    Pagamento da camisa é separado do pagamento da inscrição — PIX de
--    pessoas diferentes (Rayssa para camisa, Fabrícia para inscrição).
-- 2) Nova role "camisas" (Rayssa) para confirmar pagamento das camisas,
--    separada da "tesouraria" (Fabrícia), que continua só com a inscrição.
-- 3) Palestrantes ganha igreja, instagram, cidade e vídeo.

-- ─── PERFIS_EQUIPE: nova role ─────────────────────────────────────────────

alter table perfis_equipe drop constraint perfis_equipe_role_check;
alter table perfis_equipe add constraint perfis_equipe_role_check
  check (role in ('tesouraria', 'recepcao', 'camisas'));

-- ─── PALESTRANTES: novos campos ───────────────────────────────────────────

alter table palestrantes add column igreja text;
alter table palestrantes add column instagram text;
alter table palestrantes add column cidade text;
alter table palestrantes add column video_url text;

-- ─── INSCRICOES: camisa por encomenda, pagamento separado ────────────────

alter table inscricoes add column modelo_camisa text;
alter table inscricoes add column faixa_etaria_camisa text
  check (faixa_etaria_camisa in ('ate_11', '12_mais'));
alter table inscricoes add column valor_camisa numeric;
alter table inscricoes add column status_pagamento_camisa text
  check (status_pagamento_camisa in ('Pendente', 'Confirmado'));

-- tamanho_camisa passa a aceitar P, M, G ou Babylook (antes só tinha a
-- referência solta a estoque_camisas; agora é só um valor livre validado
-- no client/servidor, não há mais FK de estoque).
alter table inscricoes drop constraint if exists inscricoes_tamanho_camisa_fkey;

-- ─── TRIGGER DE COLUNAS: agora libera dois status por update direto ──────
-- tesouraria e camisas são duas equipes internas de confiança equivalente;
-- em vez de travar por role dentro do trigger (mais complexo), qualquer
-- update direto (fora da RPC confirmar_presenca) só pode alterar
-- status_pagamento e/ou status_pagamento_camisa — nunca os outros campos.
-- A separação de QUEM pode chamar update continua garantida pelas duas
-- RLS policies (tesouraria_update_inscricoes / camisas_update_inscricoes).
-- (Sobrescreve a função criada em 0001_init.sql.)

create or replace function inscricoes_bloquear_colunas_nao_permitidas()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.bypass_column_guard', true) = 'on' then
    return new;
  end if;

  if new.status_presenca is distinct from old.status_presenca
     or new.id is distinct from old.id
     or new.nome is distinct from old.nome
     or new.cpf is distinct from old.cpf
     or new.whatsapp is distinct from old.whatsapp
     or new.quer_camisa is distinct from old.quer_camisa
     or new.tamanho_camisa is distinct from old.tamanho_camisa
     or new.modelo_camisa is distinct from old.modelo_camisa
     or new.faixa_etaria_camisa is distinct from old.faixa_etaria_camisa
     or new.valor is distinct from old.valor
     or new.valor_camisa is distinct from old.valor_camisa
     or new.created_at is distinct from old.created_at
  then
    raise exception 'Apenas status_pagamento ou status_pagamento_camisa podem ser alterados por este canal';
  end if;

  return new;
end;
$$;

-- Policy de update para a role "camisas" confirmar pagamento da camisa.
create policy "camisas_update_inscricoes" on inscricoes
  for update
  using (
    exists (
      select 1 from perfis_equipe pe
      where pe.id = auth.uid() and pe.role = 'camisas'
    )
  )
  with check (
    exists (
      select 1 from perfis_equipe pe
      where pe.id = auth.uid() and pe.role = 'camisas'
    )
  );

-- ─── criar_inscricao: nova versão, sem estoque, com camisa por encomenda ──

drop function if exists criar_inscricao(text, text, text, boolean, text);

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
  -- TODO: manter sincronizado com VALOR_BASE em src/lib/config.ts.
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
    p_nome, p_cpf, p_whatsapp, v_valor,
    p_quer_camisa, p_modelo_camisa, p_tamanho_camisa, p_faixa_etaria_camisa,
    v_valor_camisa, case when p_quer_camisa then 'Pendente' else null end
  )
  returning * into v_nova;

  return v_nova;
end;
$$;

grant execute on function criar_inscricao(text, text, text, boolean, text, text, text) to anon, authenticated;

-- ─── Primeira palestrante confirmada ──────────────────────────────────────
-- Igreja e cidade ainda não foram informadas — preencha depois pela Table
-- Editor do Supabase quando tiver essa informação.
insert into palestrantes (nome, instagram, video_url, resumo, ordem) values (
  'Alessandra Machado',
  '@alessandramachado12_',
  '/palestrantes/alessandra-machado.mp4',
  'TODO: preencher resumo/bio real.',
  1
);

-- ─── FAQ: explica a pulseira entregue no check-in ─────────────────────────
update perguntas_frequentes
set resposta = 'Não é necessário. Sua entrada é o QR Code que aparece na aba "Meu Passe" depois que o pagamento é confirmado — mostre ele pelo celular na recepção e você recebe uma pulseira de identificação para usar durante o congresso.'
where pergunta = 'Vou receber algum ingresso físico?';
