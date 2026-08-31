import { useEffect, useRef } from "react";
import * as THREE from "three";

const BIOME_COLS = [
  { grass: 0x5a9a3c, dirt: 0x866446, wood: 0x6b4a28, leaf: 0x3d7a32, water: 0x3a78c8, sky: 0x87b4e0 },
  { grass: 0x2e6a1c, dirt: 0x6b4a28, wood: 0x4a3018, leaf: 0x1a5a18, water: 0x2a5a88, sky: 0x6aa0d0 },
  { grass: 0xd8c04a, dirt: 0xc4a15a, wood: 0x8a6030, leaf: 0x7a9a4a, water: 0x5aa0c8, sky: 0xe8d090 },
  { grass: 0xe8eef4, dirt: 0xd0d8e0, wood: 0x8aa0b0, leaf: 0xc8e0d0, water: 0xa8d0e8, sky: 0xc8d8e8 },
  { grass: 0x3a7a5a, dirt: 0x4a3a28, wood: 0x3a2818, leaf: 0x2a5a3a, water: 0x2a68a8, sky: 0x5a90c8 },
  { grass: 0x6aaa3a, dirt: 0x7a5a38, wood: 0x5a3820, leaf: 0x4a8a3a, water: 0x3a78c8, sky: 0x6aa8e0 },
  { grass: 0xe08aa8, dirt: 0x866446, wood: 0x6b4a28, leaf: 0xe08aa8, water: 0x6ab4d8, sky: 0xf0c8d8 },
  { grass: 0x4a6a3a, dirt: 0x3a2a18, wood: 0x2a1a10, leaf: 0x3a5a28, water: 0x2a4a3a, sky: 0x6a7860 },
];

export function TitlePano() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(1.25, window.devicePixelRatio || 1));
    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2(0x87b4e0, 0.014);
    scene.fog = fog;
    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 220);
    scene.add(new THREE.HemisphereLight(0xc8dcff, 0x3a2a18, 0.95));
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.05);
    sun.position.set(40, 70, 20);
    scene.add(sun);

    const geo = new THREE.BoxGeometry(1, 1, 1);
    const buckets = new Map<number, THREE.Object3D[]>();
    const dummy = new THREE.Object3D();
    const hash = (n: number) => {
      n |= 0;
      n = Math.imul(n ^ (n >>> 16), 2246822519);
      n = Math.imul(n ^ (n >>> 13), 3266489917);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    };
    const push = (color: number, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
      dummy.position.set(x, y, z);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      const obj = dummy.clone();
      obj.matrix.copy(dummy.matrix);
      const list = buckets.get(color) ?? [];
      list.push(obj);
      buckets.set(color, list);
    };

    const R = 28;
    for (let x = -R; x <= R; x++) {
      for (let z = -R; z <= R; z++) {
        const d = Math.hypot(x, z);
        if (d > R) continue;
        const ang = (Math.atan2(z, x) + Math.PI) / (Math.PI * 2);
        const bi = Math.min(7, Math.floor(ang * 8));
        const b = BIOME_COLS[bi]!;
        const n = hash(x * 73 + z * 41);
        const hill = Math.sin(x * 0.14) * Math.cos(z * 0.11) * 3.4 + n * 2.4;
        const ocean = bi === 4;
        const isWater = ocean && hill < 1.1;
        const h = isWater ? 1.8 : Math.max(1.6, 3.2 + hill);
        push(isWater ? b.water : b.grass, x, h / 2, z, 1, h, 1);
        if (!isWater && n > 0.84 && d < R - 3) {
          push(b.wood, x, h + 1.1, z, 0.32, 2.2, 0.32);
          push(b.leaf, x, h + 2.4, z, 1.5, 1.3, 1.5);
        }
      }
    }

    const meshes: THREE.InstancedMesh[] = [];
    for (const [color, list] of buckets) {
      const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color }), list.length);
      list.forEach((o, i) => mesh.setMatrixAt(i, o.matrix));
      mesh.instanceMatrix.needsUpdate = true;
      scene.add(mesh);
      meshes.push(mesh);
    }

    const skyGeo = new THREE.SphereGeometry(140, 12, 8);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x6aa8e0, side: THREE.BackSide });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    let raf = 0;
    let t0 = performance.now();
    let yaw = 0.4;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - t0) / 1000);
      t0 = now;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(1, h);
        camera.updateProjectionMatrix();
      }
      if (!reduce) yaw += dt * 0.1;
      const dist = 22;
      camera.position.set(Math.sin(yaw) * dist, 11, Math.cos(yaw) * dist);
      camera.lookAt(0, 5, 0);
      const bi = Math.min(7, Math.floor(((((yaw / (Math.PI * 2)) % 1) + 1) % 1) * 8));
      const sky = BIOME_COLS[bi]!.sky;
      skyMat.color.set(sky);
      fog.color.set(sky);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      geo.dispose();
      skyGeo.dispose();
      skyMat.dispose();
      for (const m of meshes) {
        (m.material as THREE.Material).dispose();
        m.dispose();
      }
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
