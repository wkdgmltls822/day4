# 제주 감귤이 월드 — 설정 & 배포 가이드

Vite + Supabase(회원가입/로그인/보관함) + Pixabay(사진) + Vercel(배포)

> 🔐 **비밀 키는 절대 GitHub 에 올리지 마세요.** `.env` 파일은 `.gitignore` 로 막혀 있어요.
> 브라우저에서 쓰는 Supabase 키는 반드시 **anon(public)** 키만! `service_role` 키는 어디에도 넣지 않아요.

---

## 0. 준비물
- Node.js 18 이상 (https://nodejs.org → LTS)
- GitHub 계정, Supabase 계정, Pixabay 계정, Vercel 계정(GitHub 로 가입하면 편해요)

---

## 1. Supabase 프로젝트 만들기
1. https://supabase.com → **Start your project** → 로그인
2. **New project** → 이름(예: `jeju-site`), Database 비밀번호 설정, Region 은 **Northeast Asia (Seoul)** 추천 → Create
3. 프로젝트가 만들어질 때까지 1~2분 기다리기

### 1-1. 환경변수에 넣을 값 찾기
**Project Settings(톱니바퀴) → API** 화면에서
| 화면에 보이는 이름 | 넣을 환경변수 |
|---|---|
| **Project URL** (`https://xxxx.supabase.co`) | `VITE_SUPABASE_URL` |
| **Project API keys → anon / public** | `VITE_SUPABASE_ANON_KEY` |

(새 화면에서는 *Publishable key* 라고 부르기도 해요. `service_role` / *secret* 키는 쓰지 마세요.)

### 1-2. 로그인(Authentication) 설정
**Authentication → Providers → Email** 이 켜져 있는지 확인.

- 개발/테스트 중에 이메일 인증 없이 바로 로그인하고 싶다면: **Authentication → Sign In / Providers → Email → Confirm email** 을 **OFF**
  (실제 서비스에서는 ON 을 추천 — 이때는 가입 후 메일의 인증 링크를 눌러야 로그인돼요.)
- **Authentication → URL Configuration**
  - **Site URL**: 배포 후에는 Vercel 주소(`https://내프로젝트.vercel.app`), 개발 중에는 `http://localhost:5173`
  - **Redirect URLs** 에 아래를 **모두** 추가
    - `http://localhost:5173`
    - `http://localhost:5173/**`
    - `https://내프로젝트.vercel.app`
    - `https://내프로젝트.vercel.app/**`

### 1-3. 테이블 만들기 (보관함 ♥ + 장바구니 🛒)
가장 쉬운 방법: [`supabase/schema.sql`](supabase/schema.sql) 파일을 열어 **내용 전체**를 복사 →
Supabase **SQL Editor → New query**(에디터를 `Ctrl+A` 로 비운 뒤) 붙여넣기 → **Run**.
여러 번 실행해도 안전해요. (SQL Editor 에는 **SQL 문장만** 넣어야 해요. 한국어 문장을 넣으면 `syntax error` 가 나요.)

장바구니 테이블만 따로 만들고 싶다면 이 구문만 실행하세요.
```sql
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
create policy "내 장바구니 보기"   on public.cart_items for select using (auth.uid() = user_id);
create policy "내 장바구니에 담기" on public.cart_items for insert with check (auth.uid() = user_id);
create policy "내 장바구니 수정"   on public.cart_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "내 장바구니 삭제"   on public.cart_items for delete using (auth.uid() = user_id);
```

보관함(♥) 테이블 구문은 아래와 같아요.

```sql
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

create policy "내 보관함만 보기"  on public.favorites for select using (auth.uid() = user_id);
create policy "내 보관함에 담기"  on public.favorites for insert with check (auth.uid() = user_id);
create policy "내 보관함에서 빼기" on public.favorites for delete using (auth.uid() = user_id);
```
RLS(행 단위 보안)가 켜져 있어서 로그인한 사람은 **자기 것만** 보고 수정할 수 있어요.

---

## 2. Pixabay API 키 받기
1. https://pixabay.com 가입/로그인
2. https://pixabay.com/api/docs/ 로 이동 → 문서 중간 **Parameters** 위쪽에 **Your API key** 가 보여요
3. 그 값이 `VITE_PIXABAY_API_KEY` 예요.

사용 규칙(요약): 사진 출처(Pixabay, 작가)를 표시해 주세요(사이트에 이미 들어 있어요). API 결과는 24시간 캐시(코드에 반영됨). 사진을 영구 핫링크하지 말고 오래 쓸 사진은 내려받아 직접 호스팅하는 걸 권장해요.

---

## 3. 내 컴퓨터에서 실행하기
```bash
cd jeju-site
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```
`.env` 를 열어서 값을 채우기:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...(anon public key)
VITE_PIXABAY_API_KEY=12345678-abcdef...
```
```bash
npm install
npm run dev
```
→ http://localhost:5173 에서 확인. `.env` 를 고치면 개발 서버를 껐다 켜야 반영돼요.

확인 순서: ① 회원가입 → ② (인증 켰다면) 메일 링크 클릭 → ③ 로그인 → ④ 갤러리에서 ♡ 누르기 → ⑤ "내 보관함"에서 확인.

---

## 4. GitHub 에 올리기
저장소 루트(여기서는 `day4`)에서:
```bash
git add jeju-site
git status            # .env 가 목록에 없는지 꼭 확인!
git commit -m "Add Jeju IP site"
git push origin main
```

---

## 5. Vercel 에 배포하기
1. https://vercel.com → **Add New… → Project** → GitHub 저장소(`day4`) **Import**
2. **Configure Project** 화면에서
   - **Root Directory**: `jeju-site` 로 **Edit** (저장소 안의 하위 폴더이기 때문)
   - **Framework Preset**: Vite (자동 인식)
   - **Build Command**: `npm run build` / **Output Directory**: `dist` (기본값 그대로)
3. **Environment Variables** 펼쳐서 **3개를 하나씩** 추가 (Name / Value)
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase anon public 키 |
   | `VITE_PIXABAY_API_KEY` | Pixabay 키 |
   Environment 는 **Production / Preview / Development 모두 체크**
4. **Deploy** 클릭 → 끝나면 `https://○○○.vercel.app` 주소가 생겨요.
5. ⚠️ **마지막 필수 단계**: 그 주소를 Supabase **Authentication → URL Configuration** 의 **Site URL** 과 **Redirect URLs** 에 추가 (1-2 참고). 안 하면 인증 메일 링크가 localhost 로 가요.

환경변수를 나중에 바꿨다면 Vercel **Deployments → 최신 배포 → ⋯ → Redeploy** 를 해야 반영돼요
(`VITE_` 변수는 빌드할 때 코드에 들어가기 때문이에요).

---

## 6. 자주 겪는 문제
| 증상 | 해결 |
|---|---|
| 화면 위에 노란 "환경변수가 아직 없어요" 띠 | `.env` 값이 비었거나 서버 재시작 필요 / Vercel 은 변수 추가 후 Redeploy |
| `Invalid login credentials` | 이메일/비밀번호 오타, 또는 이메일 인증 전 |
| 인증 메일이 안 와요 | 스팸함 확인. 테스트 중이면 Confirm email 을 OFF. 무료 플랜은 시간당 메일 발송 수 제한이 있어요 |
| 인증 링크가 localhost 로 열려요 | Site URL / Redirect URLs 에 Vercel 주소 추가 |
| ♥ 누르면 "저장하지 못했어요" | 1-3 의 SQL 을 실행했는지 확인 |
| 🛒 담기를 누르면 "장바구니에 문제가 생겼어요" | 1-3 의 `cart_items` SQL 을 실행했는지 확인 |
| 사진 대신 이모지 타일만 보여요 | Pixabay 키 확인 (하루 요청 제한을 넘었을 수도 있어요) |
