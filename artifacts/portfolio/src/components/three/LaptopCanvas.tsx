import { useEffect, useRef } from "react";
import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  InstancedMesh,
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
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { heroTrace, serviceColorIndex, SPAN_PALETTE, formatMs, type Span } from "@/lib/trace";
import type { ProgressStore } from "./Hero";

interface Props {
  store: ProgressStore;
  theme: "dark" | "light";
  narrow: boolean;
  active: boolean;
  onReady: () => void;
  onFail: () => void;
  onPick: (span: Span) => void;
  onHover: (span: Span | null, x: number, y: number) => void;
}

/* ---------------------------------------------------------------------------
   Laptop dimensions (scene units; 1 ≈ 10 cm)
--------------------------------------------------------------------------- */
const W = 3.0; // width
const D = 2.0; // base depth
const BASE_H = 0.1;
const LID_D = 1.95;
const LID_H = 0.06;
const SCREEN_W = 2.78;
const SCREEN_H = 1.74;
const OPEN_ANGLE = MathUtils.degToRad(106);
const FOV = 32;
const HALF_TAN = Math.tan((FOV / 2) * (Math.PI / 180));

/* Screen texture layout (pixels) */
const TEX_W = 1600;
const TEX_H = 1000;
const HEADER_H = 92;
const LABEL_W = 470;
const PAD = 28;

const BODY = { dark: "#2a2e35", light: "#c8ccd2" };
const KEYS = { dark: "#15181d", light: "#2b2f36" };

