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

export default function HeroScene({ mouseX, mouseY }: HeroSceneProps) {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);

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
        rendererRef.current = renderer;
        mountRef.current!.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xe8a44a, 1.2);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);
        const pointLight2 = new THREE.PointLight(0x8b3a1a, 0.4);
        pointLight2.position.set(-5, -3, -3);
        scene.add(pointLight2);

        const geo = new THREE.IcosahedronGeometry(1.4, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0xc07a2a, roughness: 0.4, metalness: 0.6, transparent: true, opacity: 0.85 });
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);

        const wireGeo = new THREE.IcosahedronGeometry(1.42, 1);
        const wireMat = new THREE.MeshBasicMaterial({ color: 0xd4903a, wireframe: true, transparent: true, opacity: 0.22 });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        scene.add(wire);

        const count = 1800;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 18;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
        }
        const ptGeo = new THREE.BufferGeometry();
        ptGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const ptMat = new THREE.PointsMaterial({ color: 0xc07a2a, size: 0.025, sizeAttenuation: true, transparent: true, opacity: 0.5, depthWrite: false });
        const points = new THREE.Points(ptGeo, ptMat);
        scene.add(points);

        let mx = 0;
        let my = 0;

        const animate = (t: number) => {
          if (cancelled) return;
          animFrameRef.current = requestAnimationFrame(animate);
          const time = t / 1000;
          mesh.rotation.x = time * 0.08 + my * 0.3;
          mesh.rotation.y = time * 0.12 + mx * 0.3;
          wire.rotation.x = mesh.rotation.x;
          wire.rotation.y = mesh.rotation.y;
          mesh.position.y = Math.sin(time * 0.5) * 0.15;
          wire.position.y = mesh.position.y;
          points.rotation.y = time * 0.015;
          points.rotation.x = time * 0.008;
          renderer.render(scene, camera);
        };

        const onMouseMove = (e: MouseEvent) => {
          mx = (e.clientX / window.innerWidth - 0.5) * 2;
          my = -(e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener("mousemove", onMouseMove, { passive: true });

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
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("resize", onResize);
          cancelAnimationFrame(animFrameRef.current);
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
            style={{ borderColor: "hsl(38 85% 52% / 0.4)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          />
          {/* Middle ring */}
          <motion.div
            className="absolute inset-8 rounded-full border"
            style={{ borderColor: "hsl(38 85% 52% / 0.25)", transform: "rotateX(65deg)" }}
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner ring */}
          <motion.div
            className="absolute inset-16 rounded-full border"
            style={{ borderColor: "hsl(16 68% 42% / 0.5)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          {/* Core */}
          <div
            className="absolute inset-24 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(38 85% 52% / 0.3) 0%, hsl(38 85% 52% / 0.05) 70%, transparent 100%)",
              boxShadow: "0 0 40px hsl(38 85% 52% / 0.2)",
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
