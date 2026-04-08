import { useEffect, useRef, useState } from "react";

const INTERACTIVE_SELECTOR =
  "a, button, input, textarea, select, label, [role='button'], [data-cursor='hover']";
const DESKTOP_POINTER_QUERY = "(any-hover: hover) and (any-pointer: fine)";

type StarParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  tilt: number;
};

export default function CursorEffect() {
  const [enabled, setEnabled] = useState(false);
  const starRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<StarParticle[]>([]);
  const lastPointRef = useRef({ x: 0, y: 0, t: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const targetAngleRef = useRef(0);
  const currentAngleRef = useRef(0);
  const hoveringRef = useRef(false);
  const visibleRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canUseFinePointer = window.matchMedia(DESKTOP_POINTER_QUERY).matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setEnabled(canUseFinePointer && !prefersReducedMotion);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const star = starRef.current;
    const canvas = canvasRef.current;
    if (!star || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;
    const dpr = Math.max(window.devicePixelRatio || 1, 1);

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const setVisible = (isVisible: boolean) => {
      const opacity = isVisible ? "1" : "0";
      star.style.opacity = opacity;
      canvas.style.opacity = opacity;
    };

    const spawnStars = (x: number, y: number, speed: number) => {
      const count = Math.min(3, Math.max(1, Math.floor(speed / 28)));

      for (let i = 0; i < count; i += 1) {
        const maxLife = 18 + Math.random() * 18;
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 3,
          y: y + (Math.random() - 0.5) * 3,
          vx: (Math.random() - 0.5) * 0.9,
          vy: 0.3 + Math.random() * 0.6 + speed * 0.004,
          life: maxLife,
          maxLife,
          size: 1 + Math.random() * (hoveringRef.current ? 1.2 : 0.8),
          tilt: Math.random() * Math.PI,
        });
      }

      if (particlesRef.current.length > 90) {
        particlesRef.current.splice(0, particlesRef.current.length - 90);
      }
    };

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;

      const now = performance.now();
      const dt = Math.max(now - (lastPointRef.current.t || now), 1);
      const dx = event.clientX - lastPointRef.current.x;
      const dy = event.clientY - lastPointRef.current.y;
      const speed = Math.hypot(dx, dy) / dt * 16;
      velocityRef.current = { x: dx, y: dy };
      if (speed > 0.01) {
        targetAngleRef.current = (Math.atan2(dy, dx) * 180) / Math.PI;
      }

      targetRef.current.x = event.clientX;
      targetRef.current.y = event.clientY;
      spawnStars(event.clientX, event.clientY, speed);
      lastPointRef.current = { x: event.clientX, y: event.clientY, t: now };

      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }
    };

    const handleOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const target = event.target as Element | null;
      hoveringRef.current = !!target?.closest(INTERACTIVE_SELECTOR);
    };

    const handleOut = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (!event.relatedTarget) {
        visibleRef.current = false;
        setVisible(false);
      }
    };

    const animate = () => {
      const lerp = 0.18;
      smoothRef.current.x += (targetRef.current.x - smoothRef.current.x) * lerp;
      smoothRef.current.y += (targetRef.current.y - smoothRef.current.y) * lerp;
      currentAngleRef.current += (targetAngleRef.current - currentAngleRef.current) * 0.15;

      const scale = hoveringRef.current ? 1.35 : 1;
      star.style.transform = `translate3d(${targetRef.current.x - 7}px, ${targetRef.current.y - 7}px, 0) scale(${scale}) rotate(${currentAngleRef.current + 45}deg)`;

      context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.life -= 1;
        if (particle.life <= 0) return false;

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.02;
        particle.vx *= 0.99;
        const alpha = particle.life / particle.maxLife;

        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(particle.x - particle.vx * 9, particle.y - particle.vy * 9);
        context.strokeStyle = `rgba(255, 185, 102, ${alpha * 0.28})`;
        context.lineWidth = Math.max(0.6, particle.size * 0.7);
        context.stroke();

        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.tilt);
        context.strokeStyle = `rgba(255, 236, 182, ${alpha * 0.76})`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(-particle.size, 0);
        context.lineTo(particle.size, 0);
        context.moveTo(0, -particle.size);
        context.lineTo(0, particle.size);
        context.stroke();
        context.restore();

        return (
          particle.x > -20 &&
          particle.x < window.innerWidth + 20 &&
          particle.y > -20 &&
          particle.y < window.innerHeight + 20
        );
      });

      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerover", handleOver, { passive: true });
    window.addEventListener("pointerout", handleOut, { passive: true });

    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerover", handleOver);
      window.removeEventListener("pointerout", handleOut);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <canvas ref={canvasRef} className="cursor-fx cursor-stars-canvas" aria-hidden />
      <div ref={starRef} className="cursor-fx cursor-shooting-star" aria-hidden>
        <span className="cursor-star-line cursor-star-line-a" />
        <span className="cursor-star-line cursor-star-line-b" />
      </div>
    </>
  );
}
