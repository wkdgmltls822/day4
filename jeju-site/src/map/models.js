import * as THREE from 'three';

// 지도에서 잘 보이도록 실제 크기보다 크게 만든 장난감 같은 모델들 (1 unit = 1 km)
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...o });
const glowMat = (color, op = 0.5) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });

export function turbine(h = 2.2) {
  const g = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.018, h * 0.035, h, 10), mat(0xf4f6f8));
  tower.position.y = h / 2; g.add(tower);
  const hub = new THREE.Group(); hub.position.set(0, h, h * 0.05);
  hub.add(new THREE.Mesh(new THREE.SphereGeometry(h * 0.05, 10, 10), mat(0xffffff)));
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Group(); arm.rotation.z = i * Math.PI * 2 / 3;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(h * 0.055, h * 0.5, h * 0.012), mat(0xffffff));
    blade.position.y = h * 0.25; arm.add(blade); hub.add(arm);
  }
  g.add(hub); g.userData.rotor = hub; g.userData.speed = 1.2 + Math.random() * 0.8;
  return g;
}

export function lighthouse(h = 2) {
  const g = new THREE.Group(), seg = 4, sh = h * 0.7 / seg;
  for (let i = 0; i < seg; i++) {
    const r0 = h * 0.11 - i * h * 0.012, r1 = r0 - h * 0.012;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, sh, 14), mat(i % 2 ? 0xe84a5f : 0xffffff));
    m.position.y = sh * (i + 0.5); g.add(m);
  }
  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.1, h * 0.1, h * 0.03, 14), mat(0x333844));
  gallery.position.y = h * 0.7; g.add(gallery);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(h * 0.075, 14, 10), new THREE.MeshBasicMaterial({ color: 0xfff0a0 }));
  lamp.position.y = h * 0.78; g.add(lamp);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(h * 0.09, h * 0.12, 14), mat(0xe84a5f));
  roof.position.y = h * 0.9; g.add(roof);
  const beam = new THREE.Group(); beam.position.y = h * 0.78;
  const coneGeo = new THREE.ConeGeometry(h * 0.35, h * 2.2, 18, 1, true); coneGeo.rotateZ(-Math.PI / 2); coneGeo.translate(h * 1.1, 0, 0);
  beam.add(new THREE.Mesh(coneGeo, glowMat(0xfff0a0, 0.28))); g.add(beam);
  g.userData.beam = beam; g.userData.lamp = lamp;
  return g;
}

export function hareubang(h = 2.4) {
  const g = new THREE.Group(), stone = mat(0x8d8a82, { roughness: 0.95 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.2, h * 0.26, h * 0.55, 16), stone); body.position.y = h * 0.275; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(h * 0.2, 16, 14), stone); head.scale.y = 1.1; head.position.y = h * 0.72; g.add(head);
  const hat = new THREE.Mesh(new THREE.SphereGeometry(h * 0.26, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x77746c, { roughness: 1 }));
  hat.scale.y = 0.55; hat.position.y = h * 0.8; g.add(hat);
  const dark = new THREE.MeshBasicMaterial({ color: 0x2b2926 });
  [-1, 1].forEach(s => { const eye = new THREE.Mesh(new THREE.SphereGeometry(h * 0.025, 8, 8), dark); eye.position.set(s * h * 0.07, h * 0.74, h * 0.18); g.add(eye); });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(h * 0.04, 8, 8), stone); nose.scale.set(1, 1.3, 1); nose.position.set(0, h * 0.69, h * 0.2); g.add(nose);
  [-1, 1].forEach(s => { const hand = new THREE.Mesh(new THREE.SphereGeometry(h * 0.06, 10, 8), stone); hand.position.set(s * h * 0.1, h * 0.42, h * 0.22); g.add(hand); });
  return g;
}

export function pin(color = 0xff6b9d, s = 1) {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22 * s, 0.7 * s, 14), mat(color, { emissive: color, emissiveIntensity: 0.35 }));
  cone.rotation.x = Math.PI; cone.position.y = 0.35 * s; g.add(cone);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.28 * s, 16, 12), mat(color, { emissive: color, emissiveIntensity: 0.35 }));
  ball.position.y = 0.85 * s; g.add(ball);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.1 * s, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  dot.position.set(0, 0.85 * s, 0.2 * s); g.add(dot);
  g.userData.bob = g;
  return g;
}

export function flag(color = 0x7fbf5a) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6), mat(0xeeeeee)); pole.position.y = 0.55; g.add(pole);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.32), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  cloth.position.set(0.28, 0.95, 0); g.add(cloth);
  g.userData.cloth = cloth;
  return g;
}

export function port() {
  const g = new THREE.Group();
  const pier = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.07, 0.28), mat(0x9a9aa2)); pier.position.y = 0.06; g.add(pier);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.025, 8, 36), new THREE.MeshBasicMaterial({ color: 0x4fc3ff, transparent: true, opacity: 0.8 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.04; g.add(ring);
  const boats = [];
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.16), mat(i % 2 ? 0xffffff : 0x2a8fe0)); hull.position.y = 0.06; b.add(hull);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.12), mat(0xffd23f)); cab.position.set(-0.05, 0.16, 0); b.add(cab);
    b.position.set(-0.5 + i * 0.5, 0, 0.42 + (i % 2) * 0.25); b.userData.ph = i * 2.1; g.add(b); boats.push(b);
  }
  g.userData.boats = boats; g.userData.ring = ring;
  return g;
}

/** 감귤나무 숲: 초록 수관 + 주황 열매를 InstancedMesh 로 한 번에 그린다. place(x,z) -> y */
export function citrusGrove(cx, cz, radius, count, groundYAt) {
  const g = new THREE.Group(), dummy = new THREE.Object3D();
  const canopy = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 8, 6), mat(0x2f9e4f), count);
  const fruit = new THREE.InstancedMesh(new THREE.SphereGeometry(0.034, 6, 5), new THREE.MeshStandardMaterial({ color: 0xff8a1f, emissive: 0xff6a00, emissiveIntensity: 0.35 }), count * 3);
  let fi = 0;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * radius, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, y = groundYAt(x, z);
    if (y < 0.01) { dummy.position.set(0, -50, 0); dummy.updateMatrix(); canopy.setMatrixAt(i, dummy.matrix); continue; }
    dummy.position.set(x, y + 0.1, z); dummy.scale.setScalar(0.8 + Math.random() * 0.5); dummy.updateMatrix(); canopy.setMatrixAt(i, dummy.matrix);
    for (let k = 0; k < 3; k++) {
      const fx = x + (Math.random() - 0.5) * 0.14, fz = z + (Math.random() - 0.5) * 0.14, fy = y + 0.1 + (Math.random() - 0.3) * 0.12;
      dummy.position.set(fx, fy, fz); dummy.scale.setScalar(1); dummy.updateMatrix(); fruit.setMatrixAt(fi++, dummy.matrix);
    }
  }
  for (; fi < count * 3; fi++) { dummy.position.set(0, -50, 0); dummy.updateMatrix(); fruit.setMatrixAt(fi, dummy.matrix); }
  g.add(canopy, fruit);
  return g;
}
