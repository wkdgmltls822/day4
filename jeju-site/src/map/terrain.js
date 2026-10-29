import * as THREE from 'three';

// AWS Terrarium 타일(z10, 약 128m/px) 12장 -> 제주도 실제 지형. 1 unit = 1 km
export const BOUNDS = { lonW: 126.05, lonE: 127.05, latS: 33.05, latN: 33.65 };
export const EXAG = 4; // 높이 과장 배수
const Z = 10, X0 = 870, Y0 = 410, NX = 4, NY = 3;

const mercPx = (lon, lat) => {
  const n = 256 * 2 ** Z;
  return [(lon + 180) / 360 * n - X0 * 256, (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * n - Y0 * 256];
};

/** 타일 PNG 를 읽어 표고(m) 배열로 변환. Terrarium: R*256 + G + B/256 - 32768 */
export async function loadDEM(onProgress = () => {}) {
  const W = NX * 256, H = NY * 256, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  let done = 0;
  await Promise.all(Array.from({ length: NX * NY }, (_, i) => new Promise((res, rej) => {
    const tx = i % NX, ty = Math.floor(i / NX), img = new Image();
    img.onload = () => { ctx.drawImage(img, tx * 256, ty * 256); onProgress(++done / (NX * NY)); res(); };
    img.onerror = () => rej(new Error('지형 타일을 불러오지 못했어요'));
    img.src = `${import.meta.env.BASE_URL}dem/t_${X0 + tx}_${Y0 + ty}.png`;
  })));
  const px = ctx.getImageData(0, 0, W, H).data;
  const [fx0, fy0] = mercPx(BOUNDS.lonW, BOUNDS.latN), [fx1, fy1] = mercPx(BOUNDS.lonE, BOUNDS.latS);
  const ox = Math.floor(fx0), oy = Math.floor(fy0), w = Math.floor(fx1) - ox, h = Math.floor(fy1) - oy;
  const elev = new Float32Array(w * h);
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const i = ((oy + r) * W + ox + c) * 4;
    elev[r * w + c] = px[i] * 256 + px[i + 1] + px[i + 2] / 256 - 32768;
  }
  return { elev, w, h, ox, oy };
}

const lerp = (a, b, t) => a + (b - a) * t;
const STOPS = [ // [표고 m, 색]
  [0, [0.86, 0.80, 0.55]], [40, [0.62, 0.78, 0.38]], [250, [0.36, 0.64, 0.30]], [600, [0.24, 0.50, 0.28]],
  [1000, [0.45, 0.50, 0.30]], [1400, [0.58, 0.55, 0.45]], [1800, [0.74, 0.70, 0.62]], [1950, [0.88, 0.85, 0.80]],
];
function landColor(e, noise) {
  let i = 0; while (i < STOPS.length - 2 && e > STOPS[i + 1][0]) i++;
  const [e0, c0] = STOPS[i], [e1, c1] = STOPS[i + 1], t = Math.max(0, Math.min(1, (e - e0) / (e1 - e0)));
  const k = 1 + (noise - 0.5) * 0.12;
  return [lerp(c0[0], c1[0], t) * k, lerp(c0[1], c1[1], t) * k, lerp(c0[2], c1[2], t) * k];
}
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

/** 지형 메쉬 + 좌표 변환 도구(경위도 <-> 월드) 를 만든다. */
export function buildTerrain(dem) {
  const { elev, w, h, ox, oy } = dem;
  const pxKm = 40075.016686 * Math.cos(((BOUNDS.latS + BOUNDS.latN) / 2) * Math.PI / 180) / (256 * 2 ** Z);
  const at = (c, r) => elev[Math.max(0, Math.min(h - 1, r | 0)) * w + Math.max(0, Math.min(w - 1, c | 0))];
  const bilinear = (c, r) => {
    const c0 = Math.floor(c), r0 = Math.floor(r), fc = c - c0, fr = r - r0;
    return lerp(lerp(at(c0, r0), at(c0 + 1, r0), fc), lerp(at(c0, r0 + 1), at(c0 + 1, r0 + 1), fc), fr);
  };
  const toPx = (lon, lat) => { const [px, py] = mercPx(lon, lat); return [px - ox, py - oy]; };
  const world = {
    pxKm, w, h,
    toWorld: (lon, lat) => { const [c, r] = toPx(lon, lat); return { x: (c - w / 2) * pxKm, z: (r - h / 2) * pxKm }; },
    elevM: (lon, lat) => { const [c, r] = toPx(lon, lat); return bilinear(c, r); },
    elevAtWorldM: (x, z) => bilinear(x / pxKm + w / 2, z / pxKm + h / 2),
    yOfM: e => (e > 0 ? e / 1000 * EXAG : Math.max(e, -150) / 1000 * EXAG * 0.5),
  };
  world.groundY = (lon, lat) => world.yOfM(world.elevM(lon, lat));
  world.groundYAt = (x, z) => world.yOfM(world.elevAtWorldM(x, z));

  const step = 2, gw = Math.floor((w - 1) / step) + 1, gh = Math.floor((h - 1) / step) + 1;
  const pos = new Float32Array(gw * gh * 3), col = new Float32Array(gw * gh * 3), idx = [];
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const c = Math.min(i * step, w - 1), r = Math.min(j * step, h - 1), e = at(c, r), k = (j * gw + i) * 3;
    pos[k] = (c - w / 2) * pxKm; pos[k + 1] = world.yOfM(e); pos[k + 2] = (r - h / 2) * pxKm;
    let rgb;
    if (e > 0.5) rgb = landColor(e, hash(c, r));
    else { const d = Math.min(1, -e / 70); rgb = [lerp(0.30, 0.04, d), lerp(0.62, 0.20, d), lerp(0.80, 0.42, d)]; }
    col[k] = rgb[0]; col[k + 1] = rgb[1]; col[k + 2] = rgb[2];
  }
  for (let j = 0; j < gh - 1; j++) for (let i = 0; i < gw - 1; i++) {
    const a = j * gw + i, b = a + 1, c = a + gw, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }));
  return { mesh, world };
}

/** 섬 한가운데에서 사방으로 걸어 나가 해안선 근처 점들을 모아 올레길(개략) 순환 경로를 만든다. */
export function coastRing(dem, world, inlandKm = 1.4, stepDeg = 3) {
  const { elev, w, h } = dem, pts = [], cx = w / 2 + 2, cy = h / 2 - 2;
  for (let a = 0; a < 360; a += stepDeg) {
    const rad = a * Math.PI / 180, dx = Math.cos(rad), dy = Math.sin(rad);
    let last = 0, sea = 0;
    for (let d = 5; d < Math.max(w, h); d += 1) {
      const c = Math.round(cx + dx * d), r = Math.round(cy + dy * d);
      if (c < 0 || r < 0 || c >= w || r >= h) break;
      if (elev[r * w + c] > 4) { last = d; sea = 0; }
      else if (last > 0 && ++sea > 3) break; // 첫 해안선에서 멈춤 (우도·마라도 같은 딸린 섬으로 건너뛰지 않게)
    }
    const d = Math.max(5, last - inlandKm / world.pxKm);
    const x = (cx + dx * d - w / 2) * world.pxKm, z = (cy + dy * d - h / 2) * world.pxKm;
    pts.push(new THREE.Vector3(x, world.groundYAt(x, z) + 0.12, z));
  }
  return pts;
}
