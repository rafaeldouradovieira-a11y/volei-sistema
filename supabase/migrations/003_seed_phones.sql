-- =============================================
-- RESET: limpa toda a base de dados
-- =============================================
delete from public.game_participants;
delete from public.waiting_list;
delete from public.games;
delete from public.profiles;
delete from public.authorized_phones;
delete from public.unauthorized_attempts;

-- Limpa usuários do Supabase Auth (cascata destrói profiles também)
delete from auth.users;

-- =============================================
-- Insere telefones autorizados
-- Formato: DDD + número local (sem 55, sem espaços)
-- =============================================
insert into public.authorized_phones (phone, is_admin) values
  ('6992178522', true),   -- ADMIN
  ('6993002836', true),   -- ADMIN
  ('6984860053', false),
  ('6992435951', false),
  ('6984278851', false),
  ('6992129840', false),
  ('6993743939', false),
  ('6992920601', false),
  ('6984080007', false),
  ('6993450061', false),
  ('6993734799', false),
  ('6984727235', false),
  ('6999112424', false),
  ('6993712025', false),
  ('6992811054', false),
  ('6999615875', false),
  ('6992197051', false),
  ('6993025038', false),
  ('6993526200', false),
  ('6992874524', false),
  ('6981442277', false),
  ('6592319412', false),
  ('6981197431', false),
  ('6993788087', false),
  ('6981342128', false),
  ('6992121401', false),
  ('6984577414', false),
  ('6993198210', false),
  ('6993121636', false),
  ('6992892357', false),
  ('6992219988', false),
  ('6999068372', false);
