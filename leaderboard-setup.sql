-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
create table if not exists lb_players (
  pid text primary key,
  name text not null,
  realm int not null,
  bp double precision not null,
  updated timestamptz not null default now()
);
-- RLS on with no policies: nobody can read or write the table directly (so player ids stay private).
alter table lb_players enable row level security;

create or replace function lb_submit(p_pid text, p_name text, p_realm int, p_bp double precision)
returns void language plpgsql security definer set search_path = public as $$
begin
  if length(p_pid) < 16 or length(p_pid) > 64 or p_realm < 0 or p_realm > 11 or p_bp < 0 or p_bp > 1e30 then
    raise exception 'invalid';
  end if;
  insert into lb_players (pid, name, realm, bp)
  values (p_pid, left(coalesce(nullif(trim(p_name), ''), 'Nameless Cultivator'), 24), p_realm, p_bp)
  on conflict (pid) do update set
    name = excluded.name,
    realm = greatest(lb_players.realm, excluded.realm),
    bp = greatest(lb_players.bp, excluded.bp),
    updated = now();
end $$;

create or replace function lb_top(p_pid text, p_n int default 50)
returns table (rank bigint, name text, realm int, bp double precision, me boolean)
language sql security definer set search_path = public as $$
  with r as (
    select row_number() over (order by realm desc, bp desc, updated asc) as rk,
           lb_players.name, lb_players.realm, lb_players.bp, (pid = p_pid) as me
    from lb_players
  )
  select rk, r.name, r.realm, r.bp, r.me from r where rk <= least(p_n, 100) or r.me order by rk;
$$;

grant execute on function lb_submit(text, text, int, double precision) to anon;
grant execute on function lb_top(text, int) to anon;
