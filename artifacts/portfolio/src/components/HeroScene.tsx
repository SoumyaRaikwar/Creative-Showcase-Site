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

const TEXTURES = {
  earthDay: "/textures/earth/earth_daymap_2k.jpg",
  earthClouds: "/textures/earth/earth_clouds_2k.jpg",
  earthNormal: "/textures/earth/earth_normal_2048.jpg",
  earthSpecular: "/textures/earth/earth_specular_2048.jpg",
  earthLights: "/textures/earth/earth_lights_2048.png",
  marsAlbedo: "/textures/mars/nasa_mars_albedo.jpg",
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
        const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
        camera.position.set(0, 0.1, 5.4);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        if (cancelled) {
          renderer.dispose();
          return;
        }
        mountRef.current!.appendChild(renderer.domElement);

        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
        const anisotropy = Math.min(maxAnisotropy, 8);

        const [earthDay, earthClouds, earthNormal, earthSpecular, earthLights, marsAlbedo] = await Promise.all([
          loadTexture(THREE, TEXTURES.earthDay),
          loadTexture(THREE, TEXTURES.earthClouds),
          loadTexture(THREE, TEXTURES.earthNormal),
          loadTexture(THREE, TEXTURES.earthSpecular),
          loadTexture(THREE, TEXTURES.earthLights),
          loadTexture(THREE, TEXTURES.marsAlbedo),
        ]);

        if (cancelled) {
          renderer.dispose();
          return;
        }

        [earthDay, earthClouds, marsAlbedo, earthLights].forEach((t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = anisotropy;
        });
        earthNormal.anisotropy = anisotropy;
        earthSpecular.anisotropy = anisotropy;

        const marsBump = createBumpTextureFromColor(THREE, marsAlbedo, anisotropy);

        // --- Lighting: warm sun key light + soft fill so planets always read clearly ---
        const ambientLight = new THREE.AmbientLight(0x9fb0d8, 0.55);
        scene.add(ambientLight);

        const sunPosition = new THREE.Vector3(2.6, 1.5, -1.1);
        const sunLight = new THREE.PointLight(0xffd9a8, 34, 30, 1.15);
        sunLight.position.copy(sunPosition);
        scene.add(sunLight);

        const fillLight = new THREE.DirectionalLight(0x6f8fc4, 0.5);
        fillLight.position.set(-3, -1, 3);
        scene.add(fillLight);

        // Sun kept only as an invisible light source (sunLight above) — no visible
        // sun mesh in the scene, per direction to drop it entirely.

        const systemGroup = new THREE.Group();
        scene.add(systemGroup);

        // --- Earth ---
        const earthOrbit = new THREE.Group();
        earthOrbit.rotation.x = 0.34;
        earthOrbit.rotation.z = -0.08;
        systemGroup.add(earthOrbit);

        const earthPivot = new THREE.Group();
        earthOrbit.add(earthPivot);

        const earthGeo = new THREE.SphereGeometry(0.42, 64, 64);
        const earthMat = new THREE.MeshPhongMaterial({
          map: earthDay,
          normalMap: earthNormal,
          specularMap: earthSpecular,
          specular: new THREE.Color(0x333333),
          shininess: 8,
          emissiveMap: earthLights,
          emissive: new THREE.Color(0xffdca0),
          emissiveIntensity: 0.55,
        });
        const earth = new THREE.Mesh(earthGeo, earthMat);
        earth.rotation.z = 0.41;
        earthPivot.add(earth);

        const cloudsGeo = new THREE.SphereGeometry(0.428, 64, 64);
        const cloudsMat = new THREE.MeshPhongMaterial({
          map: earthClouds,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        });
        const clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
        clouds.rotation.z = 0.41;
        earthPivot.add(clouds);

        const earthAtmoGeo = new THREE.SphereGeometry(0.45, 48, 48);
        const earthAtmoMat = new THREE.MeshBasicMaterial({
          color: 0x6fb2ff,
          transparent: true,
          opacity: 0.16,
          side: THREE.BackSide,
        });
        earthPivot.add(new THREE.Mesh(earthAtmoGeo, earthAtmoMat));

        // --- Mars (smaller, farther orbit) ---
        const marsOrbit = new THREE.Group();
        marsOrbit.rotation.x = -0.22;
        marsOrbit.rotation.z = 0.14;
        systemGroup.add(marsOrbit);

        const marsPivot = new THREE.Group();
        marsOrbit.add(marsPivot);

        const marsGeo = new THREE.SphereGeometry(0.24, 48, 48);
        const marsMat = new THREE.MeshStandardMaterial({
          map: marsAlbedo,
          bumpMap: marsBump,
          bumpScale: 0.05,
          roughness: 0.9,
          metalness: 0.02,
          emissive: 0x34170b,
          emissiveIntensity: 0.12,
        });
        const mars = new THREE.Mesh(marsGeo, marsMat);
        marsPivot.add(mars);

        const marsAtmoGeo = new THREE.SphereGeometry(0.257, 32, 32);
        const marsAtmoMat = new THREE.MeshBasicMaterial({
          color: 0xea9e61,
          transparent: true,
          opacity: 0.15,
          side: THREE.BackSide,
        });
        marsPivot.add(new THREE.Mesh(marsAtmoGeo, marsAtmoMat));

        // --- A tiny moon around Earth for depth ---
        const moonGeo = new THREE.SphereGeometry(0.09, 20, 20);
        const moonMat = new THREE.MeshStandardMaterial({ color: 0xb9b4ac, roughness: 0.95, metalness: 0.01 });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        earthPivot.add(moon);

        // --- Faint orbit rings ---
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffb066, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
        const earthRing = new THREE.Mesh(new THREE.RingGeometry(1.55, 1.558, 128), ringMat);
        earthOrbit.add(earthRing);
        const marsRing = new THREE.Mesh(new THREE.RingGeometry(2.35, 2.358, 128), ringMat.clone());
        marsOrbit.add(marsRing);

        systemGroup.position.set(0.55, 0.05, -0.6);

        // --- Starfield ---
        const count = 2600;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i += 1) {
          positions[i * 3] = (Math.random() - 0.5) * 22;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 22 - 3;
        }
        const ptGeo = new THREE.BufferGeometry();
        ptGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const ptMat = new THREE.PointsMaterial({
          color: 0xf0e2cc,
          size: 0.016,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.6,
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

          earth.rotation.y = time * 0.12;
          clouds.rotation.y = time * 0.16;
          mars.rotation.y = time * 0.09;

          const earthAngle = time * 0.16;
          earthPivot.position.set(Math.cos(earthAngle) * 1.55, 0, Math.sin(earthAngle) * 1.55);
          moon.position.set(Math.cos(time * 0.9) * 0.66, Math.sin(time * 0.9 * 1.3) * 0.1, Math.sin(time * 0.9) * 0.66);

          const marsAngle = time * 0.09 + 2.1;
          marsPivot.position.set(Math.cos(marsAngle) * 2.35, 0, Math.sin(marsAngle) * 2.35);

          systemGroup.rotation.y = time * 0.015 + mx * 0.05;
          systemGroup.rotation.x = my * 0.03;

          points.rotation.y = time * 0.007;
          points.rotation.x = time * 0.004;

          camera.position.x += ((mx * 0.28) - camera.position.x) * 0.035;
          camera.position.y += ((0.1 + my * 0.18) - camera.position.y) * 0.035;
          camera.lookAt(0.4, 0, -0.4);

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

          scene.traverse((obj: any) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
              else obj.material.dispose();
            }
          });

          [earthDay, earthClouds, earthNormal, earthSpecular, earthLights, marsAlbedo].forEach((t) => t.dispose());
          marsBump?.dispose();

          renderer.dispose();
          if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
            mountRef.current.removeChild(renderer.domElement);
          }
        };
      } catch (err) {
        console.error("HeroScene init failed", err);
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
            width: 280,
            height: 280,
            transformStyle: "preserve-3d",
            perspective: 800,
            border: "1px solid hsl(26 74% 52% / 0.26)",
            background:
              "radial-gradient(circle at 35% 30%, hsl(29 82% 66% / 0.4) 0%, hsl(205 60% 45% / 0.28) 42%, hsl(13 59% 24% / 0.16) 70%, transparent 100%)",
            boxShadow: "0 0 44px hsl(24 76% 50% / 0.2)",
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
            style={{ border: "1px solid hsl(200 60% 58% / 0.2)", transform: "rotateX(63deg)" }}
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    );
  }

  return <div ref={mountRef} className="absolute inset-0" style={{ pointerEvents: "none" }} />;
}
