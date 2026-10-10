import { useEffect, useRef } from "react";
import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Fog,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NoToneMapping,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Raycaster,
  RingGeometry,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { heroTrace, serviceColorIndex, SPAN_PALETTE, formatMs, type Span } from "@/lib/trace";
import { worldStore, WORLD_SECTIONS, SECTION_TITLES, type WorldState } from "@/lib/worldStore";

/* ---------------------------------------------------------------------------
   Public types
--------------------------------------------------------------------------- */
export type Pick = { kind: "span"; span: Span } | { kind: "buoy"; id: string; title: string };

export interface WorldCanvasProps {
  theme: "dark" | "light";
  narrow: boolean;
  onReady: () => void;
  onFail: () => void;
  onHover: (pick: Pick | null, x: number, y: number) => void;
  onPick: (pick: Pick) => void;
  onLabels: (labels: { id: string; x: number; y: number; visible: boolean }[]) => void;
}

/* ---------------------------------------------------------------------------
   Constants
--------------------------------------------------------------------------- */
const W = 3.0;
const D = 2.0;
const BASE_H = 0.1;
const LID_D = 1.95;
const LID_H = 0.06;
const SCREEN_W = 2.78;
const SCREEN_H = 1.74;
const OPEN_ANGLE = MathUtils.degToRad(106);
const FOV = 32;
const HALF_TAN = Math.tan((FOV / 2) * (Math.PI / 180));

const TEX_W = 1600;
const TEX_H = 1000;
const HEADER_H = 92;
const LABEL_W = 470;
const PAD = 28;

const RIVER_SAMPLES = 360;
const BODY = { dark: "#2a2e35", light: "#c8ccd2" };
const KEYS = { dark: "#15181d", light: "#2b2f36" };
const THEME = {
  dark: { ground: "#15181d", bank: "#1d2127", bankEdge: "#2e343d", grid: "#1f242b", water: "#244653", waterDeep: "#1b353f", foam: "#78b4c6", flow: "#dd9a5b", paper: "#e8e2d6", sail: "#dd9a5b", stone: "#3a414c", reed: "#6f8560", fog: "#15181d", ambient: 0.9, key: 1.5 },
  light: { ground: "#f3f4f0", bank: "#e7e8e2", bankEdge: "#cfd2cb", grid: "#dfe1db", water: "#a9ccd6", waterDeep: "#8fbac6", foam: "#ffffff", flow: "#9a5a1f", paper: "#fbf8f2", sail: "#9a5a1f", stone: "#b9bcb5", reed: "#7f9a6c", fog: "#f3f4f0", ambient: 1.5, key: 2.0 },
};

