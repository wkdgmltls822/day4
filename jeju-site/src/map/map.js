import './map.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadDEM, buildTerrain, coastRing } from './terrain.js';
import { buildWater } from './water.js';
import { LAYERS, PLACES, PRESETS } from './landmarks.js';
import { turbine, lighthouse, hareubang, pin, flag, port, citrusGrove } from './models.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const layerOf = id => LAYERS.find(l => l.id === id);

// ---------- 기본 장면 ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
$('#stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const SKY = new THREE.Color(0xa9dcff);
scene.background = SKY; scene.fog = new THREE.FogExp2(SKY, 0.0038);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 900);
camera.position.set(0, 78, 92);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.07; controls.minDistance = 3; controls.maxDistance = 240; controls.maxPolarAngle = Math.PI * 0.49;
controls.autoRotateSpeed = 0.6;
scene.add(new THREE.HemisphereLight(0xdff2ff, 0x4a5a3a, 1.25));
const sun = new THREE.DirectionalLight(0xfff1d0, 2.4); sun.position.set(-60, 90, 40); scene.add(sun);

// 바다는 지형을 불러온 뒤 water.js 의 셰이더로 만든다 (init 참고)
let water = null;

// ---------- 레이어 ----------
const groups = {}; LAYERS.forEach(l => { groups[l.id] = new THREE.Group(); scene.add(groups[l.id]); });
const markers = [], hitMeshes = [], anim = { turbines: [], beams: [], bobs: [], boats: [], rings: [], flags: [] };
let world = null, olleCurve = null;
const walkers = [];

function addMarker(p, visual, hitPos, hitR = 1.1) {
  const hit = new THREE.Mesh(new THREE.SphereGeometry(hitR, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.copy(hitPos);
  const lab = document.createElement('div'); lab.className = 'mk-label' + (p.always ? ' always' : '');
  lab.textContent = `${layerOf(p.cat).icon} ${p.name}`; $('#labels').appendChild(lab);
  const m = { place: p, visual, hit, label: lab, top: hitPos.clone().add(new THREE.Vector3(0, 1.0, 0)), cat: p.cat };
  hit.userData.marker = m; groups[p.cat].add(visual, hit); markers.push(m); hitMeshes.push(hit);
  return m;
}

function placeOnGround(obj, x, z, lift = 0) { obj.position.set(x, Math.max(0, world.groundYAt(x, z)) + lift, z); }

function buildPlaces() {
  const extra = [{ id: 'olle-start', cat: 'olle', name: '제주올레 1코스 시작 · 시흥리 일대', lat: 33.4720, lon: 126.9150, desc: '제주올레는 해안과 중산간을 잇는 걷기 길로, 정규 코스 26개 · 약 425km예요. 지도의 주황색 선은 해안을 따라 도는 "개략" 경로이고 실제 코스와는 달라요.' }];
  [...PLACES, ...extra].forEach(p => {
    const { x, z } = world.toWorld(p.lon, p.lat), y = Math.max(0, world.groundYAt(x, z));
    const color = new THREE.Color(layerOf(p.cat).color);
    let v;
    if (p.cat === 'tour' || p.cat === 'olle') { v = pin(color, p.always ? 1.3 : 1); placeOnGround(v, x, z); anim.bobs.push({ b: v, base: v.position.y }); }
    else if (p.cat === 'oreum') { v = flag(color); placeOnGround(v, x, z); if (p.always) v.scale.setScalar(2.2); anim.flags.push(v); }
    else if (p.cat === 'port') { v = port(); v.position.set(x, 0.02, z); anim.boats.push(...v.userData.boats.map(b => ({ b, base: b.position.y }))); anim.rings.push(v.userData.ring); }
    else if (p.cat === 'light') { v = lighthouse(2); placeOnGround(v, x, z); anim.beams.push(v.userData.beam); }
    else if (p.cat === 'hare') { v = hareubang(2.4); placeOnGround(v, x, z); v.rotation.y = Math.random() * 0.8 - 0.4; }
    else if (p.cat === 'wind') {
      v = new THREE.Group();
      for (let i = 0; i < p.n; i++) {
        const t = turbine(2.4 + (i % 2) * 0.3), tx = x + (i - (p.n - 1) / 2) * 0.95, tz = z + Math.sin(i * 1.7) * 0.5;
        placeOnGround(t, tx, tz); v.add(t); anim.turbines.push(t);
      }
    } else if (p.cat === 'citrus') { v = citrusGrove(x, z, p.r, 260, world.groundYAt); }
    else return;
    addMarker(p, v, new THREE.Vector3(x, y + 0.9, z), p.cat === 'citrus' ? p.r * 0.6 : 1.1);
  });
}

function buildOlle(dem) {
  const pts = coastRing(dem, world);
  olleCurve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.3);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(olleCurve, 420, 0.09, 6, true), new THREE.MeshStandardMaterial({ color: 0xff9d1c, emissive: 0xff7a00, emissiveIntensity: 0.9 }));
  groups.olle.add(tube);
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
    s.userData.t = i / 14; groups.olle.add(s); walkers.push(s);
  }
}

