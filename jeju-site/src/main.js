import './style.css';
import { supabase, hasSupabase } from './supabase.js';
import { searchImages, hasPixabay } from './pixabay.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const TABS = [
  ['제주 전경', 'jeju island'], ['한라산', 'hallasan mountain jeju'], ['감귤', 'tangerine orange fruit'],
  ['유채꽃', 'canola flower field'], ['돌하르방', 'dol hareubang jeju statue'], ['바다', 'jeju sea coast'],
];
const CHARACTERS = [
  { emoji: '🍊', name: '감귤이', desc: '제주 감귤밭에서 태어난 폴짝폴짝 주인공. 뭐든 새콤달콤하게 바꿔요!', q: 'tangerine orange fruit', bg: 'linear-gradient(135deg,#ffb347,#ff7a1a)' },
  { emoji: '🗿', name: '돌하르방', desc: '섬을 지키는 든든한 수호신. 무뚝뚝해 보여도 마음은 따뜻해요.', q: 'dol hareubang jeju statue', bg: 'linear-gradient(135deg,#9aa0a8,#5d636b)' },
  { emoji: '🐴', name: '제주 조랑말', desc: '유채꽃밭을 달리는 작고 씩씩한 친구. 바람보다 빨라요.', q: 'jeju pony horse field', bg: 'linear-gradient(135deg,#d9a066,#8e5a2b)' },
  { emoji: '🌊', name: '바다 요정', desc: '성산 앞바다에 사는 파란 요정. 파도 소리로 노래해요.', q: 'jeju sea coast', bg: 'linear-gradient(135deg,#4fc3ff,#2a6fd0)' },
];

let user = null;
let tabIdx = 0;
let images = [];
let favs = []; // Supabase favorites 행
const favIds = () => new Set(favs.map(f => Number(f.image_id)));

// ---------- 공통 UI ----------
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.add('hidden'), 2600);
}
function showNotice() {
  const miss = [];
  if (!hasSupabase) miss.push('Supabase(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
  if (!hasPixabay) miss.push('Pixabay(VITE_PIXABAY_API_KEY)');
  if (!miss.length) return;
  const n = $('#notice');
  n.innerHTML = `⚠️ 환경변수가 아직 없어요: <b>${miss.join(', ')}</b> — SETUP.md 를 따라 .env 를 만들어 주세요. 지금은 샘플 화면이 보여요.`;
  n.classList.remove('hidden');
}
function placeholder(emoji, bg) { return `<div class="ph" style="background:${bg || 'linear-gradient(135deg,#7fe7ff,#ffd23f)'}">${emoji}</div>`; }

// ---------- 인증 ----------
const KO_ERRORS = [
  [/invalid login credentials/i, '이메일 또는 비밀번호가 맞지 않아요.'],
  [/email not confirmed/i, '이메일 인증을 먼저 완료해 주세요. 메일함(스팸함도!)을 확인해 보세요.'],
  [/already registered|already been registered/i, '이미 가입된 이메일이에요. 로그인해 주세요.'],
  [/password should be at least/i, '비밀번호는 6자 이상이어야 해요.'],
  [/rate limit|too many/i, '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'],
  [/invalid email|unable to validate email/i, '이메일 형식이 올바르지 않아요.'],
  [/failed to fetch|network/i, '네트워크 연결을 확인해 주세요.'],
];
const koError = m => (KO_ERRORS.find(([re]) => re.test(m || '')) || [, m || '알 수 없는 오류가 생겼어요.'])[1];

let mode = 'login';
function setMode(m) {
  mode = m;
  document.querySelectorAll('.seg button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  $('.nick-row').classList.toggle('hidden', m !== 'signup');
  $('#auth-submit').textContent = m === 'login' ? '로그인' : '회원가입';
  $('#auth-form [name=password]').autocomplete = m === 'login' ? 'current-password' : 'new-password';
  setMsg('');
}
function setMsg(text, ok = false) { const el = $('#auth-msg'); el.textContent = text; el.className = 'msg' + (ok ? ' ok' : ''); }
function openAuth(m = 'login') {
  if (!hasSupabase) { toast('Supabase 환경변수를 먼저 설정해 주세요 (SETUP.md)'); return; }
  setMode(m); $('#auth-dialog').showModal();
}

async function onAuthSubmit(e) {
  e.preventDefault();
  const f = new FormData(e.target), email = f.get('email').trim(), password = f.get('password');
  const btn = $('#auth-submit'); btn.disabled = true; setMsg('잠시만요…', true);
  try {
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      $('#auth-dialog').close(); toast('로그인 성공! 환영해요 🍊');
    } else {
      const nickname = (f.get('nickname') || '').trim() || email.split('@')[0];
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nickname }, emailRedirectTo: window.location.origin } });
      if (error) throw error;
      if (data.user && data.user.identities && data.user.identities.length === 0) throw new Error('User already registered');
      if (data.session) { $('#auth-dialog').close(); toast('가입 완료! 바로 로그인됐어요 🎉'); }
      else setMsg('가입 신청 완료! 메일함의 인증 링크를 누르면 로그인할 수 있어요. 📧', true);
    }
  } catch (err) { setMsg(koError(err.message)); }
  finally { btn.disabled = false; }
}