function smooth(a: number, b: number, p: number): number {
  const x = MathUtils.clamp((p - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
}
function rand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

interface Pose {
  pos: Vector3;
  target: Vector3;
}

/** The river: starts beside the laptop, meanders along +x, opens into a lake. */
const RIVER = new CatmullRomCurve3(
  [
    new Vector3(-2.5, 0, 4.6),
    new Vector3(3, 0, 3.6),
    new Vector3(8, 0, 1.2),
    new Vector3(13, 0, 2.8),
    new Vector3(19, 0, -0.6),
    new Vector3(25, 0, 1.4),
    new Vector3(31, 0, -1.8),
    new Vector3(37, 0, 0.4),
    new Vector3(43, 0, -1.2),
    new Vector3(49, 0, 0.6),
    new Vector3(56, 0, 0),
    new Vector3(66, 0, 0),
  ],
  false,
  "centripetal",
  0.5,
);
function riverWidth(t: number): number {
  const base = 1.7 + 0.5 * Math.sin(t * 19) + 0.3 * Math.sin(t * 7 + 1);
  const lake = smooth(0.86, 1, t) * 7.5;
  return base + lake;
}

/** Paper boat, folded from a handful of triangles. Faces +x. */
function paperBoat(): { hull: BufferGeometry; sail: BufferGeometry } {
  const K1 = [-0.62, 0, 0];
  const K2 = [0.62, 0, 0];
  const L1 = [-0.62, 0.24, 0];
  const L2 = [-0.26, 0.26, -0.27];
  const L3 = [0.26, 0.26, -0.27];
  const L4 = [0.62, 0.24, 0];
  const R2 = [-0.26, 0.26, 0.27];
  const R3 = [0.26, 0.26, 0.27];
  const tri = (...pts: number[][]) => pts.flat();
  const hullPts = [
    ...tri(K1, K2, L4), ...tri(K1, L4, L3), ...tri(K1, L3, L2), ...tri(K1, L2, L1),
    ...tri(K1, L4, K2), ...tri(K1, R3, L4), ...tri(K1, R2, R3), ...tri(K1, L1, R2),
    ...tri(L2, L3, R3), ...tri(L2, R3, R2), // deck
  ];
  const hull = new BufferGeometry();
  hull.setAttribute("position", new Float32BufferAttribute(hullPts, 3));
  hull.computeVertexNormals();
  const sailPts = [...tri([-0.3, 0.26, 0], [0.3, 0.26, 0], [0, 0.82, 0])];
  const sail = new BufferGeometry();
  sail.setAttribute("position", new Float32BufferAttribute(sailPts, 3));
  sail.computeVertexNormals();
  return { hull, sail };
}

/**
 * One scene for the whole home page: the laptop on the bank, then a paper
 * boat drifting downstream past a buoy for each section. Scroll drives the
 * boat; the camera follows it. Idle work is just the water and the boat's bob.
 */
export default function WorldCanvas(props: WorldCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const apiRef = useRef<{ setTheme: (t: "dark" | "light") => void } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      propsRef.current.onFail();
      return;
    }
    renderer.toneMapping = NoToneMapping;
    renderer.setClearColor(0x000000, 0);
    const narrowNow = () => propsRef.current.narrow;
    let pixelRatio = Math.min(window.devicePixelRatio || 1, narrowNow() ? 1.5 : 2);
    renderer.setPixelRatio(pixelRatio);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.setAttribute("aria-hidden", "true");

    const scene = new Scene();
    const camera = new PerspectiveCamera(FOV, 1, 0.1, 140);
    const pmrem = new PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.fog = new Fog(THEME.dark.fog, 28, 64);
    const tmp = new Object3D();
    const rng = rand(7);

    /* ------------------------------ ground + grid ------------------------- */
    const groundMat = new MeshBasicMaterial({ color: THEME.dark.ground });
    const ground = new Mesh(new PlaneGeometry(220, 120), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(30, -0.02, 0);
    scene.add(ground);
    const gridPts: number[] = [];
    for (let x = -14; x <= 76; x += 2) gridPts.push(x, 0, -24, x, 0, 24);
    for (let z = -24; z <= 24; z += 2) gridPts.push(-14, 0, z, 76, 0, z);
    const gridGeo = new BufferGeometry();
    gridGeo.setAttribute("position", new Float32BufferAttribute(gridPts, 3));
    const gridMat = new LineBasicMaterial({ transparent: true, opacity: 0.8 });
    scene.add(new LineSegments(gridGeo, gridMat));

    /* ------------------------------ river --------------------------------- */
    const pts = RIVER.getSpacedPoints(RIVER_SAMPLES);
    const tangents: Vector3[] = [];
    const normals: Vector3[] = [];
    const upV = new Vector3(0, 1, 0);
    for (let i = 0; i <= RIVER_SAMPLES; i++) {
      const tg = RIVER.getTangentAt(i / RIVER_SAMPLES).normalize();
      tangents.push(tg);
      normals.push(new Vector3().crossVectors(upV, tg).normalize()); // left of flow
    }
    const ribbon = (inner: (t: number) => number, outer: (t: number) => number, y: number, side: 1 | -1 | 0) => {
      const pos: number[] = [];
      const idx: number[] = [];
      for (let i = 0; i <= RIVER_SAMPLES; i++) {
        const t = i / RIVER_SAMPLES;
        const p = pts[i];
        const n = normals[i];
        if (side === 0) {
          const w = outer(t);
          pos.push(p.x + n.x * w, y, p.z + n.z * w, p.x - n.x * w, y, p.z - n.z * w);
        } else {
          const a = inner(t) * side;
          const b = outer(t) * side;
          pos.push(p.x + n.x * a, y, p.z + n.z * a, p.x + n.x * b, y + 0.05, p.z + n.z * b);
        }
      }
      for (let i = 0; i < RIVER_SAMPLES; i++) {
        const k = i * 2;
        idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
      }
      const g = new BufferGeometry();
      g.setAttribute("position", new Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    };
    const half = (t: number) => riverWidth(t) / 2;
    const waterGeo = ribbon(half, half, 0.0, 0);
    const waterBase = (waterGeo.getAttribute("position") as BufferAttribute).array.slice() as Float32Array;
    const waterMat = new MeshStandardMaterial({ color: THEME.dark.water, roughness: 0.55, metalness: 0.05, transparent: true, opacity: 0.94, envMapIntensity: 0.12, side: DoubleSide });
    const water = new Mesh(waterGeo, waterMat);
    water.position.y = 0.03;
    scene.add(water);
    const bankMat = new MeshBasicMaterial({ color: THEME.dark.bank, side: DoubleSide });
    const bankL = new Mesh(ribbon(half, (t) => half(t) + 0.9, 0.01, 1), bankMat);
    const bankR = new Mesh(ribbon(half, (t) => half(t) + 0.9, 0.01, -1), bankMat);
    scene.add(bankL, bankR);
    const edgePts: number[] = [];
    for (let i = 0; i < RIVER_SAMPLES; i++) {
      for (const s of [1, -1]) {
        const a = pts[i].clone().addScaledVector(normals[i], half(i / RIVER_SAMPLES) * s);
        const b = pts[i + 1].clone().addScaledVector(normals[i + 1], half((i + 1) / RIVER_SAMPLES) * s);
        edgePts.push(a.x, 0.06, a.z, b.x, 0.06, b.z);
      }
    }
    const edgeGeo = new BufferGeometry();
    edgeGeo.setAttribute("position", new Float32BufferAttribute(edgePts, 3));
    const edgeMat = new LineBasicMaterial({ transparent: true, opacity: 0.9 });
    scene.add(new LineSegments(edgeGeo, edgeMat));

    // Current: copper flecks drifting downstream
    const FLECKS = 160;
    const fleckGeo = new BoxGeometry(0.22, 0.015, 0.035);
    const fleckMat = new MeshBasicMaterial({ color: THEME.dark.flow, transparent: true, opacity: 0.75 });
    const flecks = new InstancedMesh(fleckGeo, fleckMat, FLECKS);
    const fleckState = Array.from({ length: FLECKS }, () => ({ t: rng(), off: (rng() - 0.5) * 0.8, speed: 0.012 + rng() * 0.01 }));
    scene.add(flecks);
    const fp = new Vector3();
    const layoutFlecks = () => {
      fleckState.forEach((f, i) => {
        const t = f.t;
        RIVER.getPointAt(t, fp);
        const i0 = Math.min(RIVER_SAMPLES, Math.floor(t * RIVER_SAMPLES));
        const n = normals[i0];
        const tg = tangents[i0];
        fp.addScaledVector(n, f.off * riverWidth(t) * 0.5);
        tmp.position.set(fp.x, 0.06, fp.z);
        tmp.rotation.set(0, Math.atan2(-tg.z, tg.x), 0);
        tmp.scale.setScalar(1);
        tmp.updateMatrix();
        flecks.setMatrixAt(i, tmp.matrix);
      });
      flecks.instanceMatrix.needsUpdate = true;
    };

    // Banks: stones and reeds
    const stoneGeo = new IcosahedronGeometry(1, 0);
    const stoneMat = new MeshStandardMaterial({ color: THEME.dark.stone, roughness: 0.9, flatShading: true });
    const STONES = 90;
    const stones = new InstancedMesh(stoneGeo, stoneMat, STONES);
    for (let i = 0; i < STONES; i++) {
      const t = 0.06 + rng() * 0.8;
      const i0 = Math.floor(t * RIVER_SAMPLES);
      const side = rng() > 0.5 ? 1 : -1;
      const p = pts[i0].clone().addScaledVector(normals[i0], side * (half(t) + 0.35 + rng() * 1.6));
      const sc = 0.05 + rng() * 0.1;
      tmp.position.set(p.x, sc * 0.5, p.z);
      tmp.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      tmp.scale.set(sc * 1.4, sc, sc);
      tmp.updateMatrix();
      stones.setMatrixAt(i, tmp.matrix);
    }
    scene.add(stones);
    const reedGeo = new ConeGeometry(0.03, 1, 5);
    reedGeo.translate(0, 0.5, 0);
    const reedMat = new MeshStandardMaterial({ color: THEME.dark.reed, roughness: 1 });
    const REEDS = 160;
    const reeds = new InstancedMesh(reedGeo, reedMat, REEDS);
    for (let i = 0; i < REEDS; i++) {
      const t = 0.05 + rng() * 0.79;
      const i0 = Math.floor(t * RIVER_SAMPLES);
      const side = rng() > 0.5 ? 1 : -1;
      const p = pts[i0].clone().addScaledVector(normals[i0], side * (half(t) - 0.05 + rng() * 0.5));
      tmp.position.set(p.x, 0, p.z);
      tmp.rotation.set((rng() - 0.5) * 0.3, rng() * 3, (rng() - 0.5) * 0.3);
      tmp.scale.set(1, 0.35 + rng() * 0.4, 1);
      tmp.updateMatrix();
      reeds.setMatrixAt(i, tmp.matrix);
    }
    scene.add(reeds);

    /* ------------------------------ buoys (one per section) --------------- */
    const stops = WORLD_SECTIONS.filter((id) => id !== "hero");
    const buoyT = new Map<string, number>();
    const buoyGeo = new SphereGeometry(0.11, 16, 12);
    const buoyMat = new MeshStandardMaterial({ color: THEME.dark.flow, metalness: 0.6, roughness: 0.35 });
    const buoys = new InstancedMesh(buoyGeo, buoyMat, stops.length);
    const poleGeo = new CylinderGeometry(0.018, 0.018, 0.7, 8);
    poleGeo.translate(0, 0.35, 0);
    const poles = new InstancedMesh(poleGeo, buoyMat, stops.length);
    scene.add(buoys, poles);
    const buoyPos: Vector3[] = stops.map(() => new Vector3());
    const layoutBuoys = () => {
      stops.forEach((id, i) => {
        const t = buoyT.get(id) ?? (i + 1) / (stops.length + 1);
        const i0 = Math.min(RIVER_SAMPLES, Math.floor(t * RIVER_SAMPLES));
        const p = pts[i0].clone().addScaledVector(normals[i0], -(half(t) - 0.35)); // right bank side
        buoyPos[i].copy(p);
        tmp.position.set(p.x, 0.04, p.z);
        tmp.rotation.set(0, 0, 0);
        tmp.scale.setScalar(1);
        tmp.updateMatrix();
        poles.setMatrixAt(i, tmp.matrix);
        tmp.position.set(p.x, 0.78, p.z);
        tmp.updateMatrix();
        buoys.setMatrixAt(i, tmp.matrix);
      });
      buoys.instanceMatrix.needsUpdate = true;
      poles.instanceMatrix.needsUpdate = true;
      buoys.computeBoundingSphere();
    };

    /* ------------------------------ boat ---------------------------------- */
    const { hull, sail } = paperBoat();
    const paperMat = new MeshStandardMaterial({ color: THEME.dark.paper, roughness: 0.85, metalness: 0, side: DoubleSide, flatShading: true });
    const sailMat = new MeshStandardMaterial({ color: THEME.dark.sail, roughness: 0.7, metalness: 0.2, side: DoubleSide });
    const boat = new Group();
    boat.add(new Mesh(hull, paperMat), new Mesh(sail, sailMat));
    boat.scale.setScalar(0.9);
    scene.add(boat);
    const RIPPLES = 6;
    const rippleGeo = new RingGeometry(0.2, 0.26, 32);
    rippleGeo.rotateX(-Math.PI / 2);
    const rippleMat = new MeshBasicMaterial({ color: THEME.dark.foam, transparent: true, opacity: 0.35, depthWrite: false });
    const ripples: { mesh: Mesh; age: number }[] = [];
    for (let i = 0; i < RIPPLES; i++) {
      const m = new Mesh(rippleGeo, rippleMat.clone());
      m.visible = false;
      scene.add(m);
      ripples.push({ mesh: m, age: 99 });
    }
    let boatT = 0;
    let boatTarget = 0;
    let lastRipple = 0;
    const boatPos = new Vector3();
    const boatTan = new Vector3();

    /* ------------------------------ laptop on the bank -------------------- */
    const bodyMat = new MeshStandardMaterial({ color: BODY.dark, metalness: 0.85, roughness: 0.38, envMapIntensity: 0.9 });
    const keyMat = new MeshStandardMaterial({ color: KEYS.dark, metalness: 0.1, roughness: 0.7 });
    const bezelMat = new MeshStandardMaterial({ color: "#0b0d10", metalness: 0.2, roughness: 0.5 });
    const hingeMat = new MeshStandardMaterial({ color: "#8a5a30", metalness: 0.7, roughness: 0.5, envMapIntensity: 0.5 });
    const padMat = new MeshStandardMaterial({ color: BODY.dark, metalness: 0.6, roughness: 0.5 });
    const laptop = new Group();
    laptop.position.set(0, 0, 0);
    scene.add(laptop);
    const base = new Mesh(new BoxGeometry(W, BASE_H, D), bodyMat);
    base.position.y = BASE_H / 2;
    laptop.add(base);
    const cols = 15;
    const rows = 5;
    const keyW = 0.155;
    const keyD = 0.15;
    const keys = new InstancedMesh(new BoxGeometry(keyW, 0.025, keyD), keyMat, cols * rows + 1);
    const kbW = cols * (keyW + 0.02);
    let ki = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        tmp.position.set(-kbW / 2 + keyW / 2 + c * (keyW + 0.02), BASE_H + 0.012, -D / 2 + 0.3 + r * (keyD + 0.02));
        tmp.rotation.set(0, 0, 0);
        tmp.scale.set(1, 1, 1);
        tmp.updateMatrix();
        keys.setMatrixAt(ki++, tmp.matrix);
      }
    }
    tmp.position.set(0, BASE_H + 0.012, -D / 2 + 0.3 + rows * (keyD + 0.02));
    tmp.scale.set(5.2, 1, 1);
    tmp.updateMatrix();
    keys.setMatrixAt(ki, tmp.matrix);
    keys.instanceMatrix.needsUpdate = true;
    laptop.add(keys);
    const trackpad = new Mesh(new BoxGeometry(1.1, 0.012, 0.62), padMat);
    trackpad.position.set(0, BASE_H + 0.004, D / 2 - 0.42);
    laptop.add(trackpad);
    const hinge = new Mesh(new CylinderGeometry(0.045, 0.045, W * 0.86, 24), hingeMat);
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(0, BASE_H + 0.02, -D / 2 + 0.03);
    laptop.add(hinge);
    const lid = new Group();
    lid.position.set(0, BASE_H + 0.02, -D / 2 + 0.03);
    laptop.add(lid);
    const lidShell = new Mesh(new BoxGeometry(W, LID_H, LID_D), bodyMat);
    lidShell.position.set(0, LID_H / 2 + 0.01, LID_D / 2);
    lid.add(lidShell);
    const bezel = new Mesh(new PlaneGeometry(W - 0.1, LID_D - 0.1), bezelMat);
    bezel.rotation.x = Math.PI / 2;
    bezel.position.set(0, 0.008, LID_D / 2);
    lid.add(bezel);
    const tex = document.createElement("canvas");
    tex.width = TEX_W;
    tex.height = TEX_H;
    const ctx = tex.getContext("2d")!;
    const texture = new CanvasTexture(tex);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const screenMat = new MeshBasicMaterial({ map: texture });
    const screen = new Mesh(new PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
    screen.rotation.x = Math.PI / 2;
    screen.position.set(0, 0.006, LID_D / 2 + 0.02);
    lid.add(screen);
    const spans = [...heroTrace.spans].sort((a, b) => a.row - b.row);
    const rowH = (TEX_H - HEADER_H - PAD * 2) / spans.length;
    let hoveredRow: number | null = null;
    const drawScreen = () => {
      const palette = SPAN_PALETTE.dark;
      ctx.fillStyle = "#0f1216";
      ctx.fillRect(0, 0, TEX_W, TEX_H);
      ctx.fillStyle = "#171b21";
      ctx.fillRect(0, 0, TEX_W, HEADER_H);
      ctx.fillStyle = "#2c323b";
      ctx.fillRect(0, HEADER_H - 1, TEX_W, 1);
      ctx.font = "600 28px 'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif";
      ctx.fillStyle = "#e4e6ea";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText("Jaeger", PAD, HEADER_H / 2);
      ctx.font = "24px 'Commit Mono', Menlo, monospace";
      ctx.fillStyle = "#9aa2ad";
      ctx.fillText(`trace ${heroTrace.id}`, PAD + 120, HEADER_H / 2);
      ctx.textAlign = "right";
      ctx.fillText(`${heroTrace.spans.length} spans · ${heroTrace.services.length} services · ${formatMs(heroTrace.total)}`, TEX_W - PAD, HEADER_H / 2);
      ctx.textAlign = "left";
      const timeX0 = LABEL_W;
      const timeW = TEX_W - LABEL_W - PAD;
      ctx.font = "18px 'Commit Mono', Menlo, monospace";
      for (let ms = 0; ms <= heroTrace.total; ms += 300) {
        const x = timeX0 + (ms / heroTrace.total) * timeW;
        ctx.fillStyle = "#232830";
        ctx.fillRect(Math.round(x), HEADER_H, 1, TEX_H - HEADER_H);
        ctx.fillStyle = "#6b737e";
        ctx.fillText(`${ms}ms`, x + 6, HEADER_H + 16);
      }
      spans.forEach((s, idx) => {
        const y = HEADER_H + PAD + idx * rowH;
        if (hoveredRow === idx) {
          ctx.fillStyle = "rgba(221,154,91,0.14)";
          ctx.fillRect(0, y, TEX_W, rowH);
        }
        ctx.font = `${s.critical ? "700 " : ""}19px 'Commit Mono', Menlo, monospace`;
        ctx.fillStyle = s.critical ? "#e4e6ea" : "#9aa2ad";
        const label = `${s.service} · ${s.op}`;
        ctx.fillText(label.length > 40 ? label.slice(0, 39) + "…" : label, PAD + s.depth * 14, y + rowH / 2);
        const bx = timeX0 + (s.start / heroTrace.total) * timeW;
        const bw = Math.max(3, (s.duration / heroTrace.total) * timeW);
        ctx.fillStyle = palette[serviceColorIndex(s.service)];
        ctx.globalAlpha = s.critical ? 1 : 0.65;
        ctx.fillRect(bx, y + rowH * 0.22, bw, rowH * 0.56);
        ctx.globalAlpha = 1;
        if (s.critical) {
          ctx.strokeStyle = "#dd9a5b";
          ctx.lineWidth = 2;
          ctx.strokeRect(bx + 1, y + rowH * 0.22 + 1, bw - 2, rowH * 0.56 - 2);
        }
      });
      texture.needsUpdate = true;
    };
    drawScreen();
    if (document.fonts?.ready) document.fonts.ready.then(() => { drawScreen(); requestRender(); });
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext("2d")!;
    const grad = sctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, "rgba(0,0,0,0.5)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 256, 256);
    const shadowMat = new MeshBasicMaterial({ map: new CanvasTexture(shadowCanvas), transparent: true, depthWrite: false });
    const shadow = new Mesh(new PlaneGeometry(W * 1.6, D * 1.6), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.004, 0);
    scene.add(shadow);

    /* ------------------------------ lights -------------------------------- */
    const ambient = new AmbientLight(0xffffff, 0.9);
    const key = new DirectionalLight(0xffffff, 1.5);
    key.position.set(6, 10, 4);
    const rim = new PointLight("#78b4c6", 16, 18, 2);
    rim.position.set(-4, 3, -3);
    scene.add(ambient, key, rim);

    let theme = propsRef.current.theme;
    const applyTheme = () => {
      const t = THEME[theme];
      bodyMat.color.set(BODY[theme]);
      padMat.color.set(BODY[theme]).multiplyScalar(theme === "dark" ? 1.15 : 0.95);
      keyMat.color.set(KEYS[theme]);
      ambient.intensity = t.ambient;
      key.intensity = t.key;
      shadowMat.opacity = theme === "dark" ? 0.9 : 0.5;
      groundMat.color.set(t.ground);
      gridMat.color.set(t.grid);
      bankMat.color.set(t.bank);
      edgeMat.color.set(t.bankEdge);
      waterMat.color.set(t.water);
      fleckMat.color.set(t.flow);
      buoyMat.color.set(t.flow);
      stoneMat.color.set(t.stone);
      reedMat.color.set(t.reed);
      paperMat.color.set(t.paper);
      sailMat.color.set(t.sail);
      ripples.forEach((r) => (r.mesh.material as MeshBasicMaterial).color.set(t.foam));
      (scene.fog as Fog).color.set(t.fog);
      requestRender();
    };

    /* ------------------------------ camera -------------------------------- */
    let width = 1;
    let height = 1;
    const aspect = () => width / height;
    const fit = (size: number, fill: number) => size / (fill * 2 * HALF_TAN * aspect());
    const cur: Pose = { pos: new Vector3(3, 4, 9), target: new Vector3(0, 0.3, 0) };
    const goal: Pose = { pos: new Vector3(), target: new Vector3() };
    const ka: Pose = { pos: new Vector3(), target: new Vector3() };
    const kb: Pose = { pos: new Vector3(), target: new Vector3() };
    const follow: Pose = { pos: new Vector3(), target: new Vector3() };
    const screenCenter = new Vector3();
    const screenNormal = new Vector3();
    const right = new Vector3();
    const fwd = new Vector3();

    const heroPose = (which: "closed" | "open" | "screen", out: Pose) => {
      const narrow = narrowNow();
      if (which === "closed") {
        const d = fit(W * 1.25, narrow ? 0.95 : 0.52);
        out.pos.set(d * 0.45, d * 0.55, d * 0.8);
        out.target.set(0, 0.2, 0);
      } else if (which === "open") {
        const d = Math.max(fit(W * 1.3, narrow ? 0.95 : 0.55), (2.6 / (2 * HALF_TAN)) * 1.15);
        out.pos.set(d * 0.1, d * 0.34, d * 0.94);
        out.target.set(0, 0.85, -0.3);
      } else {
        screen.getWorldPosition(screenCenter);
        screenNormal.set(0, -1, 0).applyQuaternion(lid.getWorldQuaternion(camera.quaternion.clone()));
        const d = fit(SCREEN_W, narrow ? 0.96 : 0.9);
        out.pos.copy(screenCenter).addScaledVector(screenNormal, d);
        out.target.copy(screenCenter);
      }
    };
    /** Objects sit beside (desktop) or below (phone) the text column. */
    const applyShift = (p: Pose, amount: number) => {
      if (amount <= 0) return;
      fwd.subVectors(p.target, p.pos).normalize();
      right.crossVectors(fwd, upV).normalize();
      const dist = p.pos.distanceTo(p.target);
      if (narrowNow()) {
        const dy = dist * HALF_TAN * 0.34 * amount;
        p.pos.y += dy;
        p.target.y += dy;
      } else {
        const dx = dist * HALF_TAN * aspect() * 0.24 * amount;
        p.pos.addScaledVector(right, -dx);
        p.target.addScaledVector(right, -dx);
      }
    };
    /** Third-person follow of the boat; rises into an overview on the lake. */
    const followPose = (t: number, out: Pose) => {
      RIVER.getPointAt(t, boatPos);
      RIVER.getTangentAt(t, boatTan).normalize();
      const lake = smooth(0.84, 1, t);
      const back = MathUtils.lerp(narrowNow() ? 11 : 10, 26, lake);
      const upAmt = MathUtils.lerp(narrowNow() ? 6.5 : 5.8, 16, lake);
      out.pos.copy(boatPos).addScaledVector(boatTan, -back);
      out.pos.y += upAmt;
      out.target.copy(boatPos).addScaledVector(boatTan, MathUtils.lerp(0.8, 3, lake));
      out.target.y = MathUtils.lerp(0.1, -7, lake); // on the lake, keep the boat high in the frame
    };

    let heroKeys: { y: number; id: "closed" | "open" | "screen" }[] = [];
    let riverStart = 0;
    let riverEnd = 1;
    let lastSections = worldStore.get().sections;
    const rebuild = (s: WorldState) => {
      const vh = s.viewportH;
      const hero = s.sections.find((x) => x.id === "hero");
      heroKeys = [];
      if (hero) {
        const travel = Math.max(1, hero.height - vh);
        heroKeys = [
          { y: hero.top, id: "closed" },
          { y: hero.top + travel * 0.55, id: "open" },
          { y: hero.top + travel * 0.9, id: "screen" },
        ];
        riverStart = hero.top + hero.height - vh * 0.7;
      }
      const contact = s.sections.find((x) => x.id === "contact");
      riverEnd = contact ? contact.top + contact.height * 0.45 - vh * 0.5 : riverStart + 1;
      for (const sec of s.sections) {
        if (sec.id === "hero") continue;
        const centre = sec.top + Math.min(sec.height * 0.4, vh * 0.5) - vh * 0.45;
        buoyT.set(sec.id, MathUtils.clamp((centre - riverStart) / Math.max(1, riverEnd - riverStart), 0.03, 0.97));
      }
      layoutBuoys();
    };
    rebuild(worldStore.get());

    const computeGoal = (s: WorldState) => {
      const y = s.scrollY;
      const riverT = MathUtils.clamp((y - riverStart) / Math.max(1, riverEnd - riverStart), 0, 1);
      boatTarget = riverT;
      followPose(riverT, follow);
      applyShift(follow, 1);
      if (heroKeys.length === 3 && y < riverStart) {
        let i = 0;
        while (i < heroKeys.length - 1 && heroKeys[i + 1].y <= y) i++;
        const a = heroKeys[i];
        const b = heroKeys[Math.min(i + 1, heroKeys.length - 1)];
        const t = a === b ? 0 : smooth(a.y, b.y, y);
        heroPose(a.id, ka);
        applyShift(ka, a.id === "closed" ? 1 : a.id === "open" ? 0.3 : 0);
        heroPose(b.id, kb);
        applyShift(kb, b.id === "closed" ? 1 : b.id === "open" ? 0.3 : 0);
        goal.pos.lerpVectors(ka.pos, kb.pos, t);
        goal.target.lerpVectors(ka.target, kb.target, t);
        // Hand over to the river follow as the hero ends
        const hand = smooth(heroKeys[2].y, riverStart, y);
        goal.pos.lerp(follow.pos, hand);
        goal.target.lerp(follow.target, hand);
      } else {
        goal.pos.copy(follow.pos);
        goal.target.copy(follow.target);
      }
      // Which stop is the boat nearest to?
      let nearest = "hero";
      if (y >= riverStart) {
        let best = Infinity;
        buoyT.forEach((t, id) => {
          const d = Math.abs(t - riverT);
          if (d < best) {
            best = d;
            nearest = id;
          }
        });
      }
      if (s.section !== nearest) worldStore.set({ section: nearest });
    };

    const resize = () => {
      width = Math.max(1, host.clientWidth);
      height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      requestRender();
    };

    /* ------------------------------ loop ---------------------------------- */
    let raf = 0;
    let ready = false;
    let last = performance.now();
    let introStart: number | null = null;
    const frameTimes: number[] = [];
    let disposed = false;
    let lidAngle = 0;
    let yaw = 0.55;
    let lift = 0.12;
    let pitch = 0.1;
    let time = 0;
    const waterPos = waterGeo.getAttribute("position") as BufferAttribute;
    const bp = new Vector3();
    const labelOut: { id: string; x: number; y: number; visible: boolean }[] = stops.map((id) => ({ id, x: 0, y: 0, visible: false }));

    const frame = (now: number) => {
      raf = 0;
      if (disposed) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      if (introStart === null) introStart = now;
      const intro = Math.min(1, (now - introStart) / 1400);
      const s = worldStore.get();
      if (s.sections !== lastSections) {
        lastSections = s.sections;
        rebuild(s);
      }
      const p = s.heroProgress;

      // Laptop
      const open = smooth(0.06, 0.55, p);
      const settle = smooth(0, 0.4, p);
      const lam = intro < 1 ? 2.5 : 7;
      lidAngle = MathUtils.damp(lidAngle, -OPEN_ANGLE * open, lam, dt);
      yaw = MathUtils.damp(yaw, MathUtils.lerp(0.55, 0, smooth(0, 0.55, p)), lam, dt);
      lift = MathUtils.damp(lift, MathUtils.lerp(0.12, 0, settle), lam, dt);
      pitch = MathUtils.damp(pitch, MathUtils.lerp(0.1, 0, settle), lam, dt);
      lid.rotation.x = lidAngle;
      laptop.rotation.y = yaw;
      laptop.rotation.x = pitch;
      laptop.position.y = lift;
      shadow.position.y = lift + 0.004;
      laptop.updateMatrixWorld(true);

      // Camera goal + boat target
      computeGoal(s);

      // Water: gentle swell
      const arr = waterPos.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] = waterBase[i + 1] + Math.sin(waterBase[i] * 1.3 + time * 1.4) * 0.018 + Math.sin(waterBase[i + 2] * 2.1 + time * 0.9) * 0.012;
      }
      waterPos.needsUpdate = true;

      // Flecks drift with the current
      fleckState.forEach((f) => {
        f.t += f.speed * dt;
        if (f.t > 1) f.t -= 1;
      });
      layoutFlecks();

      // Boat follows the scroll with a little lag, bobs, and leaves ripples
      boatT = MathUtils.damp(boatT, boatTarget, 4, dt);
      RIVER.getPointAt(boatT, bp);
      RIVER.getTangentAt(boatT, boatTan).normalize();
      boat.position.set(bp.x, 0.05 + Math.sin(time * 2.2) * 0.025, bp.z);
      boat.rotation.set(Math.sin(time * 1.7) * 0.05, Math.atan2(-boatTan.z, boatTan.x), Math.sin(time * 2.6) * 0.06);
      const moving = Math.abs(boatTarget - boatT) > 0.0005;
      if (moving && time - lastRipple > 0.28) {
        lastRipple = time;
        const r = ripples.reduce((a, b) => (a.age > b.age ? a : b));
        r.age = 0;
        r.mesh.position.set(bp.x, 0.045, bp.z);
        r.mesh.visible = true;
      }
      ripples.forEach((r) => {
        if (!r.mesh.visible) return;
        r.age += dt;
        const k = 1 + r.age * 2.2;
        r.mesh.scale.set(k, 1, k);
        (r.mesh.material as MeshBasicMaterial).opacity = Math.max(0, 0.35 - r.age * 0.25);
        if (r.age > 1.4) r.mesh.visible = false;
      });

      // Camera
      const camLam = intro < 1 ? 2.2 : 5.5;
      cur.pos.x = MathUtils.damp(cur.pos.x, goal.pos.x, camLam, dt);
      cur.pos.y = MathUtils.damp(cur.pos.y, goal.pos.y, camLam, dt);
      cur.pos.z = MathUtils.damp(cur.pos.z, goal.pos.z, camLam, dt);
      cur.target.x = MathUtils.damp(cur.target.x, goal.target.x, camLam, dt);
      cur.target.y = MathUtils.damp(cur.target.y, goal.target.y, camLam, dt);
      cur.target.z = MathUtils.damp(cur.target.z, goal.target.z, camLam, dt);
      camera.position.copy(cur.pos);
      camera.up.copy(upV);
      camera.lookAt(cur.target);

      renderer.render(scene, camera);

      // Buoy labels
      for (let i = 0; i < stops.length; i++) {
        const v = buoyPos[i].clone();
        v.y = 0.95;
        v.project(camera);
        const l = labelOut[i];
        l.x = ((v.x + 1) / 2) * width;
        l.y = ((1 - v.y) / 2) * height;
        l.visible = v.z < 1 && s.scrollY >= riverStart - s.viewportH;
      }
      propsRef.current.onLabels(labelOut);

      if (!ready) {
        ready = true;
        propsRef.current.onReady();
      }
      if (intro < 1 && frameTimes.length < 40) {
        frameTimes.push(dt);
        if (frameTimes.length === 40) {
          const avg = frameTimes.reduce((a, v) => a + v, 0) / 40;
          if (avg > 0.028 && pixelRatio > 1) {
            pixelRatio = 1;
            renderer.setPixelRatio(1);
            resize();
          }
        }
      }
      requestRender(); // water and boat keep moving while the tab is visible
    };
    function requestRender() {
      if (raf || disposed || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    const onVisibility = () => {
      if (!document.hidden) requestRender();
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* ------------------------------ pointer ------------------------------- */
    const raycaster = new Raycaster();
    const ndc = new Vector2();
    let moveRaf = 0;
    let pending: PointerEvent | null = null;
    let downAt = { x: 0, y: 0, t: 0 };
    const pickAt = (e: PointerEvent): Pick | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const targets: Object3D[] = [buoys];
      if (lidAngle < -0.5) targets.push(screen);
      const hit = raycaster.intersectObjects(targets, false)[0];
      hoveredRow = null;
      if (!hit) return null;
      if (hit.object === screen && hit.uv) {
        const py = (1 - hit.uv.y) * TEX_H;
        const idx = Math.floor((py - HEADER_H - PAD) / rowH);
        if (idx >= 0 && idx < spans.length) {
          hoveredRow = idx;
          return { kind: "span", span: spans[idx] };
        }
        return null;
      }
      if (hit.object === buoys && hit.instanceId !== undefined) {
        const id = stops[hit.instanceId];
        return { kind: "buoy", id, title: SECTION_TITLES[id] ?? id };
      }
      return null;
    };
    let lastKey = "";
    const keyOf = (pk: Pick | null) => (pk ? (pk.kind === "span" ? `span:${pk.span.id}` : `buoy:${pk.id}`) : "");
    const onMove = (e: PointerEvent) => {
      pending = e;
      if (moveRaf) return;
      moveRaf = requestAnimationFrame(() => {
        moveRaf = 0;
        const ev = pending!;
        const pk = pickAt(ev);
        const k = keyOf(pk);
        if (k !== lastKey) {
          lastKey = k;
          renderer.domElement.style.cursor = pk ? "pointer" : "";
          drawScreen();
        }
        propsRef.current.onHover(pk, ev.clientX, ev.clientY);
      });
    };
    const onLeave = () => {
      if (lastKey) {
        lastKey = "";
        hoveredRow = null;
        renderer.domElement.style.cursor = "";
        drawScreen();
      }
      propsRef.current.onHover(null, 0, 0);
    };
    const onDown = (e: PointerEvent) => {
      downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6 || performance.now() - downAt.t > 600) return;
      const pk = pickAt(e);
      if (pk) propsRef.current.onPick(pk);
    };
    const el = renderer.domElement;
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    const onLost = (e: Event) => {
      e.preventDefault();
      propsRef.current.onFail();
    };
    el.addEventListener("webglcontextlost", onLost);

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();
    layoutFlecks();
    applyTheme();
    requestRender();
    apiRef.current = {
      setTheme(t) {
        theme = t;
        applyTheme();
      },
    };

    return () => {
      disposed = true;
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (raf) cancelAnimationFrame(raf);
      if (moveRaf) cancelAnimationFrame(moveRaf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("webglcontextlost", onLost);
      scene.traverse((o) => {
        const m = o as Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      [bodyMat, keyMat, bezelMat, hingeMat, padMat, screenMat, shadowMat, groundMat, gridMat, waterMat, bankMat, edgeMat, fleckMat, stoneMat, reedMat, buoyMat, paperMat, sailMat, rippleMat].forEach((m) => m.dispose());
      ripples.forEach((r) => (r.mesh.material as MeshBasicMaterial).dispose());
      texture.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      el.remove();
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    apiRef.current?.setTheme(props.theme);
  }, [props.theme]);

  return <div ref={hostRef} className="absolute inset-0" />;
}
