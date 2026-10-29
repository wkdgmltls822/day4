import * as THREE from 'three';

// 선명한 바다 셰이더: 또렷한 물결 무늬, 해 반사(반짝임), 수심에 따른 청록→짙은 파랑, 해안선 흰 거품
// 수심/해안은 지형 DEM 에서 만든 텍스처(R=수심 0~80m, G=육지)로 알아내요.
const vert = /* glsl */`
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const frag = /* glsl */`
uniform float uTime;
uniform sampler2D uDepth;
uniform vec2 uExtent;
uniform vec3 uSunDir;
uniform vec3 uFogColor;
uniform float uFogDensity;
varying vec3 vWorld;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
// 여러 방향의 사인파를 합친 높이의 기울기 -> 법선
vec2 slope(vec2 p, float t) {
  vec2 s = vec2(0.0);
  s += vec2(0.9, 0.4) * cos(dot(p, vec2(0.9, 0.4)) * 2.1 + t * 1.3) * 0.55;
  s += vec2(-0.5, 0.8) * cos(dot(p, vec2(-0.5, 0.8)) * 3.3 - t * 1.7) * 0.40;
  s += vec2(0.2, -1.0) * cos(dot(p, vec2(0.2, -1.0)) * 5.7 + t * 2.3) * 0.30;
  s += vec2(1.0, 0.1) * cos(dot(p, vec2(1.0, 0.1)) * 9.5 - t * 2.9) * 0.18;
  return s;
}

void main() {
  vec2 p = vWorld.xz;
  vec2 uv = vec2(p.x / uExtent.x + 0.5, p.y / uExtent.y + 0.5);
  vec4 d = texture2D(uDepth, uv);
  float depthN = d.r;                       // 0 = 해안, 1 = 깊은 바다
  float t = uTime;

  // 법선: 가까울수록 잔물결을 더해서 또렷하게
  vec3 viewV = normalize(cameraPosition - vWorld);
  float dist = length(cameraPosition - vWorld);
  vec2 sl = slope(p * 0.9, t) * 0.22 + (vec2(noise(p * 5.0 + t * 0.35), noise(p * 5.0 - t * 0.3 + 7.0)) - 0.5) * 0.34;
  sl *= 1.0 - smoothstep(60.0, 220.0, dist) * 0.7;
  vec3 N = normalize(vec3(-sl.x, 1.0, -sl.y));

  // 색: 얕은 곳은 청록, 깊은 곳은 짙은 파랑
  vec3 shallow = vec3(0.24, 0.88, 0.85), mid = vec3(0.10, 0.62, 0.90), deep = vec3(0.04, 0.32, 0.68);
  vec3 col = mix(shallow, mid, smoothstep(0.02, 0.28, depthN));
  col = mix(col, deep, smoothstep(0.25, 0.9, depthN));

  // 물결 마루(또렷한 밝은 선)
  float w1 = sin(dot(p, vec2(0.8, 0.5)) * 4.0 + t * 1.2 + noise(p * 1.5) * 4.0);
  float w2 = sin(dot(p, vec2(-0.4, 0.9)) * 6.5 - t * 1.6 + noise(p * 2.2 + 3.0) * 4.0);
  float crest = smoothstep(0.86, 0.97, max(w1, w2));
  col += crest * 0.16 * (1.0 - smoothstep(80.0, 240.0, dist));

  // 하늘 반사 + 해 반사 반짝임
  float fres = pow(1.0 - max(dot(N, viewV), 0.0), 3.0);
  col = mix(col, vec3(0.70, 0.88, 1.0), fres * 0.5);
  vec3 R = reflect(-uSunDir, N);
  float spec = pow(max(dot(R, viewV), 0.0), 90.0);
  col += vec3(1.0, 0.96, 0.85) * spec * 1.4;
  col += vec3(1.0, 0.96, 0.85) * pow(max(dot(R, viewV), 0.0), 14.0) * 0.12;

  // 해안선 거품: 밀려왔다 나가는 흰 줄무늬
  float shore = 1.0 - smoothstep(0.0, 0.12, depthN);
  float wash = 0.5 + 0.5 * sin(depthN * 95.0 - t * 2.2 + noise(p * 6.0) * 3.0);
  float foam = shore * smoothstep(0.35, 0.8, wash * (0.55 + noise(p * 9.0 + t * 0.4)));
  foam += (1.0 - smoothstep(0.0, 0.02, depthN)) * 0.7;
  col = mix(col, vec3(1.0), clamp(foam, 0.0, 1.0) * 0.92);

  // 안개 (장면의 FogExp2 와 같은 식)
  float f = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
  col = mix(col, uFogColor, clamp(f, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}`;

export function buildWater(dem, world, sunPos, fogColor, fogDensity) {
  const { w, h, elev } = dem, data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const e = elev[i], land = e > 0.5;
    data[i * 4] = land ? 0 : Math.round(Math.min(1, -e / 80) * 255);
    data[i * 4 + 1] = land ? 255 : 0;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    uniforms: {
      uTime: { value: 0 }, uDepth: { value: tex }, uExtent: { value: new THREE.Vector2(w * world.pxKm, h * world.pxKm) },
      uSunDir: { value: sunPos.clone().normalize() }, uFogColor: { value: fogColor.clone() }, uFogDensity: { value: fogDensity },
    },
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), mat);
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = 0.012;
  return mesh;
}