// ---------- UI: 레이어 / 프리셋 ----------
function buildUI() {
  $('#layers').innerHTML = LAYERS.map(l => `<label class="chk"><input type="checkbox" data-layer="${l.id}" checked /><i style="background:${l.color}"></i>${l.icon} ${l.label}</label>`).join('');
  $('#layers').addEventListener('change', e => { const id = e.target.dataset.layer; if (id) groups[id].visible = e.target.checked; });
  $('#presets').innerHTML = PRESETS.map(p => `<button data-p="${p.id}">${p.label}</button>`).join('');
  $('#presets').addEventListener('click', e => { const b = e.target.closest('button'); if (b) goPreset(PRESETS.find(p => p.id === b.dataset.p)); });
  $('#autorot').addEventListener('change', e => { controls.autoRotate = e.target.checked; });
  $('#info-close').onclick = () => $('#info').classList.add('hidden');
}

// ---------- 카메라 이동 ----------
let fly = null;
function flyTo(target, offset, dur = 1.5) {
  fly = { t: 0, dur, fromT: controls.target.clone(), fromP: camera.position.clone(), toT: target.clone(), toP: target.clone().add(offset) };
}
function goPreset(p) {
  if (p.place) { const m = markers.find(m => m.place.id === p.place); if (m) { flyTo(new THREE.Vector3(m.hit.position.x, m.hit.position.y - 0.5, m.hit.position.z), new THREE.Vector3(...p.offset)); return; } }
  flyTo(new THREE.Vector3(...(p.target || [0, 0, 0])), new THREE.Vector3(...p.offset));
}

// ---------- 방문객 데이터(공공데이터 API) ----------
const viz = { rows: [], keys: [], bars: [], year: 0, month: 0, maxMonth: 1, maxYear: 1, playing: null };
const nf = n => Math.round(n).toLocaleString('ko-KR');
const num = v => Number(String(v ?? '').replace(/[^0-9.-]/g, '')) || 0;

