-- Doce Presença — Congresso de Mulheres 2026
-- Completa o perfil da Alessandra Machado com dados reais extraídos do
-- próprio post dela no Instagram (cidade ainda não informada).

update palestrantes
set
  nome = 'Apa. Alessandra Machado',
  igreja = 'Ministério Apostólico Internacional Shalom',
  resumo = 'Casada com o Ap. Silvio Antonio e mãe de Timóteo e Thalita. Pedagoga, Teóloga, pós-graduada em Docência do Ensino Superior e mestra em Ministério Prático e Coaching. Pastora líder do Ministério Apostólico Internacional Shalom há 30 anos, ao lado do esposo, dedicada ao cuidado e à edificação de vidas.'
where instagram = '@alessandramachado12_';