function smooth(a: number, b: number, p: number): number {
  const x = MathUtils.clamp((p - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
}

interface Pose {
  pos: Vector3;
  target: Vector3;
}

/**
 * Procedural laptop that lifts and opens as you scroll; the screen runs the
 * trace of one Jaeger AI chat turn and every row links to the work it stands
 * for. Plain three.js, renders on demand, idle when settled or off screen.
 */
export default function LaptopCanvas(props: Props) {
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
    const narrowNow = () => propsRef.current.narrow;
    let pixelRatio = Math.min(window.devicePixelRatio || 1, narrowNow() ? 1.5 : 2);
    renderer.setPixelRatio(pixelRatio);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.setAttribute("aria-hidden", "true");

    const scene = new Scene();
    const camera = new PerspectiveCamera(FOV, 1, 0.1, 60);

    // Soft studio reflections without downloading an HDRI
    const pmrem = new PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    /* ------------------------------ materials ------------------------------ */
    const bodyMat = new MeshStandardMaterial({ color: BODY.dark, metalness: 0.85, roughness: 0.38, envMapIntensity: 0.9 });
    const keyMat = new MeshStandardMaterial({ color: KEYS.dark, metalness: 0.1, roughness: 0.7 });
    const bezelMat = new MeshStandardMaterial({ color: "#0b0d10", metalness: 0.2, roughness: 0.5 });
    const hingeMat = new MeshStandardMaterial({ color: "#8a5a30", metalness: 0.7, roughness: 0.5, envMapIntensity: 0.5 });

    /* ------------------------------ geometry ------------------------------- */
    const laptop = new Group();
    scene.add(laptop);

    const base = new Mesh(new BoxGeometry(W, BASE_H, D), bodyMat);
    base.position.y = BASE_H / 2;
    laptop.add(base);

    // Keyboard: instanced key caps
    const cols = 15;
    const rows = 5;
    const keyW = 0.155;
    const keyD = 0.15;
    const keyGeo = new BoxGeometry(keyW, 0.025, keyD);
    const keys = new InstancedMesh(keyGeo, keyMat, cols * rows + 1);
    const tmp = new Object3D();
    const kbW = cols * (keyW + 0.02);
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        tmp.position.set(-kbW / 2 + keyW / 2 + c * (keyW + 0.02), BASE_H + 0.012, -D / 2 + 0.3 + r * (keyD + 0.02));
        tmp.scale.set(1, 1, 1);
        tmp.updateMatrix();
        keys.setMatrixAt(i++, tmp.matrix);
      }
    }
    // Space bar
    tmp.position.set(0, BASE_H + 0.012, -D / 2 + 0.3 + rows * (keyD + 0.02));
    tmp.scale.set(5.2, 1, 1);
    tmp.updateMatrix();
    keys.setMatrixAt(i, tmp.matrix);
    keys.instanceMatrix.needsUpdate = true;
    laptop.add(keys);

    const trackpad = new Mesh(new BoxGeometry(1.1, 0.012, 0.62), new MeshStandardMaterial({ color: BODY.dark, metalness: 0.6, roughness: 0.5 }));
    trackpad.position.set(0, BASE_H + 0.004, D / 2 - 0.42);
    laptop.add(trackpad);

    const hinge = new Mesh(new CylinderGeometry(0.045, 0.045, W * 0.86, 24), hingeMat);
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(0, BASE_H + 0.02, -D / 2 + 0.03);
    laptop.add(hinge);

    // Lid pivots at the hinge; closed = lying flat on the base
    const lid = new Group();
    lid.position.set(0, BASE_H + 0.02, -D / 2 + 0.03);
    laptop.add(lid);

    const lidShell = new Mesh(new BoxGeometry(W, LID_H, LID_D), bodyMat);
    lidShell.position.set(0, LID_H / 2 + 0.01, LID_D / 2);
    lid.add(lidShell);

    const bezel = new Mesh(new PlaneGeometry(W - 0.1, LID_D - 0.1), bezelMat);
    bezel.rotation.x = Math.PI / 2; // faces -y when closed (toward the keys)
    bezel.position.set(0, 0.008, LID_D / 2);
    lid.add(bezel);

    /* ------------------------------ screen -------------------------------- */
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
    let hovered: number | null = null; // index into `spans`

    const drawScreen = () => {
      const palette = SPAN_PALETTE.dark; // a screen is always a dark UI
      ctx.fillStyle = "#0f1216";
      ctx.fillRect(0, 0, TEX_W, TEX_H);
      // Header
      ctx.fillStyle = "#171b21";
      ctx.fillRect(0, 0, TEX_W, HEADER_H);
      ctx.fillStyle = "#2c323b";
      ctx.fillRect(0, HEADER_H - 1, TEX_W, 1);
      ctx.font = "600 28px 'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif";
      ctx.fillStyle = "#e4e6ea";
      ctx.textBaseline = "middle";
      ctx.fillText("Jaeger", PAD, HEADER_H / 2);
      ctx.font = "24px 'Commit Mono', Menlo, monospace";
      ctx.fillStyle = "#9aa2ad";
      ctx.fillText(`trace ${heroTrace.id}`, PAD + 120, HEADER_H / 2);
      const right = `${heroTrace.spans.length} spans · ${heroTrace.services.length} services · ${formatMs(heroTrace.total)}`;
      ctx.textAlign = "right";
      ctx.fillText(right, TEX_W - PAD, HEADER_H / 2);
      ctx.textAlign = "left";
      // Time ticks
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
      // Rows
      spans.forEach((s, idx) => {
        const y = HEADER_H + PAD + idx * rowH;
        if (hovered === idx) {
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
    // Redraw once the web fonts are in, so the screen uses them too.
    if (document.fonts?.ready) document.fonts.ready.then(() => { drawScreen(); requestRender(); });

    /* ------------------------------ shadow -------------------------------- */
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext("2d")!;
    const grad = sctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, "rgba(0,0,0,0.55)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 256, 256);
    const shadowMat = new MeshBasicMaterial({ map: new CanvasTexture(shadowCanvas), transparent: true, depthWrite: false });
    const shadow = new Mesh(new PlaneGeometry(W * 1.6, D * 1.6), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.001;
    scene.add(shadow);

    /* ------------------------------ lights -------------------------------- */
    const ambient = new AmbientLight(0xffffff, 0.6);
    const key = new DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 6, 4);
    const rim = new PointLight("#78b4c6", 20, 20, 2);
    rim.position.set(-4, 3, -3);
    scene.add(ambient, key, rim);

    let theme = propsRef.current.theme;
    const applyTheme = () => {
      bodyMat.color.set(BODY[theme]);
      (trackpad.material as MeshStandardMaterial).color.set(BODY[theme]).multiplyScalar(theme === "dark" ? 1.15 : 0.95);
      keyMat.color.set(KEYS[theme]);
      ambient.intensity = theme === "dark" ? 0.6 : 1.1;
      key.intensity = theme === "dark" ? 1.4 : 1.9;
      shadowMat.opacity = theme === "dark" ? 0.9 : 0.5;
      requestRender();
    };

    /* ------------------------------ camera -------------------------------- */
    const cur: Pose = { pos: new Vector3(3, 4, 9), target: new Vector3(0, 0.3, 0) };
    const goal: Pose = { pos: new Vector3(), target: new Vector3() };
    const pa: Pose = { pos: new Vector3(), target: new Vector3() };
    const pb: Pose = { pos: new Vector3(), target: new Vector3() };
    const pc: Pose = { pos: new Vector3(), target: new Vector3() };
    const screenCenter = new Vector3();
    const screenNormal = new Vector3();
    const upWorld = new Vector3(0, 1, 0);

    let width = 1;
    let height = 1;
    const aspect = () => width / height;

    /** Camera distance so that `size` world units fill `fill` of the viewport width. */
    const fit = (size: number, fill: number) => size / (fill * 2 * HALF_TAN * aspect());

    const poses = (p: number) => {
      const narrow = narrowNow();
      // A: closed, three-quarter view, laptop beside (desktop) or below (phone) the headline
      const dA = fit(W * 1.25, narrow ? 0.95 : 0.52);
      const visW = 2 * dA * HALF_TAN * aspect();
      const visH = 2 * dA * HALF_TAN;
      pa.pos.set(dA * 0.45, dA * 0.55, dA * 0.8);
      pa.target.set(narrow ? 0 : -visW * 0.2, 0.2 + (narrow ? visH * 0.28 : 0), 0);
      // B: open, front view, whole laptop in frame
      const dB = Math.max(fit(W * 1.3, narrow ? 0.95 : 0.55), (2.6 / (2 * HALF_TAN)) * 1.15);
      const visWB = 2 * dB * HALF_TAN * aspect();
      const visHB = 2 * dB * HALF_TAN;
      pb.pos.set(dB * 0.1, dB * 0.34, dB * 0.94);
      pb.target.set(narrow ? 0 : -visWB * 0.05, 0.85 + (narrow ? visHB * 0.1 : 0), -0.3);
      // C: screen fills the view
      screen.getWorldPosition(screenCenter);
      screenNormal.set(0, -1, 0).applyQuaternion(lid.getWorldQuaternion(new (Object.getPrototypeOf(camera.quaternion).constructor)()));
      const dC = fit(SCREEN_W, narrow ? 0.96 : 0.9);
      pc.pos.copy(screenCenter).addScaledVector(screenNormal, dC);
      pc.target.copy(screenCenter);

      if (p < 0.55) {
        const t = smooth(0.0, 0.55, p);
        goal.pos.lerpVectors(pa.pos, pb.pos, t);
        goal.target.lerpVectors(pa.target, pb.target, t);
      } else {
        const t = smooth(0.55, 0.9, p);
        goal.pos.lerpVectors(pb.pos, pc.pos, t);
        goal.target.lerpVectors(pb.target, pc.target, t);
      }
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
    let active = propsRef.current.active;
    let ready = false;
    let last = performance.now();
    let introStart: number | null = null;
    const frameTimes: number[] = [];
    let disposed = false;
    let lidAngle = 0;
    let yaw = 0.55;
    let lift = -0.35;
    let pitch = 0.1;

    const frame = (now: number) => {
      raf = 0;
      if (disposed) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (introStart === null) introStart = now;
      const intro = Math.min(1, (now - introStart) / 1400);
      const p = propsRef.current.store.value;

      // Laptop: lift, level out and open
      const open = smooth(0.06, 0.55, p);
      const settle = smooth(0, 0.4, p);
      const goalAngle = -OPEN_ANGLE * open;
      const goalYaw = MathUtils.lerp(0.55, 0.0, smooth(0, 0.55, p));
      const goalLift = MathUtils.lerp(-0.35, 0, settle);
      const goalPitch = MathUtils.lerp(0.1, 0, settle);
      const lam = intro < 1 ? 2.5 : 7;
      lidAngle = MathUtils.damp(lidAngle, goalAngle, lam, dt);
      yaw = MathUtils.damp(yaw, goalYaw, lam, dt);
      lift = MathUtils.damp(lift, goalLift, lam, dt);
      pitch = MathUtils.damp(pitch, goalPitch, lam, dt);
      lid.rotation.x = lidAngle;
      laptop.rotation.y = yaw;
      laptop.rotation.x = pitch;
      laptop.position.y = lift;
      shadow.position.y = lift - 0.001;
      shadow.scale.setScalar(1 + (lift + 0.35) * 0.4);
      laptop.updateMatrixWorld(true);

      poses(p);
      const camLam = intro < 1 ? 2.2 : 5.5;
      cur.pos.x = MathUtils.damp(cur.pos.x, goal.pos.x, camLam, dt);
      cur.pos.y = MathUtils.damp(cur.pos.y, goal.pos.y, camLam, dt);
      cur.pos.z = MathUtils.damp(cur.pos.z, goal.pos.z, camLam, dt);
      cur.target.x = MathUtils.damp(cur.target.x, goal.target.x, camLam, dt);
      cur.target.y = MathUtils.damp(cur.target.y, goal.target.y, camLam, dt);
      cur.target.z = MathUtils.damp(cur.target.z, goal.target.z, camLam, dt);
      camera.position.copy(cur.pos);
      camera.up.copy(upWorld);
      camera.lookAt(cur.target);

      renderer.render(scene, camera);

      if (!ready) {
        ready = true;
        propsRef.current.onReady();
      }
      if (intro < 1 && frameTimes.length < 40) {
        frameTimes.push(dt);
        if (frameTimes.length === 40) {
          const avg = frameTimes.reduce((s, v) => s + v, 0) / 40;
          if (avg > 0.028 && pixelRatio > 1) {
            pixelRatio = 1;
            renderer.setPixelRatio(1);
            resize();
          }
        }
      }

      const settled =
        cur.pos.distanceToSquared(goal.pos) < 1e-5 &&
        cur.target.distanceToSquared(goal.target) < 1e-5 &&
        Math.abs(lidAngle - goalAngle) < 1e-4 &&
        Math.abs(yaw - goalYaw) < 1e-4 &&
        Math.abs(lift - goalLift) < 1e-4;
      if (!settled || intro < 1) requestRender();
    };

    function requestRender() {
      if (!active || raf || disposed) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    /* ------------------------------ pointer ------------------------------- */
    const raycaster = new Raycaster();
    const ndc = new Vector2();
    let moveRaf = 0;
    let pendingMove: PointerEvent | null = null;
    let downAt = { x: 0, y: 0, t: 0 };
    const pick = (e: PointerEvent): number | null => {
      if (lidAngle > -0.5) return null; // screen not readable yet
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObject(screen, false)[0];
      if (!hit || !hit.uv) return null;
      const py = (1 - hit.uv.y) * TEX_H;
      const idx = Math.floor((py - HEADER_H - PAD) / rowH);
      return idx >= 0 && idx < spans.length ? idx : null;
    };
    const onMove = (e: PointerEvent) => {
      pendingMove = e;
      if (moveRaf) return;
      moveRaf = requestAnimationFrame(() => {
        moveRaf = 0;
        const ev = pendingMove!;
        const idx = pick(ev);
        if (idx !== hovered) {
          hovered = idx;
          renderer.domElement.style.cursor = idx === null ? "" : "pointer";
          drawScreen();
          requestRender();
        }
        propsRef.current.onHover(idx === null ? null : spans[idx], ev.clientX, ev.clientY);
      });
    };
    const onLeave = () => {
      if (hovered !== null) {
        hovered = null;
        renderer.domElement.style.cursor = "";
        drawScreen();
        requestRender();
      }
      propsRef.current.onHover(null, 0, 0);
    };
    const onDown = (e: PointerEvent) => {
      downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const onUp = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
      if (moved > 6 || performance.now() - downAt.t > 600) return;
      const idx = pick(e);
      if (idx !== null) propsRef.current.onPick(spans[idx]);
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
    applyTheme();
    const unsubscribe = propsRef.current.store.subscribe(requestRender);

    apiRef.current = {
      setTheme(t) {
        theme = t;
        applyTheme();
      },
      setActive(a) {
        active = a;
        if (a) requestRender();
        else if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
    };

    return () => {
      disposed = true;
      unsubscribe();
      ro.disconnect();
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
      [bodyMat, keyMat, bezelMat, hingeMat, screenMat, shadowMat, trackpad.material as MeshStandardMaterial].forEach((m) => m.dispose());
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

  useEffect(() => {
    apiRef.current?.setActive(props.active);
  }, [props.active]);

  return <div ref={hostRef} className="absolute inset-0" />;
}