function renderAuthArea() {
  const a = $('#auth-area');
  if (user) {
    const nick = user.user_metadata?.nickname || user.email.split('@')[0];
    a.innerHTML = `<span class="hello">🍊 ${esc(nick)}님</span><button class="btn small ghost" id="logout">로그아웃</button>`;
    $('#logout').onclick = async () => { await supabase.auth.signOut(); toast('로그아웃 했어요. 또 만나요!'); };
  } else {
    a.innerHTML = `<button class="btn small ghost" id="login-btn">로그인</button><button class="btn small primary" id="signup-btn">회원가입</button>`;
    $('#login-btn').onclick = () => openAuth('login'); $('#signup-btn').onclick = () => openAuth('signup');
  }
  $('#lounge-guest').classList.toggle('hidden', !!user);
  $('#lounge-member').classList.toggle('hidden', !user);
  if (user) $('#welcome').textContent = `${user.user_metadata?.nickname || user.email.split('@')[0]}님의 ♥ 보관함이에요.`;
}

async function setUser(u) {
  user = u; renderAuthArea();
  await Promise.all([loadFavs(), loadCart()]);
}

// ---------- 즐겨찾기 (Supabase DB) ----------
async function loadFavs() {
  favs = []; $('#lounge-note').textContent = '';
  if (supabase && user) {
    const { data, error } = await supabase.from('favorites').select('*').order('created_at', { ascending: false });
    if (error) $('#lounge-note').textContent = '보관함 테이블이 아직 없어요. SETUP.md 의 SQL 을 Supabase 에서 한 번 실행해 주세요.';
    else favs = data;
  }
  renderFavs(); renderGrid();
}
async function toggleFav(img) {
  if (!user) { openAuth('login'); return; }
  const had = favIds().has(img.id);
  const { error } = had
    ? await supabase.from('favorites').delete().eq('image_id', img.id)
    : await supabase.from('favorites').insert({ image_id: img.id, image_url: img.preview, page_url: img.page });
  if (error) { toast('저장하지 못했어요. SETUP.md 의 SQL 을 실행했는지 확인해 주세요.'); return; }
  toast(had ? '보관함에서 뺐어요' : '보관함에 담았어요 ♥');
  await loadFavs();
}

// ---------- 샵 / 장바구니 (Supabase cart_items 테이블) ----------
const PRODUCTS = [
  { id: 'keyring', emoji: '🍊', name: '감귤이 키링', price: 5900, q: 'tangerine orange fruit' },
  { id: 'magnet', emoji: '🗿', name: '돌하르방 마그넷', price: 4500, q: 'dol hareubang jeju statue' },
  { id: 'box', emoji: '📦', name: '제주 감귤 한 박스 (3kg)', price: 15900, q: 'tangerine orange tree' },
  { id: 'postcard', emoji: '💌', name: '유채꽃 엽서 세트', price: 3900, q: 'canola flower field' },
  { id: 'mug', emoji: '☕', name: '한라산 머그컵', price: 12000, q: 'hallasan mountain jeju' },
  { id: 'tote', emoji: '👜', name: '바다 요정 에코백', price: 9800, q: 'jeju sea coast' },
];
const prod = id => PRODUCTS.find(p => p.id === id);
const won = n => '₩' + Number(n).toLocaleString('ko-KR');
let cart = [];
const prodImg = {};

