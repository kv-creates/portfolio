import * as THREE from 'three';
import { STOPS } from './data.js';

const N = STOPS.length, GAP = 14, rnd = (a, b) => a + Math.random() * (b - a);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101110);
scene.fog = new THREE.FogExp2(0x101110, 0.05);
const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.getElementById('stage').appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0x78816d, 0.7));
const lamp = new THREE.PointLight(0xe5e1d8, 140, 40, 2);
scene.add(lamp);

// ---- Brutalist environment ----
const concrete = new THREE.MeshStandardMaterial({ color: 0x3a3e38, roughness: 0.95 });
const len = N * GAP + 60;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, len), new THREE.MeshStandardMaterial({ color: 0x252925, roughness: 0.85 }));
floor.rotation.x = -Math.PI / 2; floor.position.z = -len / 2 + 20; scene.add(floor);
for (let z = 10; z > -len + 20; z -= 6) for (const s of [-1, 1]) {
  const h = rnd(4, 13), m = new THREE.Mesh(new THREE.BoxGeometry(rnd(1.2, 2.8), h, rnd(1.2, 2.4)), concrete);
  m.position.set(s * rnd(6, 11), h / 2, z); scene.add(m);
}
for (let z = 0; z > -len + 20; z -= 12) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 3), concrete); m.position.set(0, 7.5, z); scene.add(m);
}
const dustGeo = new THREE.BufferGeometry(), dp = [];
for (let i = 0; i < 700; i++) dp.push(rnd(-12, 12), rnd(0, 8), rnd(10, -len + 20));
dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xb3aa96, size: 0.05, transparent: true, opacity: 0.6 })));

// ---- One object per stop ----
function label(s) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 680;
  const x = c.getContext('2d');
  x.fillStyle = '#252925'; x.fillRect(0, 0, 512, 680);
  x.strokeStyle = '#78816d'; x.lineWidth = 3; x.strokeRect(24, 24, 464, 632);
  x.fillStyle = '#78816d'; x.font = '24px "Courier New"'; x.fillText(s.k.split(' ')[0], 48, 72);
  x.fillStyle = '#e5e1d8'; let size = 64;
  do { x.font = `700 ${size--}px Arial`; } while (x.measureText(s.title).width > 410);
  x.fillText(s.title, 48, 340);
  x.fillStyle = '#b3aa96'; x.font = '22px "Courier New"';
  (s.tags || []).slice(0, 4).forEach((t, i) => x.fillText('› ' + t, 48, 400 + i * 34));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const wire = new THREE.MeshStandardMaterial({ color: 0x78816d, wireframe: true });
const solid = new THREE.MeshStandardMaterial({ color: 0xb3aa96, roughness: 0.6, metalness: 0.2 });
const objs = STOPS.map((s, i) => {
  const side = i % 2 ? -1 : 1; s.side = side; let m;
  if (s.type === 'project') {
    m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.9, 0.35),
      [concrete, concrete, concrete, concrete, new THREE.MeshStandardMaterial({ map: label(s), roughness: 0.7 }), concrete]);
  } else if (s.type === 'photo') {
    m = new THREE.Group();
    m.add(new THREE.Mesh(new THREE.BoxGeometry(2.7, 3.3, 0.2), concrete));
    const tex = new THREE.TextureLoader().load('assets/photo.jpg'); tex.colorSpace = THREE.SRGBColorSpace;
    const ph = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3), new THREE.MeshStandardMaterial({ map: tex, color: 0xcfc8b8 }));
    ph.position.z = 0.11; m.add(ph);
  } else if (s.type === 'intro') {
    m = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), wire);
  } else if (s.type === 'contact') {
    m = new THREE.Mesh(new THREE.TorusKnotGeometry(1, 0.3, 120, 16), solid);
  } else {
    m = new THREE.Mesh([new THREE.OctahedronGeometry(1.3), new THREE.BoxGeometry(1.8, 1.8, 1.8), new THREE.TetrahedronGeometry(1.5)][i % 3], i % 2 ? wire : solid);
  }
  m.position.set(side * 2.8, 1.8, -i * GAP - 4); scene.add(m); return m;
});

// ---- Panels ----
const panels = STOPS.map(s => {
  const d = document.createElement('div');
  d.className = 'panel ' + (s.type === 'intro' ? 'hero' : s.side > 0 ? 'l' : 'r');
  d.innerHTML = `<div class="k">${s.k}</div><h2>${s.title}</h2><div class="sub">${s.sub || ''}</div><p>${s.body || ''}</p>` +
    (s.tags ? `<div class="tags">${s.tags.map(t => `<span>${t}</span>`).join('')}</div>` : '') +
    (s.links || []).map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${l} ↗</a>`).join('');
  document.getElementById('panels').appendChild(d); return d;
});

// ---- Camera path driven by scroll ----
const pts = STOPS.map((s, i) => new THREE.Vector3(-s.side * 0.8, 1.7, -i * GAP));
pts.push(new THREE.Vector3(0, 1.7, -N * GAP + 4));
const curve = new THREE.CatmullRomCurve3(pts);
let target = 0, cur = 0, mx = 0, my = 0;
const look = new THREE.Vector3();
addEventListener('scroll', () => { target = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight); });
addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
addEventListener('resize', () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
const bar = document.getElementById('bar'), count = document.getElementById('count'), hint = document.getElementById('hint');

renderer.setAnimationLoop(t => {
  cur += (target - cur) * 0.06;
  const f = cur * (N - 1), tt = (cur * (N - 1)) / N;
  cam.position.copy(curve.getPoint(tt));
  look.copy(curve.getPoint(Math.min(tt + 0.02, 1)));
  const i = Math.round(f), w = 1 - Math.min(1, Math.abs(f - i) * 2);
  look.lerp(objs[i].position, w * 0.55);
  cam.lookAt(look);
  cam.rotation.y -= mx * 0.08; cam.rotation.x -= my * 0.05;
  lamp.position.copy(cam.position).add(new THREE.Vector3(0, 2, 1));
  objs.forEach((o, k) => { o.rotation.y = Math.sin(t / 2000 + k) * 0.35; if (STOPS[k].type !== 'project' && STOPS[k].type !== 'photo') o.rotation.x = t / 4000; });
  panels.forEach((p, k) => {
    const o = Math.max(0, Math.min(1, 1 - Math.abs(f - k) * 2.2));
    p.style.opacity = o; p.style.transform = `translateY(calc(-50% + ${(1 - o) * 24}px))`;
    p.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
  });
  bar.style.height = cur * 100 + '%';
  count.textContent = String(i).padStart(2, '0') + ' / ' + String(N - 1).padStart(2, '0');
  hint.style.display = cur > 0.02 ? 'none' : 'block';
  renderer.render(scene, cam);
});
