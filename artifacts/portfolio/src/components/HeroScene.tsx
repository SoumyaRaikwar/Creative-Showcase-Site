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
        background: "hsl(205 94% 68%)",
        opacity,
      }}
      animate={{ y: [0, -12, 0], opacity: [opacity, opacity * 0.4, opacity] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay: Math.random() * duration }}
    />
  );
}

const EARTH_TEXTURES = {
  day: "/textures/earth/earth_daymap_2k.jpg",
  clouds: "/textures/earth/earth_clouds_2k.jpg",
  normal: "/textures/earth/earth_normal_2048.jpg",
  specular: "/textures/earth/earth_specular_2048.jpg",
  lights: "/textures/earth/earth_lights_2048.png",
};

function loadTexture(THREE: any, path: string) {
  return new Promise<any>((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(path, resolve, undefined, reject);
  });
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

        const [dayMap, cloudsMap, normalMap, specularMap, lightsMap] = await Promise.all([
          loadTexture(THREE, EARTH_TEXTURES.day),
          loadTexture(THREE, EARTH_TEXTURES.clouds),
          loadTexture(THREE, EARTH_TEXTURES.normal),
          loadTexture(THREE, EARTH_TEXTURES.specular),
          loadTexture(THREE, EARTH_TEXTURES.lights),
        ]);

        if (cancelled) {
          dayMap.dispose();
          cloudsMap.dispose();
          normalMap.dispose();
          specularMap.dispose();
          lightsMap.dispose();
          renderer.dispose();
          return;
        }

        dayMap.colorSpace = THREE.SRGBColorSpace;
        cloudsMap.colorSpace = THREE.SRGBColorSpace;
        lightsMap.colorSpace = THREE.SRGBColorSpace;

        dayMap.anisotropy = anisotropy;
        cloudsMap.anisotropy = anisotropy;
        normalMap.anisotropy = anisotropy;
        specularMap.anisotropy = anisotropy;
        lightsMap.anisotropy = anisotropy;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.44);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.18);
        sunLight.position.set(5.2, 3.1, 5.6);
        scene.add(sunLight);

        const rimLight = new THREE.DirectionalLight(0x7bb7ff, 0.4);
        rimLight.position.set(-4.4, -1.8, -3.2);
        scene.add(rimLight);

        const planetGeo = new THREE.SphereGeometry(1.25, 96, 96);
        const planetMat = new THREE.MeshPhongMaterial({
          map: dayMap,
          normalMap,
          normalScale: new THREE.Vector2(0.58, 0.58),
          specularMap,
          specular: new THREE.Color(0x3a67a8),
          shininess: 18,
        });
        const planet = new THREE.Mesh(planetGeo, planetMat);
        scene.add(planet);

        const lightsGeo = new THREE.SphereGeometry(1.252, 96, 96);
        const lightsMat = new THREE.MeshBasicMaterial({
          map: lightsMap,
          transparent: true,
          blending: THREE.AdditiveBlending,
          opacity: 0.38,
          depthWrite: false,
        });
        const cityLights = new THREE.Mesh(lightsGeo, lightsMat);
        scene.add(cityLights);

        const cloudGeo = new THREE.SphereGeometry(1.285, 96, 96);
        const cloudMat = new THREE.MeshPhongMaterial({
          map: cloudsMap,
          alphaMap: cloudsMap,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
          side: THREE.DoubleSide,
          color: 0xffffff,
        });
        const clouds = new THREE.Mesh(cloudGeo, cloudMat);
        scene.add(clouds);

        const atmosphereGeo = new THREE.SphereGeometry(1.34, 64, 64);
        const atmosphereMat = new THREE.MeshBasicMaterial({
          color: 0x6db9ff,
          transparent: true,
          opacity: 0.13,
          side: THREE.BackSide,
        });
        const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
        scene.add(atmosphere);

        const moonGeo = new THREE.SphereGeometry(0.09, 24, 24);
        const moonMat = new THREE.MeshStandardMaterial({
          color: 0xb3bed2,
          roughness: 0.9,
          metalness: 0.02,
        });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        scene.add(moon);

        const count = 1400;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i += 1) {
          positions[i * 3] = (Math.random() - 0.5) * 18;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
        }
        const ptGeo = new THREE.BufferGeometry();
        ptGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const ptMat = new THREE.PointsMaterial({
          color: 0x8cc8ff,
          size: 0.018,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.42,
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

          planet.rotation.y = time * 0.08 + mx * 0.16;
          planet.rotation.x = my * 0.05 + Math.sin(time * 0.2) * 0.01;
          planet.position.y = Math.sin(time * 0.42) * 0.06;

          cityLights.rotation.y = planet.rotation.y;
          cityLights.rotation.x = planet.rotation.x;
          cityLights.position.y = planet.position.y;

          clouds.rotation.y = planet.rotation.y * 1.15 + time * 0.04;
          clouds.rotation.x = planet.rotation.x * 1.04;
          clouds.position.y = planet.position.y;

          atmosphere.rotation.y = planet.rotation.y * 1.02;
          atmosphere.rotation.x = planet.rotation.x * 1.01;
          atmosphere.position.y = planet.position.y;

          const moonAngle = time * 0.34;
          moon.position.set(
            Math.cos(moonAngle) * 1.9,
            Math.sin(moonAngle * 1.3) * 0.2,
            Math.sin(moonAngle) * 0.68,
          );

          points.rotation.y = time * 0.012;
          points.rotation.x = time * 0.006;

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
          lightsGeo.dispose();
          lightsMat.dispose();
          cloudGeo.dispose();
          cloudMat.dispose();
          atmosphereGeo.dispose();
          atmosphereMat.dispose();
          moonGeo.dispose();
          moonMat.dispose();
          ptGeo.dispose();
          ptMat.dispose();

          dayMap.dispose();
          cloudsMap.dispose();
          normalMap.dispose();
          specularMap.dispose();
          lightsMap.dispose();

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
            border: "1px solid hsl(209 88% 74% / 0.22)",
            background:
              "radial-gradient(circle at 35% 30%, hsl(194 85% 71% / 0.52) 0%, hsl(211 70% 38% / 0.34) 42%, hsl(221 62% 24% / 0.18) 70%, transparent 100%)",
            boxShadow: "0 0 42px hsl(205 72% 56% / 0.2)",
          }}
          animate={{ rotateX: rotX, rotateY: rotY }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        >
          <motion.div
            className="absolute inset-3 rounded-full"
            style={{ border: "1px solid hsl(194 84% 84% / 0.22)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-10 rounded-full"
            style={{ border: "1px solid hsl(204 84% 82% / 0.18)", transform: "rotateX(65deg)" }}
            animate={{ rotate: -360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    );
  }

  return <div ref={mountRef} className="absolute inset-0" style={{ pointerEvents: "none" }} />;
}
