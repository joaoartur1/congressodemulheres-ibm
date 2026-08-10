-- Doce Presença — Congresso de Mulheres 2026
-- BUG: a migração 0010 removeu de inscricoes as colunas quer_camisa,
-- tamanho_camisa, modelo_camisa, faixa_etaria_camisa e valor_camisa, mas
-- esqueceu de atualizar este trigger — que ainda tentava ler new.quer_camisa
-- etc a cada UPDATE. Como essas colunas não existem mais, TODO update em
-- inscricoes (inclusive "Confirmar pagamento" na tesouraria) passou a
-- falhar com "column does not exist".
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
     or new.valor is distinct from old.valor
     or new.created_at is distinct from old.created_at
  then
    raise exception 'Apenas status_pagamento pode ser alterado por este canal';
  end if;

  return new;
end;
$$;
