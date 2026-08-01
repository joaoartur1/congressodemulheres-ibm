-- Doce Presença — Congresso de Mulheres 2026
-- Galeria de looks de inspiração (roupas nas cores da paleta oficial),
-- editada pela organização direto no Supabase — não temos fotos reais de
-- looks ainda, então a tabela começa vazia e a página mostra "em breve".

create table looks (
  id bigint generated always as identity primary key,
  foto_url text not null,
  legenda text,
  ordem int not null default 0
);

alter table looks enable row level security;

create policy "looks_select_publico" on looks
  for select using (true);