function buildBars() {
  PLACES.filter(p => p.vizKey).forEach(p => {
    const { x, z } = world.toWorld(p.lon, p.lat), y = Math.max(0, world.groundYAt(x, z));
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1, 0.9).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x4c1d95, emissiveIntensity: 0.5, transparent: true, opacity: 0.92 }));
    mesh.position.set(x + 1.3, y, z); mesh.scale.y = 0.001; groups.viz.add(mesh);
    const lab = document.createElement('div'); lab.className = 'mk-label val'; $('#labels').appendChild(lab);
    viz.bars.push({ place: p, mesh, label: lab, cur: 0.001, target: 0.001, value: 0, top: new THREE.Vector3() });
  });
}
function vizValue(key) {
  const rows = viz.rows.filter(r => r.y === viz.year);
  return viz.month === 0 ? rows.reduce((s, r) => s + (r.v[key] || 0), 0) : (rows.find(r => r.m === viz.month)?.v[key] || 0);
}
function refreshBars() {
  const max = viz.month === 0 ? viz.maxYear : viz.maxMonth;
  viz.bars.forEach(b => { b.value = vizValue(b.place.vizKey); b.target = Math.max(0.001, b.value / max * 9); b.mesh.material.color.setHSL(0.72 - 0.72 * Math.min(1, b.value / max), 0.8, 0.55); });
  if (!$('#info').classList.contains('hidden') && selected) showInfo(selected);
}
async function loadVisitors() {
  const st = $('#viz-status');
  try {
    const res = await fetch('/api/odcloud');
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    const data = json.data || [];
    const keys = PLACES.filter(p => p.vizKey).map(p => p.vizKey);
    viz.rows = data.map(d => ({ y: num(d['기준연도']), m: num(d['기준월']), v: Object.fromEntries(keys.map(k => [k, num(d[k])])) })).filter(r => r.y && r.m).sort((a, b) => a.y - b.y || a.m - b.m);
    if (!viz.rows.length) throw new Error('받아온 데이터가 비어 있어요');
    const years = [...new Set(viz.rows.map(r => r.y))];
    viz.maxMonth = Math.max(1, ...viz.rows.flatMap(r => keys.map(k => r.v[k])));
    viz.maxYear = Math.max(1, ...years.flatMap(y => keys.map(k => viz.rows.filter(r => r.y === y).reduce((s, r) => s + r.v[k], 0))));
    const monthsOf = y => viz.rows.filter(r => r.y === y).length, full = years.filter(y => monthsOf(y) >= 12);
    viz.year = (full.length ? full : years).slice(-1)[0]; viz.month = 0; // 12개월이 다 있는 가장 최근 연도부터 보여줘요
    $('#viz-year').innerHTML = years.map(y => `<option value="${y}">${y}년${monthsOf(y) < 12 ? ` (${monthsOf(y)}개월)` : ''}</option>`).join(''); $('#viz-year').value = viz.year;
    $('#viz-month').innerHTML = '<option value="0">연간 합계</option>' + Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1}월</option>`).join('');
    $('#viz-year').onchange = e => { viz.year = +e.target.value; refreshBars(); };
    $('#viz-month').onchange = e => { viz.month = +e.target.value; refreshBars(); };
    $('#viz-play').onclick = () => {
      if (viz.playing) { clearInterval(viz.playing); viz.playing = null; $('#viz-play').textContent = '▶ 월별 재생'; return; }
      $('#viz-play').textContent = '⏸ 멈춤'; viz.month = 0;
      viz.playing = setInterval(() => { viz.month = viz.month % 12 + 1; $('#viz-month').value = viz.month; refreshBars(); }, 1300);
    };
    $('#viz-controls').classList.remove('hidden');
    st.textContent = `서귀포시 직영관광지 관람객수 · ${viz.rows.length}개월 데이터`; st.className = 'viz-status ok';
    refreshBars();
  } catch (e) {
    st.className = 'viz-status warn';
    st.innerHTML = `방문객 데이터를 아직 못 불러왔어요 (${esc(e.message)}).<br/>공공데이터 인증키를 <b>ODCLOUD_SERVICE_KEY</b> 로 등록하면 막대가 나타나요. (SETUP.md)`;
  }
}

// ---------- 정보 패널 / 선택 ----------
let selected = null;
function chartFor(key) {
  const rows = viz.rows.filter(r => r.y === viz.year); if (!rows.length) return '';
  const max = Math.max(1, ...rows.map(r => r.v[key] || 0));
  return `<div class="mini"><b>${viz.year}년 월별 방문객</b><div class="bars">${Array.from({ length: 12 }, (_, i) => {
    const r = rows.find(x => x.m === i + 1), v = r ? r.v[key] || 0 : 0;
    return `<span title="${i + 1}월 ${nf(v)}명"><i style="height:${Math.max(2, v / max * 60)}px"></i><em>${i + 1}</em></span>`;
  }).join('')}</div></div>`;
}
function showInfo(m) {
  selected = m; const p = m.place, l = layerOf(p.cat), e = world.elevM(p.lon, p.lat);
  const bar = viz.bars.find(b => b.place.id === p.id);
  $('#info-body').innerHTML = `<div class="chip" style="background:${l.color}">${l.icon} ${l.label}</div><h2>${esc(p.name)}</h2><p>${esc(p.desc)}</p>
    ${bar && viz.rows.length ? `<p class="big">${viz.month === 0 ? viz.year + '년 합계' : viz.year + '년 ' + viz.month + '월'} 방문객 <b>${nf(bar.value)}명</b></p>${chartFor(p.vizKey)}` : p.vizKey ? '<p class="note">방문객 데이터는 API 인증키를 등록하면 보여요.</p>' : ''}
    <p class="meta">위도 ${p.lat.toFixed(4)} · 경도 ${p.lon.toFixed(4)} · 지형 표고 약 ${Math.max(0, Math.round(e))}m<br/>※ 위치는 지도 표시를 위한 대략적인 값이에요.</p>`;
  $('#info').classList.remove('hidden');
}
function select(m) {
  showInfo(m);
  flyTo(new THREE.Vector3(m.hit.position.x, m.hit.position.y - 0.4, m.hit.position.z), new THREE.Vector3(7, 6, 9), 1.2);
}

// ---------- 포인터 ----------
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let down = null;
function pick(e) {
  ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera);
  const hits = ray.intersectObjects(hitMeshes.filter(h => groups[h.userData.marker.cat].visible), false);
  return hits.length ? hits[0].object.userData.marker : null;
}
renderer.domElement.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', e => {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5) { const m = pick(e); if (m) select(m); }
  down = null;
});
renderer.domElement.addEventListener('pointermove', e => {
  const m = pick(e), tip = $('#tip');
  renderer.domElement.style.cursor = m ? 'pointer' : 'grab';
  if (m) { tip.textContent = m.place.name; tip.style.left = e.clientX + 14 + 'px'; tip.style.top = e.clientY + 14 + 'px'; tip.classList.remove('hidden'); } else tip.classList.add('hidden');
});
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

// ---------- 애니메이션 ----------
const clock = new THREE.Clock(), v3 = new THREE.Vector3();
function placeLabel(el, pos, show, always) {
  if (!show) { el.style.display = 'none'; return; }
  v3.copy(pos).project(camera);
  const dist = camera.position.distanceTo(pos);
  if (v3.z > 1 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05 || (!always && dist > 70)) { el.style.display = 'none'; return; }
  el.style.display = 'block'; el.style.transform = `translate(-50%, -100%) translate(${(v3.x * 0.5 + 0.5) * innerWidth}px, ${(-v3.y * 0.5 + 0.5) * innerHeight}px)`;
  el.style.opacity = always ? 1 : Math.max(0.35, 1 - dist / 90);
}
function frame() {
  const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
  if (fly) {
    fly.t += dt / fly.dur; const k = Math.min(1, fly.t), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    controls.target.lerpVectors(fly.fromT, fly.toT, e); camera.position.lerpVectors(fly.fromP, fly.toP, e); if (k >= 1) fly = null;
  }
  controls.update();
  anim.turbines.forEach(w => { w.userData.rotor.rotation.z -= dt * w.userData.speed; });
  anim.beams.forEach(b => { b.rotation.y += dt * 1.3; });
  anim.bobs.forEach((o, i) => { o.b.position.y = o.base + 0.08 + Math.sin(t * 2 + i) * 0.07; });
  anim.boats.forEach((o, i) => { o.b.position.y = o.base + Math.sin(t * 1.6 + o.b.userData.ph) * 0.025; o.b.rotation.z = Math.sin(t * 1.3 + i) * 0.06; });
  anim.rings.forEach((r, i) => { r.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.06); });
  anim.flags.forEach((f, i) => { f.userData.cloth.rotation.y = Math.sin(t * 4 + i) * 0.4; });
  walkers.forEach(w => { w.userData.t = (w.userData.t + dt * 0.012) % 1; if (olleCurve) w.position.copy(olleCurve.getPointAt(w.userData.t)).y += 0.1; });
  if (water) water.material.uniforms.uTime.value = t;
  viz.bars.forEach(b => {
    b.cur += (b.target - b.cur) * Math.min(1, dt * 4); b.mesh.scale.y = b.cur;
    b.top.set(b.mesh.position.x, b.mesh.position.y + b.cur + 0.4, b.mesh.position.z);
    b.label.textContent = viz.rows.length ? `${nf(b.value)}명` : '';
    placeLabel(b.label, b.top, groups.viz.visible && viz.rows.length > 0, true);
  });
  markers.forEach(m => placeLabel(m.label, m.top, groups[m.cat].visible, m.place.always));
  renderer.render(scene, camera);
}

// ---------- 시작 ----------
(async function init() {
  const bar = $('#loader-bar');
  try {
    const dem = await loadDEM(p => { bar.style.width = Math.round(p * 80) + '%'; });
    const { mesh, world: w } = buildTerrain(dem); world = w; scene.add(mesh);
    water = buildWater(dem, world, sun.position, SKY, scene.fog.density); scene.add(water);
    bar.style.width = '92%';
    buildOlle(dem); buildPlaces(); buildBars(); buildUI();
    window.__jeju = { world, markers, viz, select, scene, camera, controls, dem, refreshBars };
    renderer.setAnimationLoop(frame);
    bar.style.width = '100%'; setTimeout(() => $('#loader').classList.add('hidden'), 350);
    loadVisitors();
  } catch (e) {
    $('#loader-text').textContent = '지도를 불러오지 못했어요: ' + e.message;
  }
})();
