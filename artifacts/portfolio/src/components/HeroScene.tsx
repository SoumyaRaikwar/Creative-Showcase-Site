import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface HeroSceneProps {
  mouseX: number;
  mouseY: number;
}

function Particle({ x, y, size, opacity, duration }: {
  x: number; y: number; size: number; opacity: number; duration: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: "hsl(38 85% 52%)",
        opacity,
      }}
      animate={{ y: [0, -12, 0], opacity: [opacity, opacity * 0.4, opacity] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay: Math.random() * duration }}
    />
  );
}

function createMarsTexture(THREE: any) {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(
    size * 0.35,
    size * 0.3,
    size * 0.12,
    size * 0.5,
    size * 0.5,
    size * 0.68,
  );
  gradient.addColorStop(0, "#d98a49");
  gradient.addColorStop(0.38, "#b45d30");
  gradient.addColorStop(1, "#6f2e1c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 160; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 24 + Math.random() * 140;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = Math.random() > 0.5;
    if (dark) {
      g.addColorStop(0, "rgba(90, 34, 21, 0.35)");
      g.addColorStop(1, "rgba(90, 34, 21, 0)");
    } else {
      g.addColorStop(0, "rgba(238, 165, 94, 0.25)");
      g.addColorStop(1, "rgba(238, 165, 94, 0)");
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 46; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 4 + Math.random() * 16;
    ctx.strokeStyle = "rgba(255, 215, 145, 0.15)";
    ctx.lineWidth = 1 + Math.random() * 1.8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(76, 28, 16, 0.18)";
    ctx.beginPath();
    ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export default function HeroScene({ mouseX, mouseY }: HeroSceneProps) {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: mouseX, y: mouseY });

  useEffect(() => {
    mouseRef.current.x = mouseX;
    mouseRef.current.y = mouseY;
  }, [mouseX, mouseY]);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    setWebglOk(!!gl);
  }, []);

  useEffect(() => {
    if (webglOk !== true || !mountRef.current) return;

    let cancelled = false;

    async function init() {
      try {
        const THREE = await import("three");

        const w = mountRef.current!.clientWidth;
        const h = mountRef.current!.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
        camera.position.z = 4;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);
        if (cancelled) { renderer.dispose(); return; }
        mountRef.current!.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.34);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffb069, 1.6);
        pointLight.position.set(4.8, 3.8, 5.8);
        scene.add(pointLight);
        const pointLight2 = new THREE.PointLight(0x8b3a1a, 0.5);
        pointLight2.position.set(-4.2, -2.5, -2.8);
        scene.add(pointLight2);

        const marsTexture = createMarsTexture(THREE);
        const planetGeo = new THREE.SphereGeometry(1.28, 96, 96);
        const planetMat = new THREE.MeshStandardMaterial({
          map: marsTexture,
          color: 0xffffff,
          roughness: 0.92,
          metalness: 0.03,
          emissive: 0x2c1108,
          emissiveIntensity: 0.16,
        });
        const planet = new THREE.Mesh(planetGeo, planetMat);
        scene.add(planet);

        const atmosphereGeo = new THREE.SphereGeometry(1.35, 64, 64);
        const atmosphereMat = new THREE.MeshBasicMaterial({
          color: 0xf0a65b,
          transparent: true,
          opacity: 0.1,
          side: THREE.BackSide,
        });
        const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
        scene.add(atmosphere);

        const orbitRingGeo = new THREE.TorusGeometry(1.72, 0.01, 12, 220);
        const orbitRingMat = new THREE.MeshBasicMaterial({
          color: 0xe09d4d,
          transparent: true,
          opacity: 0.18,
        });
        const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
        orbitRing.rotation.x = Math.PI * 0.45;
        orbitRing.rotation.y = Math.PI * 0.2;
        scene.add(orbitRing);

        const orbitRing2 = new THREE.Mesh(
          new THREE.TorusGeometry(2.02, 0.008, 10, 180),
          new THREE.MeshBasicMaterial({
            color: 0xc67d38,
            transparent: true,
            opacity: 0.12,
          }),
        );
        orbitRing2.rotation.x = Math.PI * 0.58;
        orbitRing2.rotation.y = -Math.PI * 0.12;
        scene.add(orbitRing2);

        const moonGeo = new THREE.SphereGeometry(0.095, 20, 20);
        const moonMat = new THREE.MeshStandardMaterial({
          color: 0xc88b54,
          roughness: 0.88,
          metalness: 0.02,
        });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        scene.add(moon);

        const count = 1800;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 18;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
        }
        const ptGeo = new THREE.BufferGeometry();
        ptGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const ptMat = new THREE.PointsMaterial({
          color: 0xd38b42,
          size: 0.022,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        });
        const points = new THREE.Points(ptGeo, ptMat);
        scene.add(points);

        const animate = (t: number) => {
          if (cancelled) return;
          animFrameRef.current = requestAnimationFrame(animate);
          const time = t / 1000;
          const mx = mouseRef.current.x;
          const my = mouseRef.current.y;

          planet.rotation.y = time * 0.12 + mx * 0.18;
          planet.rotation.x = my * 0.08 + Math.sin(time * 0.25) * 0.02;
          planet.position.y = Math.sin(time * 0.45) * 0.08;

          atmosphere.rotation.y = planet.rotation.y * 1.04;
          atmosphere.rotation.x = planet.rotation.x * 1.02;
          atmosphere.position.y = planet.position.y;

          orbitRing.rotation.z = time * 0.04;
          orbitRing2.rotation.z = -time * 0.03;

          const moonAngle = time * 0.42;
          moon.position.set(
            Math.cos(moonAngle) * 1.92,
            Math.sin(moonAngle * 1.4) * 0.24,
            Math.sin(moonAngle) * 0.62,
          );

          points.rotation.y = time * 0.015;
          points.rotation.x = time * 0.008;

          camera.position.x += ((mx * 0.18) - camera.position.x) * 0.04;
          camera.position.y += ((my * 0.12) - camera.position.y) * 0.04;
          camera.lookAt(0, 0, 0);

          renderer.render(scene, camera);
        };

        const onResize = () => {
          if (!mountRef.current) return;
          const nw = mountRef.current.clientWidth;
          const nh = mountRef.current.clientHeight;
          camera.aspect = nw / nh;
          camera.updateProjectionMatrix();
          renderer.setSize(nw, nh);
        };
        window.addEventListener("resize", onResize, { passive: true });

        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
          cancelled = true;
          window.removeEventListener("resize", onResize);
          cancelAnimationFrame(animFrameRef.current);
          planetGeo.dispose();
          planetMat.dispose();
          atmosphereGeo.dispose();
          atmosphereMat.dispose();
          orbitRingGeo.dispose();
          orbitRingMat.dispose();
          orbitRing2.geometry.dispose();
          (orbitRing2.material as any).dispose?.();
          moonGeo.dispose();
          moonMat.dispose();
          ptGeo.dispose();
          ptMat.dispose();
          marsTexture?.dispose();
          renderer.dispose();
          if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
            mountRef.current.removeChild(renderer.domElement);
          }
        };
      } catch {
        setWebglOk(false);
        return undefined;
      }
    }

    let cleanup: (() => void) | undefined;
    init().then((fn) => { if (fn) cleanup = fn; });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [webglOk]);

  if (webglOk === null) return null;

  if (!webglOk) {
    const particles = Array.from({ length: 38 }, (_, i) => ({
      x: (Math.sin(i * 137.508 * Math.PI / 180) * 40 + 50),
      y: (Math.cos(i * 137.508 * Math.PI / 180) * 40 + 50),
      size: Math.random() * 4 + 1.5,
      opacity: 0.2 + Math.random() * 0.5,
      duration: 2 + Math.random() * 4,
    }));

    const rotX = mouseY * 18;
    const rotY = mouseX * 18;

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => <Particle key={i} {...p} />)}
        <motion.div
          className="absolute right-12 top-1/2 -translate-y-1/2"
          style={{
            width: 320,
            height: 320,
            transformStyle: "preserve-3d",
            perspective: 800,
          }}
          animate={{
            rotateX: rotX,
            rotateY: rotY,
          }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        >
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: "hsl(24 74% 46% / 0.35)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          />
          {/* Middle ring */}
          <motion.div
            className="absolute inset-8 rounded-full border"
            style={{ borderColor: "hsl(18 60% 38% / 0.26)", transform: "rotateX(65deg)" }}
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner ring */}
          <motion.div
            className="absolute inset-16 rounded-full border"
            style={{ borderColor: "hsl(14 62% 44% / 0.44)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          {/* Core */}
          <div
            className="absolute inset-24 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(21 76% 44% / 0.48) 0%, hsl(12 52% 24% / 0.16) 70%, transparent 100%)",
              boxShadow: "0 0 46px hsl(20 72% 44% / 0.25)",
            }}
          />
          {/* Orbit dot */}
          <motion.div
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: "hsl(38 85% 52%)",
              top: "50%",
              left: "50%",
              marginTop: -6,
              marginLeft: -6,
              transformOrigin: "6px -130px",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: "hsl(16 68% 52%)",
              top: "50%",
              left: "50%",
              marginTop: -4,
              marginLeft: -4,
              transformOrigin: "4px 100px",
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    );
  }

  return <div ref={mountRef} className="absolute inset-0" style={{ pointerEvents: "none" }} />;
}
