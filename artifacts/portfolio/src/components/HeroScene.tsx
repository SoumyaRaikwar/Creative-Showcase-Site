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
        background: "hsl(33 90% 60%)",
        opacity,
      }}
      animate={{ y: [0, -12, 0], opacity: [opacity, opacity * 0.4, opacity] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay: Math.random() * duration }}
    />
  );
}

const MARS_TEXTURES = {
  albedo: "/textures/mars/nasa_mars_albedo.jpg",
};

function loadTexture(THREE: any, path: string) {
  return new Promise<any>((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(path, resolve, undefined, reject);
  });
}

function createBumpTextureFromColor(THREE: any, colorTexture: any, anisotropy: number) {
  const image = colorTexture.image as HTMLImageElement | HTMLCanvasElement;
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] * 0.299) + (data[i + 1] * 0.587) + (data[i + 2] * 0.114);
    const boosted = Math.max(0, Math.min(255, (lum - 128) * 1.35 + 128));
    data[i] = boosted;
    data[i + 1] = boosted;
    data[i + 2] = boosted;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);

  const bump = new THREE.CanvasTexture(canvas);
  bump.anisotropy = anisotropy;
  bump.needsUpdate = true;
  return bump;
}

function createDustTexture(THREE: any, anisotropy: number) {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);

  for (let i = 0; i < 120; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 16 + Math.random() * 130;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255, 186, 118, 0.25)");
    g.addColorStop(1, "rgba(255, 186, 118, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 38; i += 1) {
    ctx.strokeStyle = "rgba(255, 208, 160, 0.18)";
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * size,
      Math.random() * size,
      70 + Math.random() * 280,
      12 + Math.random() * 48,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = anisotropy;
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
        if (cancelled) {
          renderer.dispose();
          return;
        }
        mountRef.current!.appendChild(renderer.domElement);

        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
        const anisotropy = Math.min(maxAnisotropy, 8);

        const marsAlbedo = await loadTexture(THREE, MARS_TEXTURES.albedo);
        if (cancelled) {
          marsAlbedo.dispose();
          renderer.dispose();
          return;
        }

        marsAlbedo.colorSpace = THREE.SRGBColorSpace;
        marsAlbedo.anisotropy = anisotropy;

        const marsBump = createBumpTextureFromColor(THREE, marsAlbedo, anisotropy);
        const dustAlpha = createDustTexture(THREE, anisotropy);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffd9b6, 1.35);
        sunLight.position.set(5.2, 3.2, 5.7);
        scene.add(sunLight);

        const bounceLight = new THREE.DirectionalLight(0x9a4e28, 0.42);
        bounceLight.position.set(-4.6, -1.6, -3.5);
        scene.add(bounceLight);

        const planetGeo = new THREE.SphereGeometry(1.25, 96, 96);
        const planetMat = new THREE.MeshStandardMaterial({
          map: marsAlbedo,
          bumpMap: marsBump,
          bumpScale: 0.06,
          roughness: 0.9,
          metalness: 0.02,
          emissive: 0x34170b,
          emissiveIntensity: 0.14,
        });
        const planet = new THREE.Mesh(planetGeo, planetMat);
        scene.add(planet);

        const dustGeo = new THREE.SphereGeometry(1.295, 96, 96);
        const dustMat = new THREE.MeshPhongMaterial({
          map: dustAlpha,
          alphaMap: dustAlpha,
          color: 0xf1ac70,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        });
        const dustLayer = new THREE.Mesh(dustGeo, dustMat);
        scene.add(dustLayer);

        const atmosphereGeo = new THREE.SphereGeometry(1.34, 64, 64);
        const atmosphereMat = new THREE.MeshBasicMaterial({
          color: 0xea9e61,
          transparent: true,
          opacity: 0.13,
          side: THREE.BackSide,
        });
        const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
        scene.add(atmosphere);

        const phobosGeo = new THREE.SphereGeometry(0.05, 18, 18);
        const phobosMat = new THREE.MeshStandardMaterial({
          color: 0x9f8062,
          roughness: 0.92,
          metalness: 0.01,
        });
        const phobos = new THREE.Mesh(phobosGeo, phobosMat);
        scene.add(phobos);

        const deimosGeo = new THREE.SphereGeometry(0.032, 14, 14);
        const deimosMat = new THREE.MeshStandardMaterial({
          color: 0x8d725f,
          roughness: 0.94,
          metalness: 0.01,
        });
        const deimos = new THREE.Mesh(deimosGeo, deimosMat);
        scene.add(deimos);

        const count = 1800;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i += 1) {
          positions[i * 3] = (Math.random() - 0.5) * 18;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
        }
        const ptGeo = new THREE.BufferGeometry();
        ptGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const ptMat = new THREE.PointsMaterial({
          color: 0xe8a663,
          size: 0.02,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.45,
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

          planet.rotation.y = time * 0.1 + mx * 0.18;
          planet.rotation.x = my * 0.07 + Math.sin(time * 0.24) * 0.015;
          planet.position.y = Math.sin(time * 0.42) * 0.065;

          dustLayer.rotation.y = planet.rotation.y * 1.26 + time * 0.06;
          dustLayer.rotation.x = planet.rotation.x * 1.04;
          dustLayer.position.y = planet.position.y;

          atmosphere.rotation.y = planet.rotation.y * 1.05;
          atmosphere.rotation.x = planet.rotation.x * 1.02;
          atmosphere.position.y = planet.position.y;

          const phobosAngle = time * 0.72;
          phobos.position.set(
            Math.cos(phobosAngle) * 1.75,
            Math.sin(phobosAngle * 1.8) * 0.11,
            Math.sin(phobosAngle) * 0.32,
          );

          const deimosAngle = time * 0.38 + 1.2;
          deimos.position.set(
            Math.cos(deimosAngle) * 2.08,
            Math.sin(deimosAngle * 1.2) * 0.18,
            Math.sin(deimosAngle) * 0.56,
          );

          points.rotation.y = time * 0.013;
          points.rotation.x = time * 0.007;

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
          dustGeo.dispose();
          dustMat.dispose();
          atmosphereGeo.dispose();
          atmosphereMat.dispose();
          phobosGeo.dispose();
          phobosMat.dispose();
          deimosGeo.dispose();
          deimosMat.dispose();
          ptGeo.dispose();
          ptMat.dispose();

          marsAlbedo.dispose();
          marsBump?.dispose();
          dustAlpha?.dispose();

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

    const rotX = mouseY * 16;
    const rotY = mouseX * 16;

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => <Particle key={i} {...p} />)}
        <motion.div
          className="absolute right-12 top-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 320,
            height: 320,
            transformStyle: "preserve-3d",
            perspective: 800,
            border: "1px solid hsl(26 74% 52% / 0.26)",
            background:
              "radial-gradient(circle at 35% 30%, hsl(29 82% 66% / 0.52) 0%, hsl(18 68% 39% / 0.36) 42%, hsl(13 59% 24% / 0.2) 70%, transparent 100%)",
            boxShadow: "0 0 44px hsl(24 76% 50% / 0.26)",
          }}
          animate={{ rotateX: rotX, rotateY: rotY }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        >
          <motion.div
            className="absolute inset-4 rounded-full"
            style={{ border: "1px solid hsl(28 78% 74% / 0.22)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-12 rounded-full"
            style={{ border: "1px solid hsl(18 64% 58% / 0.2)", transform: "rotateX(63deg)" }}
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    );
  }

  return <div ref={mountRef} className="absolute inset-0" style={{ pointerEvents: "none" }} />;
}