function renderShop() {
  $('#products').innerHTML = PRODUCTS.map(p => `<article class="product">
    <div class="p-img">${prodImg[p.id] ? `<img src="${esc(prodImg[p.id])}" alt="${esc(p.name)}" loading="lazy" />` : placeholder(p.emoji)}</div>
    <h3>${esc(p.name)}</h3><div class="price">${won(p.price)}</div>
    <button class="btn primary small add-cart" data-id="${p.id}">🛒 담기</button></article>`).join('');
}
async function loadProductImages() {
  await Promise.all(PRODUCTS.map(async p => { const [img] = await searchImages(p.q, 3); if (img) prodImg[p.id] = img.preview; }));
  renderShop();
}
function renderCart() {
  const rows = cart.filter(c => prod(c.product_id));
  const count = rows.reduce((s, c) => s + c.quantity, 0), total = rows.reduce((s, c) => s + c.quantity * prod(c.product_id).price, 0);
  $('#cart-count').textContent = count; $('#cart-count').classList.toggle('on', count > 0);
  $('#cart-total').textContent = won(total);
  $('#checkout').disabled = !rows.length; $('#cart-clear').disabled = !rows.length;
  $('#cart-list').innerHTML = !user ? '<p class="note">로그인하면 장바구니를 쓸 수 있어요.</p>'
    : rows.length ? rows.map(c => { const p = prod(c.product_id);
        return `<div class="cart-row"><div class="c-img">${prodImg[p.id] ? `<img src="${esc(prodImg[p.id])}" alt="" />` : p.emoji}</div>
          <div class="c-info"><b>${esc(p.name)}</b><span>${won(p.price)}</span>
            <div class="qty"><button data-act="dec" data-id="${p.id}">−</button><em>${c.quantity}</em><button data-act="inc" data-id="${p.id}">＋</button></div></div>
          <div class="c-side"><b>${won(p.price * c.quantity)}</b><button class="rm" data-act="rm" data-id="${p.id}" title="빼기">🗑</button></div></div>`; }).join('')
      : '<p class="note">장바구니가 비어 있어요. 샵에서 담아 보세요!</p>';
}
async function loadCart() {
  cart = []; $('#cart-note').textContent = '';
  if (supabase && user) {
    const { data, error } = await supabase.from('cart_items').select('*').order('created_at');
    if (error) $('#cart-note').textContent = '장바구니 테이블이 아직 없어요. supabase/schema.sql 을 Supabase SQL Editor 에서 실행해 주세요.';
    else cart = data;
  }
  renderCart();
}
const cartErr = () => toast('장바구니에 문제가 생겼어요. supabase/schema.sql 을 실행했는지 확인해 주세요.');
async function addToCart(id) {
  if (!user) { openAuth('login'); return; }
  const row = cart.find(c => c.product_id === id);
  const { error } = row
    ? await supabase.from('cart_items').update({ quantity: Math.min(99, row.quantity + 1), updated_at: new Date().toISOString() }).eq('product_id', id)
    : await supabase.from('cart_items').insert({ product_id: id, quantity: 1 });
  if (error) { cartErr(); return; }
  toast(`${prod(id).name} 을(를) 담았어요 🛒`); await loadCart();
}
async function setQty(id, q) {
  const { error } = q < 1
    ? await supabase.from('cart_items').delete().eq('product_id', id)
    : await supabase.from('cart_items').update({ quantity: Math.min(99, q), updated_at: new Date().toISOString() }).eq('product_id', id);
  if (error) cartErr(); else await loadCart();
}
async function clearCart() {
  const { error } = await supabase.from('cart_items').delete().neq('product_id', '');
  if (error) cartErr(); else { toast('장바구니를 비웠어요'); await loadCart(); }
}
function toggleCart(open) {
  $('#cart-drawer').classList.toggle('open', open); $('#cart-overlay').classList.toggle('hidden', !open);
  if (open && !user) openAuth('login');
}

