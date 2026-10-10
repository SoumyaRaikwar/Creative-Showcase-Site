import { useEffect, useRef } from "react";
import {
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  NoToneMapping,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { serviceGraph, type GraphNode } from "@/lib/graph";
import { serviceColorIndex, SPAN_PALETTE } from "@/lib/trace";

interface Props {
  theme: "dark" | "light";
  active: boolean;
  onReady: () => void;
  onFail: () => void;
  onHover: (node: GraphNode | null) => void;
  onPick: (node: GraphNode) => void;
  /** Called every frame with each node's screen position (CSS px) for HTML labels. */
  onLayout: (positions: { id: string; x: number; y: number; z: number }[]) => void;
}

const FOV = 36;
const WIRE = { dark: "#dd9a5b", light: "#9a5a1f" };
const LINE = { dark: "#3a414c", light: "#c9ccc4" };

/** Tiny 3D force layout: springs on edges, repulsion between all nodes. */
function layout(): Map<string, Vector3> {
  const pos = new Map<string, Vector3>();
  const n = serviceGraph.nodes.length;
  serviceGraph.nodes.forEach((node, i) => {
    const a = (i / n) * Math.PI * 2;
    pos.set(node.id, new Vector3(Math.cos(a) * 2.2, (i % 2 ? 0.6 : -0.6) + Math.sin(a * 2) * 0.4, Math.sin(a) * 2.2));
  });
  const vel = new Map(serviceGraph.nodes.map((nd) => [nd.id, new Vector3()]));
  const d = new Vector3();
  for (let iter = 0; iter < 260; iter++) {
    for (const a of serviceGraph.nodes) {
      const f = vel.get(a.id)!;
      for (const b of serviceGraph.nodes) {
        if (a === b) continue;
        d.subVectors(pos.get(a.id)!, pos.get(b.id)!);
        const dist = Math.max(0.2, d.length());
        f.addScaledVector(d.normalize(), 1.6 / (dist * dist));
      }
      f.addScaledVector(pos.get(a.id)!, -0.03); // gravity toward the centre
    }
    for (const e of serviceGraph.edges) {
      d.subVectors(pos.get(e.to)!, pos.get(e.from)!);
      const dist = d.length();
      const k = (dist - 2.0) * 0.08;
      vel.get(e.from)!.addScaledVector(d.normalize(), k);
      vel.get(e.to)!.addScaledVector(d, -k);
    }
    for (const nd of serviceGraph.nodes) {
      const v = vel.get(nd.id)!;
      pos.get(nd.id)!.addScaledVector(v, 0.5);
      v.multiplyScalar(0.35);
    }
  }
  // Centre, flatten a little so labels overlap less, and normalise to radius 2.2
  const c = new Vector3();
  pos.forEach((p) => c.add(p));
  c.divideScalar(pos.size);
  let maxR = 0;
  pos.forEach((p) => {
    p.sub(c);
    p.y *= 0.6;
    maxR = Math.max(maxR, p.length());
  });
  pos.forEach((p) => p.multiplyScalar(2.2 / Math.max(0.1, maxR)));
  return pos;
}

export default function GraphCanvas(props: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const apiRef = useRef<{ setTheme: (t: "dark" | "light") => void; setActive: (a: boolean) => void } | null>(null);

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.setAttribute("aria-hidden", "true");

    const scene = new Scene();
    const camera = new PerspectiveCamera(FOV, 1, 0.1, 50);
    const world = new Group();
    scene.add(world);
    const positions = layout();
    const nodes = serviceGraph.nodes;
    const edges = serviceGraph.edges;

    /* nodes */
    const nodeGeo = new SphereGeometry(1, 24, 18);
    const nodeMat = new MeshStandardMaterial({ metalness: 0.2, roughness: 0.5 });
    const nodeMesh = new InstancedMesh(nodeGeo, nodeMat, nodes.length);
    const tmp = new Object3D();
    const radius = (n: GraphNode) => 0.16 + Math.sqrt(n.spans) * 0.06;
    nodes.forEach((n, i) => {
      tmp.position.copy(positions.get(n.id)!);
      tmp.scale.setScalar(radius(n));
      tmp.updateMatrix();
      nodeMesh.setMatrixAt(i, tmp.matrix);
    });
    nodeMesh.instanceMatrix.needsUpdate = true;
    world.add(nodeMesh);

    /* edges */
    const linePts: number[] = [];
    for (const e of edges) {
      const a = positions.get(e.from)!;
      const b = positions.get(e.to)!;
      linePts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const lineGeo = new BufferGeometry();
    lineGeo.setAttribute("position", new Float32BufferAttribute(linePts, 3));
    const lineMat = new LineBasicMaterial({ transparent: true, opacity: 0.7 });
    world.add(new LineSegments(lineGeo, lineMat));

    /* particles: one pulse per call on each edge, flowing from → to */
    const pulses: { edge: number; t: number; speed: number }[] = [];
    edges.forEach((e, ei) => {
      for (let k = 0; k < Math.min(6, e.calls); k++) {
        pulses.push({ edge: ei, t: k / Math.min(6, e.calls), speed: 0.25 + Math.random() * 0.15 });
      }
    });
    const pulseGeo = new SphereGeometry(0.045, 10, 8);
    const pulseMat = new MeshStandardMaterial({ emissive: new Color(WIRE.dark), emissiveIntensity: 1.2, color: WIRE.dark, roughness: 0.4 });
    const pulseMesh = new InstancedMesh(pulseGeo, pulseMat, pulses.length);
    world.add(pulseMesh);

    /* lights */
    const ambient = new AmbientLight(0xffffff, 0.9);
    const key = new DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 5, 4);
    scene.add(ambient, key);

    let theme = propsRef.current.theme;
    let hovered: number | null = null;
    const color = new Color();
    const paint = () => {
      const palette = SPAN_PALETTE[theme];
      nodes.forEach((n, i) => {
        color.set(palette[serviceColorIndex(n.id)]);
        if (hovered === i) color.lerp(new Color("#ffffff"), 0.3);
        nodeMesh.setColorAt(i, color);
      });
      if (nodeMesh.instanceColor) nodeMesh.instanceColor.needsUpdate = true;
      lineMat.color.set(LINE[theme]);
      pulseMat.color.set(WIRE[theme]);
      pulseMat.emissive.set(WIRE[theme]);
      ambient.intensity = theme === "dark" ? 0.9 : 1.4;
    };

    /* camera + interaction */
    let width = 1;
    let height = 1;
    let rotY = 0.4;
    let rotX = -0.15;
    let autoSpin = true;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    const resize = () => {
      width = Math.max(1, host.clientWidth);
      height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      // Fit a sphere of radius 2.2 (+ node size + labels) whatever the rotation
      const halfTan = Math.tan((FOV / 2) * (Math.PI / 180));
      const R = 2.2 + 0.9;
      const dist = (R / (halfTan * Math.min(camera.aspect, 1))) * 1.1;
      camera.position.set(0, 0.3, dist);
      camera.lookAt(0, 0, 0);
    };

    let raf = 0;
    let active = propsRef.current.active;
    let last = performance.now();
    let ready = false;
    let disposed = false;
    const screen = new Vector3();
    const a = new Vector3();
    const b = new Vector3();
    const frame = (now: number) => {
      raf = 0;
      if (disposed) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (autoSpin && !dragging) rotY += dt * 0.12;
      rotY += velX;
      velX *= 0.92;
      world.rotation.set(rotX, rotY, 0);

      for (let i = 0; i < pulses.length; i++) {
        const p = pulses[i];
        p.t += dt * p.speed;
        if (p.t > 1) p.t -= 1;
        const e = edges[p.edge];
        a.copy(positions.get(e.from)!);
        b.copy(positions.get(e.to)!);
        tmp.position.lerpVectors(a, b, p.t);
        tmp.scale.setScalar(e.critical ? 1.3 : 1);
        tmp.updateMatrix();
        pulseMesh.setMatrixAt(i, tmp.matrix);
      }
      pulseMesh.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
      world.updateMatrixWorld();
      const out = nodes.map((n) => {
        screen.copy(positions.get(n.id)!).applyMatrix4(world.matrixWorld).project(camera);
        return { id: n.id, x: ((screen.x + 1) / 2) * width, y: ((1 - screen.y) / 2) * height, z: screen.z };
      });
      propsRef.current.onLayout(out);
      if (!ready) {
        ready = true;
        propsRef.current.onReady();
      }
      if (active) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && active && !disposed) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const raycaster = new Raycaster();
    const ndc = new Vector2();
    const pick = (e: PointerEvent): number | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObject(nodeMesh, false)[0];
      return hit && hit.instanceId !== undefined ? hit.instanceId : null;
    };
    let downAt = { x: 0, y: 0, t: 0 };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        velX = dx * 0.004;
        rotX = MathUtils.clamp(rotX + dy * 0.004, -1.2, 1.2);
        autoSpin = false;
        return;
      }
      const id = pick(e);
      if (id !== hovered) {
        hovered = id;
        renderer.domElement.style.cursor = id === null ? "grab" : "pointer";
        paint();
        propsRef.current.onHover(id === null ? null : nodes[id]);
      }
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      renderer.domElement.releasePointerCapture(e.pointerId);
      const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
      if (moved < 6 && performance.now() - downAt.t < 600) {
        const id = pick(e);
        if (id !== null) propsRef.current.onPick(nodes[id]);
      }
      setTimeout(() => (autoSpin = true), 4000);
    };
    const onLeave = () => {
      if (hovered !== null) {
        hovered = null;
        paint();
        propsRef.current.onHover(null);
      }
      renderer.domElement.style.cursor = "grab";
    };
    const el = renderer.domElement;
    el.style.cursor = "grab";
    el.style.touchAction = "pan-y";
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", onLeave);
    const onLost = (e: Event) => {
      e.preventDefault();
      propsRef.current.onFail();
    };
    el.addEventListener("webglcontextlost", onLost);

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();
    paint();
    start();

    apiRef.current = {
      setTheme(t) {
        theme = t;
        paint();
      },
      setActive(v) {
        active = v;
        if (v) start();
        else if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
    };

    return () => {
      disposed = true;
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("webglcontextlost", onLost);
      [nodeGeo, lineGeo, pulseGeo].forEach((g) => g.dispose());
      [nodeMat, lineMat, pulseMat].forEach((m) => m.dispose());
      renderer.dispose();
      el.remove();
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    apiRef.current?.setTheme(props.theme);
  }, [props.theme]);
  useEffect(() => {
    apiRef.current?.setActive(props.active);
  }, [props.active]);

  return <div ref={hostRef} className="absolute inset-0" />;
}
