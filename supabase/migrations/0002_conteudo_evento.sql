-- Doce Presença — Congresso de Mulheres 2026
-- Conteúdo editorial: palestrantes e perguntas frequentes.
-- Ambas as tabelas ficam vazias/leves de propósito (sem inventar nomes de
-- pessoas reais ou respostas que só a organização sabe) — edite direto pela
-- Table Editor do Supabase quando tiver os dados, sem precisar de redeploy.

create table palestrantes (
  id bigint generated always as identity primary key,
  nome text not null,
  foto_url text,
  resumo text not null,
  ordem int not null default 0
);

create table perguntas_frequentes (
  id bigint generated always as identity primary key,
  pergunta text not null,
  resposta text not null,
  ordem int not null default 0
);

alter table palestrantes enable row level security;
alter table perguntas_frequentes enable row level security;

create policy "palestrantes_select_publico" on palestrantes
  for select using (true);

create policy "faq_select_publico" on perguntas_frequentes
  for select using (true);

-- Perguntas frequentes já respondidas com segurança, porque descrevem
-- exatamente como o sistema funciona (não são palpite sobre logística do
-- evento em si, tipo estacionamento ou o que levar — essas ficam para a
-- organização adicionar depois).
insert into perguntas_frequentes (pergunta, resposta, ordem) values
  (
    'Como faço minha inscrição?',
    'Acesse a aba "Inscrição", preencha nome, CPF e WhatsApp, escolha se quer camisa e o tamanho, e confirme. Você vai receber um ID de inscrição e as instruções de pagamento via PIX.',
    1
  ),
  (
    'Como funciona o pagamento?',
    'O pagamento é feito por PIX. Depois de se inscrever, você recebe a chave PIX e o valor na tela de checkout. Após pagar, envie o comprovante para a equipe pelo botão "Confirmar via WhatsApp" — a tesouraria confirma manualmente no sistema.',
    2
  ),
  (
    'Como sei se meu pagamento já foi confirmado?',
    'Acesse a aba "Meu Passe" e digite o CPF usado na inscrição. Se o pagamento já tiver sido confirmado pela tesouraria, você verá seu QR Code de entrada ali mesmo.',
    3
  ),
  (
    'Vou receber algum ingresso físico?',
    'Não é necessário. Sua entrada é o QR Code que aparece na aba "Meu Passe" depois que o pagamento é confirmado — pode mostrar direto pelo celular na recepção.',
    4
  ),
  (
    'Posso alterar meus dados depois de me inscrever?',
    'O sistema ainda não permite edição direta. Se precisar corrigir algum dado (nome, CPF, tamanho de camisa), fale com a equipe de organização pelo WhatsApp.',
    5
  );