// ---------- 갤러리 ----------
function figure(img, liked) {
  return `<figure class="shot">
    <img src="${esc(img.preview)}" alt="${esc(img.tags)}" loading="lazy" data-large="${esc(img.large || img.preview)}" />
    <button class="heart ${liked ? 'on' : ''}" data-id="${img.id}" title="보관함에 담기">${liked ? '♥' : '♡'}</button>
    <figcaption>📷 <a href="${esc(img.page)}" target="_blank" rel="noopener">${esc(img.user)}</a> · Pixabay</figcaption>
  </figure>`;
}
function renderGrid() {
  const g = $('#grid'), liked = favIds();
  if (!images.length) {
    g.innerHTML = Array.from({ length: 8 }, (_, i) => placeholder(['🍊', '🌋', '🌼', '🌊', '🗿', '🐴', '🏝️', '☀️'][i])).join('');
    return;
  }
  g.innerHTML = images.map(i => figure(i, liked.has(i.id))).join('');
}
function renderFavs() {
  const g = $('#fav-grid');
  g.innerHTML = favs.length
    ? favs.map(f => `<figure class="shot"><img src="${esc(f.image_url)}" alt="보관한 사진" loading="lazy" data-large="${esc(f.image_url)}" />
        <button class="heart on" data-fav="${f.image_id}" title="보관함에서 빼기">♥</button>
        <figcaption><a href="${esc(f.page_url || 'https://pixabay.com')}" target="_blank" rel="noopener">Pixabay 에서 보기</a></figcaption></figure>`).join('')
    : '<p class="note">아직 비어 있어요. 갤러리에서 ♡ 를 눌러 보세요!</p>';
}
async function selectTab(i) {
  tabIdx = i;
  document.querySelectorAll('.tabs button').forEach((b, k) => b.classList.toggle('on', k === i));
  $('#grid').innerHTML = '<p class="note">불러오는 중…</p>';
  images = await searchImages(TABS[i][1], 12);
  renderGrid();
}

// ---------- 히어로 / 캐릭터 ----------
async function loadHero() {
  const [img] = await searchImages('jeju island sea', 6);
  if (img) $('#hero').style.setProperty('--hero-img', `url("${img.large}")`);
}
async function loadCards() {
  const box = $('#cards');
  box.innerHTML = CHARACTERS.map((c, i) => `<article class="card"><div class="card-img" id="ci-${i}">${placeholder(c.emoji, c.bg)}</div>
    <h3>${c.emoji} ${esc(c.name)}</h3><p>${esc(c.desc)}</p></article>`).join('');
  CHARACTERS.forEach(async (c, i) => {
    const [img] = await searchImages(c.q, 5);
    if (img) $(`#ci-${i}`).innerHTML = `<img src="${esc(img.preview)}" alt="${esc(c.name)}" loading="lazy" />`;
  });
}

// ---------- 초기화 ----------
function wire() {
  $('#tabs').innerHTML = TABS.map(([label], i) => `<button data-i="${i}">${label}</button>`).join('');
  $('#tabs').onclick = e => { const b = e.target.closest('button'); if (b) selectTab(+b.dataset.i); };
  document.querySelectorAll('.seg button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
  $('#auth-form').addEventListener('submit', onAuthSubmit);
  $('#auth-cancel').onclick = () => $('#auth-dialog').close();
  $('#hero-join').onclick = () => (user ? document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' }) : openAuth('signup'));
  $('#lounge-login').onclick = () => openAuth('login');
  $('#cart-btn').onclick = () => toggleCart(true);
  $('#cart-close').onclick = $('#cart-overlay').onclick = () => toggleCart(false);
  $('#cart-clear').onclick = clearCart;
  $('#checkout').onclick = () => toast('데모 상점이라 결제는 연결돼 있지 않아요. 주문 연동은 다음 단계에서! 🍊');
  document.body.addEventListener('click', e => {
    const add = e.target.closest('.add-cart'); if (add) { addToCart(add.dataset.id); return; }
    const b = e.target.closest('#cart-list button[data-act]'); if (!b) return;
    const row = cart.find(c => c.product_id === b.dataset.id); if (!row) return;
    setQty(row.product_id, b.dataset.act === 'inc' ? row.quantity + 1 : b.dataset.act === 'dec' ? row.quantity - 1 : 0);
  });
  document.body.addEventListener('click', e => {
    const heart = e.target.closest('.heart');
    if (heart) {
      if (heart.dataset.fav) { toggleFav({ id: Number(heart.dataset.fav) }); return; }
      const img = images.find(i => String(i.id) === heart.dataset.id); if (img) toggleFav(img); return;
    }
    const pic = e.target.closest('.shot img');
    if (pic) { const lb = $('#lightbox'); $('img', lb).src = pic.dataset.large; lb.classList.remove('hidden'); return; }
    if (e.target.closest('#lightbox')) $('#lightbox').classList.add('hidden');
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') $('#lightbox').classList.add('hidden'); });
}

async function init() {
  wire(); showNotice(); renderAuthArea(); renderFavs(); renderShop(); renderCart(); loadProductImages();
  loadHero(); loadCards(); selectTab(0);
  if (!hasSupabase) return;
  const { data } = await supabase.auth.getSession();
  await setUser(data.session?.user ?? null);
  supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); });
}
init();
