-- Jalankan jika username tidak ketemu / login gagal
create or replace function public.get_login_email(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from public.profiles where lower(trim(username)) = lower(trim(p_username)) limit 1;
$$;

grant execute on function public.get_login_email(text) to anon;
grant execute on function public.get_login_email(text) to authenticated;
