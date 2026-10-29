-- Supabase > SQL Editor > New query 에 "이 파일 내용만" 붙여넣고 Run 하세요.
-- (한국어 설명 문장은 SQL 이 아니라서 에디터에 넣으면 오류가 나요. 주석(--)만 괜찮아요.)
-- 여러 번 실행해도 안전하도록 if not exists / drop policy if exists 를 썼어요.

-- =========================================================
-- 1) 보관함 (갤러리 ♥)
-- =========================================================
create table if not exists public.favorites (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  image_id bigint not null,
  image_url text not null,
  page_url text,
  created_at timestamptz not null default now(),
  unique (user_id, image_id)
);
alter table public.favorites enable row level security;

drop policy if exists "내 보관함만 보기"   on public.favorites;
drop policy if exists "내 보관함에 담기"   on public.favorites;
drop policy if exists "내 보관함에서 빼기" on public.favorites;
create policy "내 보관함만 보기"   on public.favorites for select using (auth.uid() = user_id);
create policy "내 보관함에 담기"   on public.favorites for insert with check (auth.uid() = user_id);
create policy "내 보관함에서 빼기" on public.favorites for delete using (auth.uid() = user_id);

-- =========================================================
-- 2) 장바구니 (감귤이 샵)
--    한 사람이 같은 상품을 한 줄로만 가지도록 (user_id, product_id) 를 unique 로 묶어요.
-- =========================================================
create table if not exists public.cart_items (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id text not null,
  quantity int not null default 1 check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);
alter table public.cart_items enable row level security;

drop policy if exists "내 장바구니 보기"   on public.cart_items;
drop policy if exists "내 장바구니에 담기" on public.cart_items;
drop policy if exists "내 장바구니 수정"   on public.cart_items;
drop policy if exists "내 장바구니 삭제"   on public.cart_items;
create policy "내 장바구니 보기"   on public.cart_items for select using (auth.uid() = user_id);
create policy "내 장바구니에 담기" on public.cart_items for insert with check (auth.uid() = user_id);
create policy "내 장바구니 수정"   on public.cart_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "내 장바구니 삭제"   on public.cart_items for delete using (auth.uid() = user_id);
