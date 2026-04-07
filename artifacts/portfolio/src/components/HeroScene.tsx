import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function FloatingMesh({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current || !wireRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x = t * 0.08 + mouseY * 0.3;
    meshRef.current.rotation.y = t * 0.12 + mouseX * 0.3;
    wireRef.current.rotation.x = meshRef.current.rotation.x;
    wireRef.current.rotation.y = meshRef.current.rotation.y;
    meshRef.current.position.y = Math.sin(t * 0.5) * 0.15;
    wireRef.current.position.y = meshRef.current.position.y;
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshStandardMaterial
          color="#c07a2a"
          roughness={0.4}
          metalness={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.42, 1]} />
        <meshBasicMaterial color="#d4903a" wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function ParticleField() {
  const count = 1800;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    return pos;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.015;
    pointsRef.current.rotation.x = state.clock.elapsedTime * 0.008;
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#c07a2a"
        size={0.025}
        sizeAttenuation
        depthWrite={false}
        opacity={0.5}
      />
    </Points>
  );
}

function FallbackScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated SVG fallback for non-WebGL environments */}
      <svg width="100%" height="100%" viewBox="0 0 600 600" style={{ opacity: 0.25 }}>
        <defs>
          <radialGradient id="grd1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c07a2a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#c07a2a" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Rotating polygon */}
        <g transform="translate(300,300)">
          <animateTransform attributeName="transform" attributeType="XML"
            type="rotate" from="0 300 300" to="360 300 300" dur="18s" repeatCount="indefinite" additive="sum" />
          <polygon points="0,-160 138,-80 138,80 0,160 -138,80 -138,-80"
            fill="none" stroke="#c07a2a" strokeWidth="1" opacity="0.6" />
          <polygon points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55"
            fill="none" stroke="#d4903a" strokeWidth="0.5" opacity="0.4" />
          <circle cx="0" cy="-160" r="4" fill="#c07a2a" opacity="0.8" />
          <circle cx="138" cy="-80" r="4" fill="#c07a2a" opacity="0.8" />
          <circle cx="138" cy="80" r="4" fill="#c07a2a" opacity="0.8" />
          <circle cx="0" cy="160" r="4" fill="#c07a2a" opacity="0.8" />
          <circle cx="-138" cy="80" r="4" fill="#c07a2a" opacity="0.8" />
          <circle cx="-138" cy="-80" r="4" fill="#c07a2a" opacity="0.8" />
        </g>
        {/* Scattered dots */}
        {Array.from({ length: 40 }).map((_, i) => (
          <circle
            key={i}
            cx={Math.sin(i * 137.5 * Math.PI / 180) * 250 + 300}
            cy={Math.cos(i * 137.5 * Math.PI / 180) * 250 + 300}
            r={Math.random() * 2 + 0.5}
            fill="#c07a2a"
            opacity={0.3 + Math.random() * 0.4}
          />
        ))}
        <circle cx="300" cy="300" r="220" fill="url(#grd1)" />
      </svg>
    </div>
  );
}

interface HeroSceneProps {
  mouseX: number;
  mouseY: number;
}

export default function HeroScene({ mouseX, mouseY }: HeroSceneProps) {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setWebglSupported(!!gl);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  if (webglSupported === null) return null;

  if (!webglSupported) {
    return <FallbackScene />;
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 55 }}
      style={{ background: "transparent" }}
      dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#e8a44a" />
      <pointLight position={[-5, -3, -3]} intensity={0.4} color="#8b3a1a" />
      <ParticleField />
      <FloatingMesh mouseX={mouseX} mouseY={mouseY} />
    </Canvas>
  );
}
